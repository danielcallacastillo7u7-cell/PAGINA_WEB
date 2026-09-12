import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

/* =========================================
   DASHBOARD GENERAL DEL JEFE
========================================= */

router.get("/resumen", async (req, res) => {
  try {
    /* ==========================
       SOCIOS
    ========================== */

    const sociosResult = await pool.query(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (
          WHERE estado = true
        )::int AS activos,
        COUNT(*) FILTER (
          WHERE estado = false
        )::int AS inactivos
      FROM socios_club
    `);

    /* ==========================
       MOVIMIENTOS DEL MES ACTUAL
    ========================== */

    const movimientosMes = await pool.query(`
      SELECT
        COALESCE(
          SUM(monto) FILTER (
            WHERE tipo = 'ingreso'
          ),
          0
        ) AS ingresos,

        COALESCE(
          SUM(monto) FILTER (
            WHERE tipo = 'egreso'
          ),
          0
        ) AS egresos,

        COUNT(*) FILTER (
          WHERE tipo = 'ingreso'
        )::int AS cantidad_ingresos,

        COUNT(*) FILTER (
          WHERE tipo = 'egreso'
        )::int AS cantidad_egresos

      FROM movimientos_financieros

      WHERE
        EXTRACT(MONTH FROM fecha)
          =
        EXTRACT(MONTH FROM CURRENT_DATE)

        AND

        EXTRACT(YEAR FROM fecha)
          =
        EXTRACT(YEAR FROM CURRENT_DATE)
    `);

    /* ==========================
       TOTAL HISTÓRICO
    ========================== */

    const historico = await pool.query(`
      SELECT
        COALESCE(
          SUM(monto) FILTER (
            WHERE tipo = 'ingreso'
          ),
          0
        ) AS total_ingresos,

        COALESCE(
          SUM(monto) FILTER (
            WHERE tipo = 'egreso'
          ),
          0
        ) AS total_egresos

      FROM movimientos_financieros
    `);

    /* ==========================
       ÚLTIMOS MOVIMIENTOS
    ========================== */

    const ultimos = await pool.query(`
      SELECT
        id,
        fecha,
        tipo,
        direccion,
        concepto,
        numero_recibo,
        monto

      FROM movimientos_financieros

      ORDER BY
        fecha DESC,
        id DESC

      LIMIT 10
    `);

    const socios = sociosResult.rows[0];

    const mes = movimientosMes.rows[0];

    const total = historico.rows[0];

    const ingresosMes =
      Number(mes.ingresos || 0);

    const egresosMes =
      Number(mes.egresos || 0);

    const totalIngresos =
      Number(total.total_ingresos || 0);

    const totalEgresos =
      Number(total.total_egresos || 0);

    res.json({
      socios: {
        total: socios.total,
        activos: socios.activos,
        inactivos: socios.inactivos,
      },

      mesActual: {
        ingresos: ingresosMes,
        egresos: egresosMes,

        saldo:
          ingresosMes - egresosMes,

        cantidadIngresos:
          mes.cantidad_ingresos,

        cantidadEgresos:
          mes.cantidad_egresos,
      },

      historico: {
        ingresos: totalIngresos,
        egresos: totalEgresos,

        saldo:
          totalIngresos -
          totalEgresos,
      },

      ultimosMovimientos:
        ultimos.rows,
    });

  } catch (error) {
    console.error(
      "Error dashboard:",
      error
    );

    res.status(500).json({
      mensaje:
        "No se pudo obtener la información del dashboard.",
    });
  }
});


/* =========================================
   GRÁFICO MENSUAL
========================================= */

router.get("/mensual", async (req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT
        EXTRACT(YEAR FROM fecha)::int
          AS anio,

        EXTRACT(MONTH FROM fecha)::int
          AS mes,

        COALESCE(
          SUM(monto) FILTER (
            WHERE tipo = 'ingreso'
          ),
          0
        ) AS ingresos,

        COALESCE(
          SUM(monto) FILTER (
            WHERE tipo = 'egreso'
          ),
          0
        ) AS egresos

      FROM movimientos_financieros

      GROUP BY
        EXTRACT(YEAR FROM fecha),
        EXTRACT(MONTH FROM fecha)

      ORDER BY
        anio ASC,
        mes ASC
    `);

    const datos =
      resultado.rows.map(
        (fila) => ({
          anio:
            Number(fila.anio),

          mes:
            Number(fila.mes),

          ingresos:
            Number(fila.ingresos),

          egresos:
            Number(fila.egresos),

          saldo:
            Number(fila.ingresos) -
            Number(fila.egresos),
        })
      );

    res.json(datos);

  } catch (error) {
    console.error(
      "Error mensual:",
      error
    );

    res.status(500).json({
      mensaje:
        "No se pudo obtener el resumen mensual.",
    });
  }
});


export default router;