import { pool } from '../db.js';
try {
  const r = await pool.query("SELECT table_name,column_name,data_type,is_nullable,column_default FROM information_schema.columns WHERE table_schema='public' ORDER BY table_name,ordinal_position");
  for (const row of r.rows) console.log(JSON.stringify(row));
  const counts = await pool.query("SELECT rol, estado, count(*)::int AS cantidad FROM usuarios GROUP BY rol,estado");
  console.log('Cuentas por rol y estado:', counts.rows);
} finally { await pool.end(); }
