import solicitudesRoutes from "./routes/solicitudes.routes.js";
import express from "express";
import cors from "cors";
import { config } from "./config.js";
import { autenticar, roles } from "./middleware/auth.js";
import finanzasRoutes from "./routes/finanzas.routes.js";
import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import pagosRoutes from "./routes/pagos.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import sociosRoutes from "./routes/socios.routes.js";
import importacionesRoutes from "./routes/importaciones.routes.js";
import cuotasRoutes from "./routes/cuotas.routes.js";
import reportesRoutes from "./routes/reportes.routes.js";


const app = express();

app.use(cors({ origin: config.origins }));
app.use(express.json({ limit: "1mb" }));

app.use("/api/auth", authRoutes);
app.use("/api", autenticar);
app.use("/api/solicitudes", solicitudesRoutes);
app.use("/api/finanzas", roles("jefe", "contador"), finanzasRoutes);
app.use("/api/admin", roles("jefe", "admin"), adminRoutes);
// Los comprobantes requieren acceso autenticado.
app.use("/api/pagos", roles("jefe", "admin", "contador"), pagosRoutes);
app.use("/api/dashboard", roles("jefe", "contador"), dashboardRoutes);
app.use("/api/socios", roles("jefe", "admin"), sociosRoutes);
app.use("/api/importaciones", roles("jefe"), importacionesRoutes);
app.use("/api/cuotas", roles("jefe", "contador"), cuotasRoutes);
app.use(
  "/api/reportes", roles("jefe", "contador"), reportesRoutes);

app.get("/", (req, res) => {
  res.send("Backend funcionando");
});

app.use((req, res) => res.status(404).json({ mensaje: "Ruta no encontrada." }));
app.use((error, req, res, next) => {
  console.error("Error de solicitud:", error.code || error.name);
  if (res.headersSent) return next(error);
  res.status(error.status === 400 ? 400 : 500).json({ mensaje: "No se pudo procesar la solicitud." });
});

export default app;
