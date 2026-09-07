function normalizeArgs(args) {
  return args.map((value) => value === undefined ? null : value);
}

function normalizeQuery(sql, args) {
  let text = String(sql);
  let values;

  if (args.length === 1 && args[0] && typeof args[0] === 'object' && !Array.isArray(args[0])) {
    const input = args[0];
    values = [];
    text = text.replace(/@([A-Za-z][A-Za-z0-9_]*)/g, (_match, name) => {
      values.push(input[name]);
      return '?';
    });
  } else {
    values = args;
  }

  return { text, values: normalizeArgs(values) };
}

class D1Database {
  constructor(database) {
    this.database = database;
    // Existing repositories use their asynchronous transaction path for
    // remote databases. D1 statements are asynchronous as well.
    this.isPostgres = true;
  }

  prepare(sql) {
    return {
      get: async (...args) => {
        const query = normalizeQuery(sql, args);
        return this.database.prepare(query.text).bind(...query.values).first();
      },
      all: async (...args) => {
        const query = normalizeQuery(sql, args);
        const result = await this.database.prepare(query.text).bind(...query.values).all();
        return result.results || [];
      },
      run: async (...args) => {
        const query = normalizeQuery(sql, args);
        const result = await this.database.prepare(query.text).bind(...query.values).run();
        return {
          changes: Number(result.meta?.changes || 0),
          lastInsertRowid: result.meta?.last_row_id
        };
      }
    };
  }

  transaction(callback) {
    return async (...args) => callback(...args);
  }

  async exec(sql) {
    return this.database.exec(sql);
  }

  async close() {}
}

module.exports = D1Database;
