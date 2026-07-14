import { Router } from "express";
import multer from "multer";
import { pool } from "../db.js";

const router = Router();

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    const nombreUnico = Date.now() + "-" + file.originalname;
    cb(null, nombreUnico);
  },
});

const upload = multer({ storage });

router.post("/", upload.single("comprobante"), async (req, res) => {
  try {
    const { usuario_id, cuota_id, monto, metodo } = req.body;

    if (!usuario_id || !monto || !metodo) {
      return res.status(400).json({
        mensaje: "Faltan datos obligatorios",
      });
    }

    const comprobanteUrl = req.file
      ? `http://localhost:3000/uploads/${req.file.filename}`
      : null;

    const resultado = await pool.query(
      `INSERT INTO pagos (usuario_id, cuota_id, monto, metodo, comprobante_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [usuario_id, cuota_id || null, monto, metodo, comprobanteUrl]
    );

    res.status(201).json({
      mensaje: "Pago enviado correctamente",
      pago: resultado.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: "Error al registrar pago",
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT 
        pagos.id,
        pagos.monto,
        pagos.metodo,
        pagos.comprobante_url,
        pagos.estado,
        pagos.fecha_pago,
        usuarios.nombre AS socio,
        usuarios.correo
       FROM pagos
       INNER JOIN usuarios ON usuarios.id = pagos.usuario_id
       ORDER BY pagos.fecha_pago DESC`
    );

    res.json(resultado.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: "Error al obtener pagos",
    });
  }
});

router.patch("/:id/aprobar", async (req, res) => {
  try {
    const { id } = req.params;

    const pago = await pool.query(
      `UPDATE pagos
       SET estado = 'acreditado'
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (pago.rows.length === 0) {
      return res.status(404).json({
        mensaje: "Pago no encontrado",
      });
    }

    if (pago.rows[0].cuota_id) {
      await pool.query(
        `UPDATE cuotas
         SET estado = 'pagado'
         WHERE id = $1`,
        [pago.rows[0].cuota_id]
      );
    }

    res.json({
      mensaje: "Pago aprobado correctamente",
      pago: pago.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: "Error al aprobar pago",
    });
  }
});

router.patch("/:id/rechazar", async (req, res) => {
  try {
    const { id } = req.params;

    const resultado = await pool.query(
      `UPDATE pagos
       SET estado = 'rechazado'
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (resultado.rows.length === 0) {
      return res.status(404).json({
        mensaje: "Pago no encontrado",
      });
    }

    res.json({
      mensaje: "Pago rechazado correctamente",
      pago: resultado.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: "Error al rechazar pago",
    });
  }
});

router.get("/usuario/:usuarioId", async (req, res) => {
  try {
    const { usuarioId } = req.params;

    const resultado = await pool.query(
      `SELECT 
        id,
        monto,
        metodo,
        comprobante_url,
        estado,
        fecha_pago
       FROM pagos
       WHERE usuario_id = $1
       ORDER BY fecha_pago DESC`,
      [usuarioId]
    );

    res.json(resultado.rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      mensaje: "Error al obtener pagos del usuario",
    });
  }
});

export default router;