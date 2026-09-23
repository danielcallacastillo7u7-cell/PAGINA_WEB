import { readFile } from 'node:fs/promises';
import { pool } from '../db.js';
const client = await pool.connect();
try {
  for (const file of ['001_club.sql','002_flujo.sql']) await client.query(await readFile(new URL('../migrations/' + file, import.meta.url), 'utf8'));
  console.log('Esquema nuevo preparado. No se modificaron datos antiguos.');
} catch (error) {
  await client.query('ROLLBACK');
  console.error('No se pudo preparar el esquema:', error.code || 'desconocido');
  process.exitCode = 1;
} finally { client.release(); await pool.end(); }
