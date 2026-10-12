// Testler için gerçek SQLite (sql.js, bellekte). Uygulama koduna girmez.
import initSqlJs from 'sql.js';

import type { HamVeriTabani, SqlDeger } from '../kapi';

export async function sqljsVeriTabani(): Promise<HamVeriTabani> {
  const SQL = await initSqlJs();
  const db = new SQL.Database();
  const hepsi = <T>(sql: string, params: SqlDeger[]): T[] => {
    const st = db.prepare(sql);
    st.bind(params);
    const satirlar: T[] = [];
    while (st.step()) satirlar.push(st.getAsObject() as T);
    st.free();
    return satirlar;
  };
  return {
    async execAsync(sql) {
      db.exec(sql);
    },
    async runAsync(sql, params) {
      db.run(sql, params);
    },
    async getAllAsync<T>(sql: string, params: SqlDeger[]) {
      return hepsi<T>(sql, params);
    },
    async getFirstAsync<T>(sql: string, params: SqlDeger[]) {
      return hepsi<T>(sql, params)[0] ?? null;
    },
    async withTransactionAsync(islem) {
      db.exec('BEGIN');
      try {
        await islem();
        db.exec('COMMIT');
      } catch (e) {
        db.exec('ROLLBACK');
        throw e;
      }
    },
  };
}
