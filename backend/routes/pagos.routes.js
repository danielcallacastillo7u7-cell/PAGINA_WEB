import { Router } from "express";
import multer from "multer";
import { pool } from "../db.js";

const router = Router();

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    const nombreSeguro = file.originalname.replace(/\s/g, "-");
    const nombreUnico = Date.now() + "-" + nombreSeguro;
    cb(null, nombreUnico);
  },
});

const upload = multer({ storage });

function validarMontoAdmin(valor) {
  if (valor === undefined || valor === null || valor === "") return null;

  const monto = Number(valor);
  if (!Number.isFinite(monto) || monto < 0) return null;

  return monto;
}

router.post("/", upload.single("comprobante"), async (req, res) => {
  try {
    const { usuario_id, descripcion } = req.body;

    if (!usuario_id || !descripcion) {
      return res.status(400).json({
        mensaje: "La descripcion del pago es obligatoria",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        mensaje: "Debes subir un comprobante",
      });
    }

    const comprobanteUrl = `http://localhost:3000/uploads/${req.file.filename}`;

    const resultado = await pool.query(
      `INSERT INTO pagos (usuario_id, monto, metodo, comprobante_url, descripcion)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [usuario_id, 0, "Comprobante", comprobanteUrl, descripcion]
    );

    res.status(201).json({
      mensaje: "Solicitud de pago enviada correctamente",
      pago: resultado.rows[0],
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      mensaje: "Error al registrar la solicitud de pago",
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
        pagos.descripcion,
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

router.get("/usuario/:usuarioId", async (req, res) => {
  try {
    const { usuarioId } = req.params;

    const resultado = await pool.query(
      `SELECT 
        id,
        monto,
        metodo,
        descripcion,
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

router.patch("/:id/aprobar", async (req, res) => {
  try {
    const { id } = req.params;
    const montoAdmin = validarMontoAdmin(req.body.monto);

    if (montoAdmin === null) {
      return res.status(400).json({
        mensaje: "Ingresa un monto valido para aprobar el pago",
      });
    }

    const pago = await pool.query(
      `UPDATE pagos
       SET estado = 'acreditado', monto = $2
       WHERE id = $1
       RETURNING *`,
      [id, montoAdmin]
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
    const montoAdmin = validarMontoAdmin(req.body.monto);

    if (montoAdmin === null) {
      return res.status(400).json({
        mensaje: "Ingresa un monto valido para rechazar el pago",
      });
    }

    const resultado = await pool.query(
      `UPDATE pagos
       SET estado = 'rechazado', monto = $2
       WHERE id = $1
       RETURNING *`,
      [id, montoAdmin]
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

export default router;
