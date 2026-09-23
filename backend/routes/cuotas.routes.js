import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

const NOMBRES_MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

/* =========================================================
   OBTENER CUOTAS
========================================================= */

router.get("/", async (req, res) => {
  try {
    const {
      anio = new Date().getFullYear(),
      mes = "",
      estado = "",
      buscar = "",
      zona = "",
    } = req.query;

    const valores = [Number(anio)];
    const condiciones = [
      `c.anio = $1`,
    ];

    if (mes) {
      valores.push(Number(mes));

      condiciones.push(
        `c.mes = $${valores.length}`
      );
    }

    if (estado) {
      valores.push(estado);

      condiciones.push(
        `c.estado = $${valores.length}`
      );
    }

    if (zona) {
      valores.push(zona);

      condiciones.push(
        `s.zona = $${valores.length}`
      );
    }

    if (buscar.trim()) {
      valores.push(
        `%${buscar.trim()}%`
      );

      condiciones.push(`
        (
          s.nombre ILIKE $${valores.length}
          OR s.zona ILIKE $${valores.length}
          OR s.lote ILIKE $${valores.length}
        )
      `);
    }

    const resultado =
      await pool.query(
        `
        SELECT
          c.id,
          c.socio_id,
          c.anio,
          c.mes,
          c.monto,
          c.estado,
          c.fecha_vencimiento,
          c.fecha_creacion,

          s.nombre,
          s.zona,
          s.lote,
          s.tipo

        FROM cuotas_club c

        INNER JOIN socios_club s
          ON s.id = c.socio_id

        WHERE
          ${condiciones.join(" AND ")}

        ORDER BY
          c.anio DESC,
          c.mes DESC,
          s.zona ASC,
          s.lote ASC,
          s.nombre ASC
        `,
        valores
      );

    const cuotas =
      resultado.rows.map(
        (fila) => ({
          ...fila,

          nombreMes:
            NOMBRES_MESES[
              Number(fila.mes) - 1
            ],

          monto:
            Number(fila.monto || 0),
        })
      );

    res.json(cuotas);

  } catch (error) {
    console.error(
      "Error obteniendo cuotas:",
      error
    );

    res.status(500).json({
      mensaje:
        "No se pudieron obtener las cuotas.",
    });
  }
});


/* =========================================================
   RESUMEN
========================================================= */

router.get(
  "/resumen/:anio",
  async (req, res) => {
    try {
      const anio =
        Number(req.params.anio);

      const resultado =
        await pool.query(
          `
          SELECT

            COUNT(*)::int
              AS total,

            COUNT(*) FILTER (
              WHERE estado = 'pagado'
            )::int
              AS pagadas,

            COUNT(*) FILTER (
              WHERE estado = 'pendiente'
            )::int
              AS pendientes,

            COUNT(*) FILTER (
              WHERE estado = 'vencido'
            )::int
              AS vencidas,

            COALESCE(
              SUM(monto),
              0
            ) AS total_generado,

            COALESCE(
              SUM(monto) FILTER (
                WHERE estado = 'pagado'
              ),
              0
            ) AS total_pagado,

            COALESCE(
              SUM(monto) FILTER (
                WHERE estado IN (
                  'pendiente',
                  'vencido'
                )
              ),
              0
            ) AS total_por_cobrar

          FROM cuotas_club

          WHERE anio = $1
          `,
          [anio]
        );

      const fila =
        resultado.rows[0];

      res.json({
        total:
          Number(fila.total || 0),

        pagadas:
          Number(fila.pagadas || 0),

        pendientes:
          Number(
            fila.pendientes || 0
          ),

        vencidas:
          Number(
            fila.vencidas || 0
          ),

        totalGenerado:
          Number(
            fila.total_generado || 0
          ),

        totalPagado:
          Number(
            fila.total_pagado || 0
          ),

        totalPorCobrar:
          Number(
            fila.total_por_cobrar || 0
          ),
      });

    } catch (error) {
      console.error(
        "Error resumen cuotas:",
        error
      );

      res.status(500).json({
        mensaje:
          "No se pudo obtener el resumen.",
      });
    }
  }
);


/* =========================================================
   GENERAR CUOTAS DE UN MES
========================================================= */

