const express = require("express");
const router = express.Router();
const pool = require("../db");

router.get("/", async (req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT
        id,
        nombre,
        correo,
        dni,
        telefono,
        direccion,
        zona,
        lote,
        estado,
        tipo_socio
      FROM usuarios
      WHERE rol='usuario'
      ORDER BY nombre
    `);

    res.json(resultado.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: "Error obteniendo socios"
    });
  }
});

module.exports = router;