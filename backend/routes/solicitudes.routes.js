import { Router } from "express";
import multer from "multer";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { pool } from "../db.js";
import { roles } from "../middleware/auth.js";

const router = Router();
const uploads = fileURLToPath(new URL("../uploads/", import.meta.url));
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1 } });
const staff = roles("admin", "jefe", "contador");
router.get("/", staff, async (req, res) => {
  const { rows } = await pool.query("SELECT p.*, u.nombre AS socio, u.correo FROM pagos p JOIN usuarios u ON u.id = p.usuario_id ORDER BY p.fecha_pago DESC, p.id DESC");
  res.json(rows);
});
router.get("/usuario/:id", async (req, res) => {
  if (req.usuario.rol === "usuario" && Number(req.params.id) !== req.usuario.id) return res.status(403).json({ mensaje: "No tienes acceso a estos pagos." });
  const { rows } = await pool.query("SELECT * FROM pagos WHERE usuario_id = $1 ORDER BY fecha_pago DESC, id DESC", [req.params.id]);
  res.json(rows);
});
router.get("/:id/comprobante", async (req, res) => {
  const { rows } = await pool.query("SELECT usuario_id, comprobante_url FROM pagos WHERE id = $1", [req.params.id]);
  const pago = rows[0];
  if (!pago) return res.status(404).json({ mensaje: "Pago no encontrado." });
  if (req.usuario.rol === "usuario" && pago.usuario_id !== req.usuario.id) return res.status(403).json({ mensaje: "No tienes acceso a este comprobante." });
  const file = path.basename(pago.comprobante_url || "");
  if (!/\.(png|jpe?g|webp)$/i.test(file)) return res.status(404).json({ mensaje: "Comprobante no disponible." });
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.sendFile(file, { root: uploads });
});
router.post("/", roles("usuario"), upload.single("comprobante"), async (req, res, next) => {
  const descripcion = req.body?.descripcion;
  if (typeof descripcion !== "string" || !descripcion.trim() || descripcion.length > 2000 || !req.file) return res.status(400).json({ mensaje: "Describe el pago y adjunta una imagen (máximo 5 MB)." });
  const b = req.file.buffer;
  const ext = b.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) ? "png"
    : b[0] === 255 && b[1] === 216 && b[2] === 255 ? "jpg"
    : b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP" ? "webp" : null;
  if (!ext) return res.status(400).json({ mensaje: "Solo se admiten imágenes PNG, JPEG o WebP." });
  const filename = `${randomUUID()}.${ext}`;
  await mkdir(uploads, { recursive: true });
  const target = path.join(uploads, filename);
  await writeFile(target, b, { flag: "wx" });
  try {
    const { rows } = await pool.query("INSERT INTO pagos (usuario_id, monto, metodo, descripcion, comprobante_url, estado) VALUES ($1, 0, 'por_verificar', $2, $3, 'procesando') RETURNING id, estado", [req.usuario.id, descripcion.trim(), `/uploads/${filename}`]);
    res.status(201).json({ mensaje: "Solicitud enviada para revisión.", pago: rows[0] });
  } catch (error) { await unlink(target).catch(() => {}); next(error); }
});
router.patch("/:id/:accion", staff, async (req, res) => {
  const { accion, id } = req.params;
  if (!["aprobar", "rechazar"].includes(accion)) return res.status(404).json({ mensaje: "Acción no encontrada." });
  const monto = Number(req.body?.monto);
  if (req.body?.monto === undefined || !Number.isFinite(monto) || monto < 0 || (accion === "aprobar" && monto <= 0)) return res.status(400).json({ mensaje: "Ingresa un monto válido; para aprobar debe ser mayor que cero." });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query("SELECT * FROM pagos WHERE id = $1 FOR UPDATE", [id]);
    const pago = rows[0];
    if (!pago || pago.estado !== "procesando") {
      await client.query("ROLLBACK");
      return res.status(409).json({ mensaje: "La solicitud no existe o ya fue revisada." });
    }
    if (pago.cuota_id) await client.query("SELECT id FROM cuotas WHERE id = $1 FOR UPDATE", [pago.cuota_id]);
    await client.query("UPDATE pagos SET monto = $1, estado = $2 WHERE id = $3", [monto, accion === "aprobar" ? "acreditado" : "rechazado", id]);
    if (pago.cuota_id && accion === "aprobar") {
      await client.query("UPDATE cuotas SET estado = 'pagado' WHERE id = $1 AND monto <= (SELECT COALESCE(SUM(monto),0) FROM pagos WHERE cuota_id = $1 AND estado = 'acreditado')", [pago.cuota_id]);
    }
    await client.query("COMMIT");
    res.json({ mensaje: "Solicitud revisada correctamente." });
  } catch (error) { await client.query("ROLLBACK"); throw error; }
  finally { client.release(); }
});
export default router;
