const { AsyncLocalStorage } = require('node:async_hooks');

function normalizeQuery(sql, args) {
  let text = String(sql);
  let values;

  if (args.length === 1 && args[0] && typeof args[0] === 'object' && !Array.isArray(args[0])) {
    const input = args[0];
    values = [];
    text = text.replace(/@([A-Za-z][A-Za-z0-9_]*)/g, (_match, name) => {
      values.push(input[name]);
      return `$${values.length}`;
    });
  } else {
    values = args;
    let index = 0;
    text = text.replace(/\?/g, () => `$${++index}`);
  }

  text = text.replace(/([\w.]+)\s*=\s*(\$\d+)\s+COLLATE\s+NOCASE/gi, 'LOWER($1) = LOWER($2)');
  text = text.replace(/\s+COLLATE\s+NOCASE/gi, '');
  text = text.replace(/\sLIKE\s/gi, ' ILIKE ');

  const ignoreInsert = /^\s*INSERT\s+OR\s+IGNORE\s+INTO\s+/i.test(text);
  if (ignoreInsert) {
    text = text.replace(/^\s*INSERT\s+OR\s+IGNORE\s+INTO\s+/i, 'INSERT INTO ');
    text = `${text.trim().replace(/;$/, '')} ON CONFLICT DO NOTHING`;
  }

  return { text, values };
}

class PostgresDatabase {
  constructor(pool) {
    this.pool = pool;
    this.context = new AsyncLocalStorage();
    this.isPostgres = true;
  }

  query(sql, args = []) {
    const client = this.context.getStore() || this.pool;
    return client.query(sql, args);
  }

  prepare(sql) {
    return {
      get: async (...args) => {
        const query = normalizeQuery(sql, args);
        const result = await this.query(query.text, query.values);
        return result.rows[0];
      },
      all: async (...args) => {
        const query = normalizeQuery(sql, args);
        const result = await this.query(query.text, query.values);
        return result.rows;
      },
      run: async (...args) => {
        if (/DELETE\s+FROM\s+sqlite_sequence/i.test(sql)) {
          return { changes: 0, lastInsertRowid: undefined };
        }
        const query = normalizeQuery(sql, args);
        const insert = query.text.match(/^\s*INSERT\s+INTO\s+([A-Za-z_][A-Za-z0-9_]*)/i);
        const hasReturning = /\sRETURNING\s/i.test(query.text);
        const tableWithId = insert && !['sessions'].includes(insert[1].toLowerCase());
        if (tableWithId && !hasReturning) {
          query.text = `${query.text.trim().replace(/;$/, '')} RETURNING id`;
        }
        const result = await this.query(query.text, query.values);
        return {
          changes: result.rowCount,
          lastInsertRowid: result.rows[0]?.id
        };
      }
    };
  }

  transaction(callback) {
    return async (...args) => {
      const client = await this.pool.connect();
      try {
        await client.query('BEGIN');
        const result = await this.context.run(client, () => callback(...args));
        await client.query('COMMIT');
        return result;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    };
  }

  async exec(sql) {
    await this.query(sql);
  }

  async close() {
    await this.pool.end();
  }
}

module.exports = PostgresDatabase;
