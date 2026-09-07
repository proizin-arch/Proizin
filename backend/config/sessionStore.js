const session = require('express-session');

class SQLiteSessionStore extends session.Store {
  constructor(db, options = {}) {
    super();
    this.db = db;
    this.defaultTtl = options.defaultTtl || 1000 * 60 * 60 * 8;
    this.statements = {
      get: db.prepare('SELECT sess, expires FROM sessions WHERE sid = ?'),
      set: db.prepare(`
        INSERT INTO sessions (sid, sess, expires) VALUES (?, ?, ?)
        ON CONFLICT(sid) DO UPDATE SET sess = excluded.sess, expires = excluded.expires
      `),
      destroy: db.prepare('DELETE FROM sessions WHERE sid = ?'),
      cleanup: db.prepare('DELETE FROM sessions WHERE expires <= ?')
    };
  }

  async get(sid, callback) {
    try {
      const row = await this.statements.get.get(sid);
      if (!row || row.expires <= Date.now()) {
        if (row) await this.statements.destroy.run(sid);
        return callback(null, null);
      }
      callback(null, JSON.parse(row.sess));
    } catch (error) {
      callback(error);
    }
  }

  async set(sid, value, callback = () => {}) {
    try {
      const expires = value.cookie?.expires
        ? new Date(value.cookie.expires).getTime()
        : Date.now() + this.defaultTtl;
      await this.statements.set.run(sid, JSON.stringify(value), expires);
      await this.cleanup();
      callback(null);
    } catch (error) {
      callback(error);
    }
  }

  async destroy(sid, callback = () => {}) {
    try {
      await this.statements.destroy.run(sid);
      callback(null);
    } catch (error) {
      callback(error);
    }
  }

  touch(sid, value, callback = () => {}) {
    this.set(sid, value, callback);
  }

  async cleanup() {
    await this.statements.cleanup.run(Date.now());
  }
}

module.exports = SQLiteSessionStore;
