import { uploads } from '../services/uploads.js';
import { registrarPago, revisarPago, transaccion, fallo } from '../services/contabilidad.js';
import { roles } from '../middleware/auth.js';
import path from 'node:path';
﻿import { Router } from "express";
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
            c.monto, c.saldo, c.pagado, c.disponible,
            c.estado,
            c.fecha_vencimiento,

            s.nombre,
            s.zona,
            s.lote,
            s.tipo

          FROM saldos_cuotas_club c

          INNER JOIN socios_club s
            ON s.id = c.socio_id

          WHERE
            c.disponible > 0

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

router.post('/', async (req,res) => res.status(201).json({ mensaje: 'Pago registrado para revisión.', pago: await transaccion(db => registrarPago(db,req.usuario.id,req.body)) }));
router.get('/:id/comprobante', async(req,res) => {
 const pago=(await pool.query('SELECT comprobante_url FROM pagos_cuotas WHERE id=$1',[req.params.id])).rows[0];
 const file=path.basename(pago?.comprobante_url||'');
 if(!/\.(png|jpe?g|webp)$/i.test(file))throw fallo(404,'Comprobante no disponible.');
 res.setHeader('X-Content-Type-Options','nosniff');res.sendFile(file,{root:uploads});
});
router.patch('/:id/anular',roles('jefe'),async(req,res)=>res.json(await transaccion(db=>revisarPago(db,req.usuario.id,req.params.id,'anular',req.body?.motivo||req.body?.observacion))));
router.patch('/:id/:accion',async(req,res)=>{
 if(!['aprobar','rechazar'].includes(req.params.accion))throw fallo(404,'Acción no encontrada.');
 res.json(await transaccion(db=>revisarPago(db,req.usuario.id,req.params.id,req.params.accion,req.body?.observacion)));
});
export default router;
