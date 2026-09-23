import app from "./app.js";
import { config } from "./config.js";
import { pool } from "./db.js";
const PORT = config.port;
try { await pool.query("SELECT 1"); }
catch (error) {
  console.error("No se pudo conectar con PostgreSQL. Revisa DATABASE_URL y la red. Codigo:", error.code || "desconocido");
  await pool.end();
  process.exit(1);
}

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor en puerto ${PORT}`);
});

let cerrando = false;
async function cerrar() {
  if (cerrando) return;
  cerrando = true;
  const limite = setTimeout(() => process.exit(1), 15000);
  limite.unref();
  server.close(async () => {
    await pool.end();
    clearTimeout(limite);
    process.exit(0);
  });
}
process.on('SIGTERM', cerrar);
process.on('SIGINT', cerrar);
