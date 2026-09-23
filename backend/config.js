import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
dotenv.config({ path: fileURLToPath(new URL(".env", import.meta.url)), quiet: true });
if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes("PEGA_AQUI")) {
  throw new Error("Configura DATABASE_URL en backend/.env con la conexión de Neon.");
}
let databaseUrl;
try { databaseUrl = new URL(process.env.DATABASE_URL); } catch {
  throw new Error("DATABASE_URL debe ser una URL PostgreSQL válida.");
}
if (!["postgres:", "postgresql:"].includes(databaseUrl.protocol)) {
  throw new Error("DATABASE_URL debe usar postgresql://.");
}
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error("Configura JWT_SECRET con al menos 32 caracteres aleatorios.");
}
export const config = {
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  port: Number(process.env.PORT || 3000),
  origins: (process.env.FRONTEND_ORIGINS || "http://localhost:5173,http://127.0.0.1:5173").split(",").map(s => s.trim()),
};
