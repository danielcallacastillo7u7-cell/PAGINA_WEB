import { readFile } from 'node:fs/promises';
import { pool } from '../db.js';
const client = await pool.connect();
try {
  await client.query(await readFile(new URL('../migrations/001_club.sql', import.meta.url), 'utf8'));
  console.log('Esquema nuevo preparado. No se modificaron datos antiguos.');
} catch (error) {
  await client.query('ROLLBACK');
  console.error('No se pudo preparar el esquema:', error.code || 'desconocido');
  process.exitCode = 1;
} finally { client.release(); await pool.end(); }
