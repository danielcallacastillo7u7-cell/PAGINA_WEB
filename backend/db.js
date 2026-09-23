import pg from "pg";
import { config } from "./config.js";
const url = new URL(config.databaseUrl);
const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
// TLS verifies the server certificate; sslmode in the URL cannot weaken it.
for (const key of ["sslmode", "sslcert", "sslkey", "sslrootcert"]) url.searchParams.delete(key);
export const pool = new pg.Pool({
  connectionString: url.toString(),
  ssl: local ? false : { rejectUnauthorized: true },
  connectionTimeoutMillis: 10000,
});
pool.on("error", error => console.error("Error de conexión PostgreSQL:", error.code || "desconocido"));
