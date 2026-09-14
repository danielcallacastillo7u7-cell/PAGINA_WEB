import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import pagosRoutes from "./routes/pagos.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import sociosRoutes from "./routes/socios.routes.js";
import importacionesRoutes from "./routes/importaciones.routes.js";
import cuotasRoutes from "./routes/cuotas.routes.js";
import reportesRoutes from "./routes/reportes.routes.js";
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/uploads", express.static("uploads"));
app.use("/api/pagos", pagosRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/socios", sociosRoutes);
app.use("/api/importaciones",importacionesRoutes);
app.use("/api/cuotas",cuotasRoutes);
app.use(
  "/api/reportes",reportesRoutes);

app.get("/", (req, res) => {
  res.send("Backend funcionando");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor en puerto ${PORT}`);
});