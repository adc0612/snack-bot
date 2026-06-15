// 인메모리 D1 mock
export function createMockDb() {
  const store = new Map();

  function makeKey(userId, week) {
    return `${userId}::${week}`;
  }

  return {
    _store: store,
    prepare(sql) {
      return {
        _sql: sql,
        _binds: [],
        bind(...args) {
          this._binds = args;
          return this;
        },
        async first() {
          // SELECT items FROM orders WHERE user_id=? AND week=? AND status=?
          if (sql.includes('SELECT items FROM orders')) {
            const [userId, week] = this._binds;
            return store.get(makeKey(userId, week)) ?? null;
          }
          // SELECT * FROM weekly_state WHERE week=?
          if (sql.includes('SELECT * FROM weekly_state')) {
            const [week] = this._binds;
            return store.get(`state::${week}`) ?? null;
          }
          return null;
        },
        async run() {
          // INSERT INTO orders ... ON CONFLICT DO UPDATE
          if (sql.includes('INSERT INTO orders')) {
            const [userId, userName, week, items, , createdAt, updatedAt] = this._binds;
            store.set(makeKey(userId, week), { user_id: userId, user_name: userName, week, items, status: 'active', created_at: createdAt, updated_at: updatedAt });
          }
          // UPDATE orders SET status=?
          if (sql.includes('UPDATE orders SET status')) {
            const [newStatus, week] = this._binds;
            for (const [key, val] of store.entries()) {
              if (val.week === week && val.status === 'active') {
                store.set(key, { ...val, status: newStatus });
              }
            }
          }
          // INSERT INTO weekly_state
          if (sql.includes('INSERT INTO weekly_state')) {
            const [week, value] = this._binds;
            const field = sql.match(/weekly_state \(week, (\w+)\)/)?.[1];
            const existing = store.get(`state::${week}`) ?? { week };
            if (field) store.set(`state::${week}`, { ...existing, [field]: value });
          }
        },
        async all() {
          // SELECT user_id, user_name, items FROM orders WHERE week=? AND status=?
          if (sql.includes('SELECT user_id, user_name, items FROM orders')) {
            const [week, status] = this._binds;
            const results = [...store.values()].filter(
              v => v.week === week && v.status === status
            );
            return { results };
          }
          return { results: [] };
        },
      };
    },
  };
}
