import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

/* =========================================================
   OBTENER PAGOS
========================================================= */

router.get("/", async (req, res) => {
  try {
    const {
      estado = "",
      anio = "",
      mes = "",
      buscar = "",
    } = req.query;

    const condiciones = [];
    const valores = [];

    if (estado) {
      valores.push(estado);

      condiciones.push(
        `p.estado = $${valores.length}`
      );
    }

    if (anio) {
      valores.push(Number(anio));

      condiciones.push(
        `c.anio = $${valores.length}`
      );
    }

    if (mes) {
      valores.push(Number(mes));

      condiciones.push(
        `c.mes = $${valores.length}`
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
          OR COALESCE(
            p.numero_recibo,
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
          p.id,
          p.cuota_id,
          p.socio_id,
          p.monto,
          p.fecha_pago,
          p.metodo_pago,
          p.numero_recibo,
          p.referencia,
          p.comprobante_url,
          p.estado,
          p.observacion,
          p.fecha_creacion,

          s.nombre,
          s.zona,
          s.lote,
          s.tipo,

          c.anio,
          c.mes,
          c.monto AS monto_cuota,
          c.estado AS estado_cuota

        FROM pagos_cuotas p

        INNER JOIN socios_club s
          ON s.id = p.socio_id

        INNER JOIN cuotas_club c
          ON c.id = p.cuota_id

        ${where}

        ORDER BY
          p.fecha_pago DESC,
          p.id DESC
        `,
        valores
      );

    const pagos =
      resultado.rows.map(
        (pago) => ({
          ...pago,

          monto:
            Number(
              pago.monto || 0
            ),

          monto_cuota:
            Number(
              pago.monto_cuota || 0
            ),
        })
      );

    res.json(pagos);

  } catch (error) {
    console.error(
      "Error obteniendo pagos:",
      error
    );

    res.status(500).json({
      mensaje:
        "No se pudieron obtener los pagos.",
    });
  }
});


/* =========================================================
   RESUMEN DE PAGOS
========================================================= */

router.get(
  "/resumen",
  async (req, res) => {
    try {
      const resultado =
        await pool.query(`
          SELECT
            COUNT(*)::int
              AS total,

            COUNT(*) FILTER (
              WHERE estado = 'pendiente'
            )::int
              AS pendientes,

            COUNT(*) FILTER (
              WHERE estado = 'aprobado'
            )::int
              AS aprobados,

            COUNT(*) FILTER (
              WHERE estado = 'rechazado'
            )::int
              AS rechazados,

            COALESCE(
              SUM(monto) FILTER (
                WHERE estado = 'aprobado'
              ),
              0
            ) AS total_aprobado

          FROM pagos_cuotas
        `);

      const fila =
        resultado.rows[0];

      res.json({
        total:
          Number(
            fila.total || 0
          ),

        pendientes:
          Number(
            fila.pendientes || 0
          ),

        aprobados:
          Number(
            fila.aprobados || 0
          ),

        rechazados:
          Number(
            fila.rechazados || 0
          ),

        totalAprobado:
          Number(
            fila.total_aprobado || 0
          ),
      });

    } catch (error) {
      console.error(
        "Error resumen pagos:",
        error
      );

      res.status(500).json({
        mensaje:
          "No se pudo obtener el resumen de pagos.",
      });
    }
  }
);


/* =========================================================
   CUOTAS PENDIENTES PARA REGISTRAR PAGO
========================================================= */

router.get(
  "/cuotas-pendientes",
  async (req, res) => {
    try {
      const {
        buscar = "",
      } = req.query;

      const valores = [];

      let filtro = "";

      if (buscar.trim()) {
        valores.push(
          `%${buscar.trim()}%`
        );

        filtro = `
          AND (
            s.nombre ILIKE $1
            OR s.zona ILIKE $1
            OR s.lote ILIKE $1
          )
        `;
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

            s.nombre,
            s.zona,
            s.lote,
            s.tipo

          FROM cuotas_club c

          INNER JOIN socios_club s
            ON s.id = c.socio_id

          WHERE
            c.estado IN (
              'pendiente',
              'vencido'
            )

            ${filtro}

          ORDER BY
            c.anio ASC,
            c.mes ASC,
            s.nombre ASC
          `,
          valores
        );

      res.json(
        resultado.rows.map(
          (fila) => ({
            ...fila,

            monto:
              Number(
                fila.monto || 0
              ),
          })
        )
      );

    } catch (error) {
      console.error(
        "Error cuotas pendientes:",
        error
      );

      res.status(500).json({
        mensaje:
          "No se pudieron obtener las cuotas pendientes.",
      });
    }
  }
);


/* =========================================================
   REGISTRAR PAGO
========================================================= */

router.post(
  "/",
  async (req, res) => {
    try {
      const {
        cuotaId,
        monto,
        fechaPago,
        metodoPago,
        numeroRecibo,
        referencia = "",
        observacion = "",
      } = req.body;

      if (
        !cuotaId ||
        !monto ||
        !fechaPago ||
        !metodoPago
      ) {
        return res
          .status(400)
          .json({
            mensaje:
              "Cuota, monto, fecha y método de pago son obligatorios.",
          });
      }

      const cuotaResult =
        await pool.query(
          `
          SELECT
            c.id,
            c.socio_id,
            c.monto,
            c.estado,

            s.nombre

          FROM cuotas_club c

          INNER JOIN socios_club s
            ON s.id = c.socio_id

          WHERE c.id = $1
          `,
          [cuotaId]
        );

      if (
        cuotaResult.rows.length === 0
      ) {
        return res
          .status(404)
          .json({
            mensaje:
              "La cuota seleccionada no existe.",
          });
      }

      const cuota =
        cuotaResult.rows[0];

      if (
        cuota.estado === "pagado"
      ) {
        return res
          .status(400)
          .json({
            mensaje:
              "Esta cuota ya se encuentra pagada.",
          });
      }

      if (
        !Number.isFinite(Number(monto)) || Number(monto) <= 0
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
          INSERT INTO pagos_cuotas (
            cuota_id,
            socio_id,
            monto,
            fecha_pago,
            metodo_pago,
            numero_recibo,
            referencia,
            estado,
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
            'pendiente',
            $8
          )

          RETURNING *
          `,
          [
            cuotaId,
            cuota.socio_id,
            Number(monto),
            fechaPago,
            metodoPago,
            numeroRecibo || null,
            referencia || null,
            observacion || null,
          ]
        );

      res.status(201).json({
        mensaje:
          "Pago registrado correctamente y pendiente de aprobación.",

        pago:
          resultado.rows[0],
      });

    } catch (error) {
      console.error(
        "Error registrando pago:",
        error
      );

      res.status(500).json({
        mensaje:
          "No se pudo registrar el pago.",
      });
    }
  }
);


/* =========================================================
   APROBAR PAGO
========================================================= */

router.patch(
  "/:id/aprobar",
  async (req, res) => {
    const client =
      await pool.connect();

    try {
      await client.query(
        "BEGIN"
      );

      const pagoResult =
        await client.query(
          `
          SELECT *
          FROM pagos_cuotas
          WHERE id = $1
          FOR UPDATE
          `,
          [req.params.id]
        );

      if (
        pagoResult.rows.length === 0
      ) {
        await client.query(
          "ROLLBACK"
        );

        return res
          .status(404)
          .json({
            mensaje:
              "Pago no encontrado.",
          });
      }

      const pago =
        pagoResult.rows[0];

      if (
        pago.estado !==
        "pendiente"
      ) {
        await client.query(
          "ROLLBACK"
        );

        return res
          .status(400)
          .json({
            mensaje:
              "El pago ya fue revisado.",
          });
      }

      await client.query("SELECT id FROM cuotas_club WHERE id = $1 FOR UPDATE", [pago.cuota_id]);

      await client.query(
        `
        UPDATE pagos_cuotas

        SET
          estado = 'aprobado',
          fecha_revision =
            CURRENT_TIMESTAMP

        WHERE id = $1
        `,
        [req.params.id]
      );

      /*
        Sumamos únicamente pagos
        aprobados de la cuota.
      */

      const totalResult =
        await client.query(
          `
          SELECT
            COALESCE(
              SUM(monto),
              0
            ) AS total_pagado

          FROM pagos_cuotas

          WHERE
            cuota_id = $1
            AND estado = 'aprobado'
          `,
          [pago.cuota_id]
        );

      const cuotaResult =
        await client.query(
          `
          SELECT
            monto
          FROM cuotas_club
          WHERE id = $1
          FOR UPDATE
          `,
          [pago.cuota_id]
        );

      const totalPagado =
        Number(
          totalResult.rows[0]
            .total_pagado || 0
        );

      const montoCuota =
        Number(
          cuotaResult.rows[0]
            ?.monto || 0
        );

      /*
        Si se cubrió el monto completo,
        marcamos la cuota como pagada.
      */

      if (
        totalPagado >= montoCuota
      ) {
        await client.query(
          `
          UPDATE cuotas_club

          SET estado = 'pagado'

          WHERE id = $1
          `,
          [pago.cuota_id]
        );
      }

      await client.query(
        "COMMIT"
      );

      res.json({
        mensaje:
          totalPagado >= montoCuota
            ? "Pago aprobado y cuota marcada como pagada."
            : "Pago aprobado. La cuota todavía tiene saldo pendiente.",

        totalPagado,
        montoCuota,

        cuotaPagada:
          totalPagado >=
          montoCuota,
      });

    } catch (error) {
      await client.query(
        "ROLLBACK"
      );

      console.error(
        "Error aprobando pago:",
        error
      );

      res.status(500).json({
        mensaje:
          "No se pudo aprobar el pago.",
      });

    } finally {
      client.release();
    }
  }
);


/* =========================================================
   RECHAZAR PAGO
========================================================= */

router.patch(
  "/:id/rechazar",
  async (req, res) => {
    try {
      const {
        observacion = "",
      } = req.body;

      const resultado =
        await pool.query(
          `
          UPDATE pagos_cuotas

          SET
            estado = 'rechazado',
            observacion = $1,
            fecha_revision =
              CURRENT_TIMESTAMP

          WHERE
            id = $2
            AND estado = 'pendiente'

          RETURNING *
          `,
          [
            observacion ||
              "Pago rechazado.",
            req.params.id,
          ]
        );

      if (
        resultado.rows.length === 0
      ) {
        return res
          .status(404)
          .json({
            mensaje:
              "Pago no encontrado o ya revisado.",
          });
      }

      res.json({
        mensaje:
          "Pago rechazado.",

        pago:
          resultado.rows[0],
      });

    } catch (error) {
      console.error(
        "Error rechazando pago:",
        error
      );

      res.status(500).json({
        mensaje:
          "No se pudo rechazar el pago.",
      });
    }
  }
);


export default router;