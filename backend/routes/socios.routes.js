import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

/* =====================================================
   OBTENER TODOS LOS SOCIOS
===================================================== */

router.get("/", async (req, res) => {
  try {
    const {
      buscar = "",
      zona = "",
      estado = "",
    } = req.query;

    const condiciones = [];
    const valores = [];

    if (buscar.trim()) {
      valores.push(`%${buscar.trim()}%`);

      condiciones.push(`
        (
          nombre ILIKE $${valores.length}
          OR lote ILIKE $${valores.length}
          OR zona ILIKE $${valores.length}
        )
      `);
    }

    if (zona.trim()) {
      valores.push(zona.trim());

      condiciones.push(`
        zona = $${valores.length}
      `);
    }

    if (estado === "activo") {
      condiciones.push(`
        estado = true
      `);
    }

    if (estado === "inactivo") {
      condiciones.push(`
        estado = false
      `);
    }

    const where =
      condiciones.length > 0
        ? `WHERE ${condiciones.join(" AND ")}`
        : "";

    const resultado = await pool.query(
      `
      SELECT
        id,
        numero_excel,
        direccion_tipo,
        zona,
        lote,
        tipo,
        nombre,
        cuota_base,
        estado,
        fecha_creacion

      FROM socios_club

      ${where}

      ORDER BY
        zona ASC,
        lote ASC,
        nombre ASC
      `,
      valores
    );

    res.json(resultado.rows);

  } catch (error) {
    console.error(
      "Error obteniendo socios:",
      error
    );

    res.status(500).json({
      mensaje:
        "No se pudieron obtener los socios.",
    });
  }
});


/* =====================================================
   RESUMEN DE SOCIOS
===================================================== */

router.get("/resumen", async (req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT
        COUNT(*)::int AS total,

        COUNT(*) FILTER (
          WHERE estado = true
        )::int AS activos,

        COUNT(*) FILTER (
          WHERE estado = false
        )::int AS inactivos,

        COUNT(
          DISTINCT zona
        )::int AS zonas

      FROM socios_club
    `);

    res.json(
      resultado.rows[0]
    );

  } catch (error) {
    console.error(
      "Error resumen socios:",
      error
    );

    res.status(500).json({
      mensaje:
        "No se pudo obtener el resumen de socios.",
    });
  }
});


/* =====================================================
   OBTENER SOCIO POR ID
===================================================== */

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const socioResultado =
      await pool.query(
        `
        SELECT
          id,
          numero_excel,
          direccion_tipo,
          zona,
          lote,
          tipo,
          nombre,
          cuota_base,
          estado,
          fecha_creacion

        FROM socios_club

        WHERE id = $1
        `,
        [id]
      );

    if (
      socioResultado.rows.length === 0
    ) {
      return res.status(404).json({
        mensaje:
          "Socio no encontrado.",
      });
    }

    const socio =
      socioResultado.rows[0];

    /*
      Construimos la dirección usando:
      zona + lote

      Ejemplo:
      zona = A
      lote = 15
      resultado = A-15
    */

    const direccion =
      `${socio.zona || ""}-${socio.lote || ""}`
        .replace(/\s+/g, "")
        .toUpperCase();

    /*
      Buscamos movimientos que coincidan
      con la propiedad del socio.
    */

    const movimientosResultado =
      await pool.query(
        `
        SELECT
          id,
          fecha,
          tipo,
          direccion,
          concepto,
          numero_recibo,
          monto,
          hoja_excel

        FROM movimientos_financieros

        WHERE
          UPPER(
            REPLACE(
              COALESCE(direccion, ''),
              ' ',
              ''
            )
          ) = $1

        ORDER BY
          fecha DESC,
          id DESC
        `,
        [direccion]
      );

    const movimientos =
      movimientosResultado.rows;

    let totalIngresos = 0;
    let totalEgresos = 0;

    for (
      const movimiento
      of movimientos
    ) {
      const monto =
        Number(
          movimiento.monto || 0
        );

      if (
        movimiento.tipo === "ingreso"
      ) {
        totalIngresos += monto;
      }

      if (
        movimiento.tipo === "egreso"
      ) {
        totalEgresos += monto;
      }
    }

    res.json({
      socio,

      direccion,

      resumen: {
        totalIngresos,
        totalEgresos,
        saldo:
          totalIngresos -
          totalEgresos,

        movimientos:
          movimientos.length,
      },

      movimientos,
    });

  } catch (error) {
    console.error(
      "Error detalle socio:",
      error
    );

    res.status(500).json({
      mensaje:
        "No se pudo obtener el detalle del socio.",
    });
  }
});


/* =====================================================
   CAMBIAR ESTADO
===================================================== */

router.patch(
  "/:id/estado",
  async (req, res) => {
    try {
      const { id } =
        req.params;

      const { estado } =
        req.body;

      if (
        typeof estado !== "boolean"
      ) {
        return res.status(400).json({
          mensaje:
            "El estado debe ser true o false.",
        });
      }

      const resultado =
        await pool.query(
          `
          UPDATE socios_club

          SET estado = $1

          WHERE id = $2

          RETURNING *
          `,
          [
            estado,
            id,
          ]
        );

      if (
        resultado.rows.length === 0
      ) {
        return res.status(404).json({
          mensaje:
            "Socio no encontrado.",
        });
      }

      res.json({
        mensaje:
          estado
            ? "Socio activado correctamente."
            : "Socio desactivado correctamente.",

        socio:
          resultado.rows[0],
      });

    } catch (error) {
      console.error(
        "Error actualizando estado:",
        error
      );

      res.status(500).json({
        mensaje:
          "No se pudo actualizar el estado.",
      });
    }
  }
);


export default router;