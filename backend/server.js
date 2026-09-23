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

app.listen(PORT, () => {
  console.log(`Servidor en puerto ${PORT}`);
});