router.post(
  "/generar",
  async (req, res) => {
    try {
      const {
        anio,
        mes,
        fechaVencimiento,
      } = req.body;

      if (
        !anio ||
        !mes ||
        !fechaVencimiento
      ) {
        return res
          .status(400)
          .json({
            mensaje:
              "Año, mes y fecha de vencimiento son obligatorios.",
          });
      }

      if (
        !Number.isInteger(Number(anio)) || Number(anio) < 1900 || Number(anio) > 2200 ||
        !/^\d{4}-\d{2}-\d{2}$/.test(fechaVencimiento) || Number.isNaN(Date.parse(fechaVencimiento)) ||
        !Number.isInteger(Number(mes)) || Number(mes) < 1 ||
        Number(mes) > 12
      ) {
        return res
          .status(400)
          .json({
            mensaje:
              "El mes no es válido.",
          });
      }

      /*
        Cada socio utilizará su propia
        cuota_base.

        Esto es importante porque en el
        Club Catarindo no todos necesariamente
        tienen el mismo monto.
      */

      const resultado =
        await pool.query(
          `
          INSERT INTO cuotas_club (
            socio_id,
            anio,
            mes,
            monto,
            estado,
            fecha_vencimiento
          )

          SELECT
            s.id,
            $1,
            $2,
            COALESCE(
              s.cuota_base,
              0
            ),
            'pendiente',
            $3

          FROM socios_club s

          WHERE
            s.estado = true

          ON CONFLICT (
            socio_id,
            anio,
            mes
          )
          DO NOTHING

          RETURNING id
          `,
          [
            Number(anio),
            Number(mes),
            fechaVencimiento,
          ]
        );

      res.json({
        mensaje:
          "Cuotas generadas correctamente.",

        generadas:
          resultado.rowCount,

        anio:
          Number(anio),

        mes:
          Number(mes),
      });

    } catch (error) {
      console.error(
        "Error generando cuotas:",
        error
      );

      res.status(500).json({
        mensaje:
          "No se pudieron generar las cuotas.",
      });
    }
  }
);


/* =========================================================
   ACTUALIZAR CUOTAS VENCIDAS
========================================================= */

router.patch(
  "/actualizar-vencidas",
  async (req, res) => {
    try {
      const resultado =
        await pool.query(`
          UPDATE cuotas_club

          SET estado = 'vencido'

          WHERE
            estado = 'pendiente'
            AND fecha_vencimiento
              < CURRENT_DATE

          RETURNING id
        `);

      res.json({
        mensaje:
          "Estados actualizados.",

        vencidas:
          resultado.rowCount,
      });

    } catch (error) {
      console.error(
        "Error actualizando vencidas:",
        error
      );

      res.status(500).json({
        mensaje:
          "No se pudieron actualizar las cuotas vencidas.",
      });
    }
  }
);


/* =========================================================
   DETALLE DE CUOTA
========================================================= */

router.get(
  "/detalle/:id",
  async (req, res) => {
    try {
      const { id } =
        req.params;

      const resultado =
        await pool.query(
          `
          SELECT
            c.id,
            c.anio,
            c.mes,
            c.monto,
            c.estado,
            c.fecha_vencimiento,

            s.id AS socio_id,
            s.nombre,
            s.zona,
            s.lote,
            s.tipo,

            p.id AS pago_id,
            p.monto AS monto_pagado,
            p.fecha_pago,
            p.metodo_pago,
            p.numero_recibo,
            p.estado AS estado_pago

          FROM cuotas_club c

          INNER JOIN socios_club s
            ON s.id = c.socio_id

          LEFT JOIN pagos_cuotas p
            ON p.cuota_id = c.id
            AND p.estado = 'aprobado'

          WHERE c.id = $1
          `,
          [id]
        );

      if (
        resultado.rows.length === 0
      ) {
        return res
          .status(404)
          .json({
            mensaje:
              "Cuota no encontrada.",
          });
      }

      const cuota =
        resultado.rows[0];

      res.json({
        ...cuota,

        nombreMes:
          NOMBRES_MESES[
            Number(cuota.mes) - 1
          ],

        monto:
          Number(
            cuota.monto || 0
          ),

        monto_pagado:
          Number(
            cuota.monto_pagado || 0
          ),
      });

    } catch (error) {
      console.error(
        "Error detalle cuota:",
        error
      );

      res.status(500).json({
        mensaje:
          "No se pudo obtener la cuota.",
      });
    }
  }
);


export default router;