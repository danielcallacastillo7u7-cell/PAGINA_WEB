import { readFile } from 'node:fs/promises';
import { pool } from '../db.js';
let client;
try {
  client = await pool.connect();
  for (const file of ['001_club.sql','002_flujo.sql','003_accesos.sql']) await client.query(await readFile(new URL('../migrations/' + file, import.meta.url), 'utf8'));
  console.log('Esquema nuevo preparado. No se modificaron datos antiguos.');
} catch (error) {
  if (client) await client.query('ROLLBACK');
  console.error('No se pudo preparar el esquema:', error.code || 'desconocido');
  process.exitCode = 1;
} finally { client?.release(); await pool.end(); }
