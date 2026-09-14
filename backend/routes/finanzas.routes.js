import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

/* =========================================================
   LISTAR MOVIMIENTOS
========================================================= */

router.get("/", async (req, res) => {
  try {
    const {
      tipo = "",
      categoria = "",
      anio = "",
      mes = "",
      buscar = "",
    } = req.query;

    const condiciones = [];
    const valores = [];

    if (tipo) {
      valores.push(tipo);

      condiciones.push(
        `tipo = $${valores.length}`
      );
    }

    if (categoria) {
      valores.push(categoria);

      condiciones.push(
        `categoria = $${valores.length}`
      );
    }

    if (anio) {
      valores.push(Number(anio));

      condiciones.push(`
        EXTRACT(
          YEAR FROM fecha
        ) = $${valores.length}
      `);
    }

    if (mes) {
      valores.push(Number(mes));

      condiciones.push(`
        EXTRACT(
          MONTH FROM fecha
        ) = $${valores.length}
      `);
    }

    if (buscar.trim()) {
      valores.push(
        `%${buscar.trim()}%`
      );

      condiciones.push(`
        (
          concepto ILIKE $${valores.length}
          OR categoria ILIKE $${valores.length}
          OR COALESCE(
            numero_recibo,
            ''
          ) ILIKE $${valores.length}
        )
      `);
    }

    const where =
      condiciones.length > 0
        ? `WHERE ${condiciones.join(" AND ")}`
        : "";

    const resultado =
      await pool.query(
        `
        SELECT
          id,
          fecha,
          tipo,
          categoria,
          concepto,
          monto,
          metodo_pago,
          numero_recibo,
          referencia,
          observacion,
          fecha_creacion

        FROM movimientos_financieros

        ${where}

        ORDER BY
          fecha DESC,
          id DESC
        `,
        valores
      );

    const movimientos =
      resultado.rows.map(
        (fila) => ({
          ...fila,

          monto:
            Number(
              fila.monto || 0
            ),
        })
      );

    res.json(movimientos);

  } catch (error) {
    console.error(
      "Error obteniendo movimientos:",
      error
    );

    res.status(500).json({
      mensaje:
        "No se pudieron obtener los movimientos financieros.",
    });
  }
});


/* =========================================================
   RESUMEN MENSUAL
========================================================= */

router.get(
  "/resumen",
  async (req, res) => {
    try {
      const fecha =
        new Date();

      const anio =
        Number(
          req.query.anio ||
          fecha.getFullYear()
        );

      const mes =
        Number(
          req.query.mes ||
          fecha.getMonth() + 1
        );


      /*
        1. Otros ingresos y egresos.
      */

      const movimientosResult =
        await pool.query(
          `
          SELECT

            COALESCE(
              SUM(monto) FILTER (
                WHERE tipo = 'ingreso'
              ),
              0
            ) AS otros_ingresos,

            COALESCE(
              SUM(monto) FILTER (
                WHERE tipo = 'egreso'
              ),
              0
            ) AS egresos

          FROM movimientos_financieros

          WHERE
            EXTRACT(
              YEAR FROM fecha
            ) = $1

            AND EXTRACT(
              MONTH FROM fecha
            ) = $2
          `,
          [
            anio,
            mes,
          ]
        );


      /*
        2. Pagos aprobados
           correspondientes a cuotas.
      */

      const cuotasResult =
        await pool.query(
          `
          SELECT
            COALESCE(
              SUM(monto),
              0
            ) AS cuotas_cobradas

          FROM pagos_cuotas

          WHERE
            estado = 'aprobado'

            AND EXTRACT(
              YEAR FROM fecha_pago
            ) = $1

            AND EXTRACT(
              MONTH FROM fecha_pago
            ) = $2
          `,
          [
            anio,
            mes,
          ]
        );


      const otrosIngresos =
        Number(
          movimientosResult
            .rows[0]
            .otros_ingresos || 0
        );

      const egresos =
        Number(
          movimientosResult
            .rows[0]
            .egresos || 0
        );

      const cuotasCobradas =
        Number(
          cuotasResult
            .rows[0]
            .cuotas_cobradas || 0
        );

      const totalIngresos =
        cuotasCobradas +
        otrosIngresos;

      const saldo =
        totalIngresos -
        egresos;


      res.json({
        anio,
        mes,

        cuotasCobradas,
        otrosIngresos,
        totalIngresos,
        egresos,
        saldo,
      });

    } catch (error) {
      console.error(
        "Error resumen financiero:",
        error
      );

      res.status(500).json({
        mensaje:
          "No se pudo obtener el resumen financiero.",
      });
    }
  }
);


/* =========================================================
   REGISTRAR MOVIMIENTO
========================================================= */

router.post("/", async (req, res) => {
  try {
    const {
      fecha,
      tipo,
      categoria,
      concepto,
      monto,
      metodoPago = "",
      numeroRecibo = "",
      referencia = "",
      observacion = "",
    } = req.body;


    if (
      !fecha ||
      !tipo ||
      !categoria ||
      !concepto ||
      !monto
    ) {
      return res
        .status(400)
        .json({
          mensaje:
            "Fecha, tipo, categoría, concepto y monto son obligatorios.",
        });
    }


    if (
      ![
        "ingreso",
        "egreso",
      ].includes(tipo)
    ) {
      return res
        .status(400)
        .json({
          mensaje:
            "El tipo de movimiento no es válido.",
        });
    }


    if (
      Number(monto) <= 0
    ) {
      return res
        .status(400)
        .json({
          mensaje:
            "El monto debe ser mayor que cero.",
        });
    }


    const resultado =
      await pool.query(
        `
        INSERT INTO movimientos_financieros (
          fecha,
          tipo,
          categoria,
          concepto,
          monto,
          metodo_pago,
          numero_recibo,
          referencia,
          observacion
        )

        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9
        )

        RETURNING *
        `,
        [
          fecha,
          tipo,
          categoria,
          concepto,
          Number(monto),
          metodoPago || null,
          numeroRecibo || null,
          referencia || null,
          observacion || null,
        ]
      );


    res.status(201).json({
      mensaje:
        tipo === "ingreso"
          ? "Ingreso registrado correctamente."
          : "Egreso registrado correctamente.",

      movimiento:
        resultado.rows[0],
    });

  } catch (error) {
    console.error(
      "Error registrando movimiento:",
      error
    );

    res.status(500).json({
      mensaje:
        "No se pudo registrar el movimiento financiero.",
    });
  }
});


/* =========================================================
   ELIMINAR MOVIMIENTO
========================================================= */

router.delete(
  "/:id",
  async (req, res) => {
    try {
      const resultado =
        await pool.query(
          `
          DELETE FROM movimientos_financieros
          WHERE id = $1
          RETURNING *
          `,
          [req.params.id]
        );


      if (
        resultado.rows.length === 0
      ) {
        return res
          .status(404)
          .json({
            mensaje:
              "Movimiento no encontrado.",
          });
      }


      res.json({
        mensaje:
          "Movimiento eliminado correctamente.",
      });

    } catch (error) {
      console.error(
        "Error eliminando movimiento:",
        error
      );

      res.status(500).json({
        mensaje:
          "No se pudo eliminar el movimiento.",
      });
    }
  }
);


export default router;