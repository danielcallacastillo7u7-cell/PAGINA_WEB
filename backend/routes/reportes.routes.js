import { Router } from "express";
import { pool } from "../db.js";
import * as XLSX from "xlsx";

const router = Router();

const MESES = [
  "",
  "ENERO",
  "FEBRERO",
  "MARZO",
  "ABRIL",
  "MAYO",
  "JUNIO",
  "JULIO",
  "AGOSTO",
  "SEPTIEMBRE",
  "OCTUBRE",
  "NOVIEMBRE",
  "DICIEMBRE",
];


/* =========================================================
   RESUMEN DE UN MES
========================================================= */

router.get(
  "/resumen",
  async (req, res) => {
    try {
      const ahora =
        new Date();

      const anio =
        Number(
          req.query.anio ||
          ahora.getFullYear()
        );

      const mes =
        Number(
          req.query.mes ||
          ahora.getMonth() + 1
        );


      /* ==========================================
         CUOTAS GENERADAS
      ========================================== */

      const cuotasResult =
        await pool.query(
          `
          SELECT

            COUNT(*)::int
              AS total_cuotas,

            COUNT(*) FILTER (
              WHERE estado = 'pagado'
            )::int
              AS cuotas_pagadas,

            COUNT(*) FILTER (
              WHERE estado = 'pendiente'
            )::int
              AS cuotas_pendientes,

            COUNT(*) FILTER (
              WHERE estado = 'vencido'
            )::int
              AS cuotas_vencidas,

            COALESCE(
              SUM(monto),
              0
            ) AS monto_generado,

            COALESCE(
              SUM(saldo),
              0
            ) AS monto_por_cobrar

          FROM saldos_cuotas_club

          WHERE
            anio = $1
            AND mes = $2
          `,
          [
            anio,
            mes,
          ]
        );


      /* ==========================================
         PAGOS DE CUOTAS APROBADOS
      ========================================== */

      const pagosResult =
        await pool.query(
          `
          SELECT
            COUNT(*)::int
              AS cantidad_pagos,

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


      /* ==========================================
         OTROS INGRESOS Y EGRESOS
      ========================================== */

      const movimientosResult =
        await pool.query(
          `
          SELECT

            COALESCE(
              SUM(monto)
              FILTER (
                WHERE tipo = 'ingreso'
              ),
              0
            ) AS otros_ingresos,

            COALESCE(
              SUM(monto)
              FILTER (
                WHERE tipo = 'egreso'
              ),
              0
            ) AS egresos,

            COUNT(*) FILTER (
              WHERE tipo = 'ingreso'
            )::int
              AS cantidad_ingresos,

            COUNT(*) FILTER (
              WHERE tipo = 'egreso'
            )::int
              AS cantidad_egresos

          FROM movimientos_vigentes_club

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


      const cuotas =
        cuotasResult.rows[0];

      const pagos =
        pagosResult.rows[0];

      const movimientos =
        movimientosResult.rows[0];


      const cuotasCobradas =
        Number(
          pagos.cuotas_cobradas || 0
        );

      const otrosIngresos =
        Number(
          movimientos.otros_ingresos ||
          0
        );

      const egresos =
        Number(
          movimientos.egresos || 0
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

        totalCuotas:
          Number(
            cuotas.total_cuotas || 0
          ),

        cuotasPagadas:
          Number(
            cuotas.cuotas_pagadas || 0
          ),

        cuotasPendientes:
          Number(
            cuotas.cuotas_pendientes || 0
          ),

        cuotasVencidas:
          Number(
            cuotas.cuotas_vencidas || 0
          ),

        montoGenerado:
          Number(
            cuotas.monto_generado || 0
          ),

        montoPorCobrar:
          Number(
            cuotas.monto_por_cobrar || 0
          ),

        cantidadPagos:
          Number(
            pagos.cantidad_pagos || 0
          ),

        cuotasCobradas,

        otrosIngresos,

        totalIngresos,

        egresos,

        saldo,

        cantidadIngresos:
          Number(
            movimientos.cantidad_ingresos ||
            0
          ),

        cantidadEgresos:
          Number(
            movimientos.cantidad_egresos ||
            0
          ),
      });

    } catch (error) {
      console.error(
        "Error generando resumen:",
        error
      );

      res.status(500).json({
        mensaje:
          "No se pudo generar el reporte.",
      });
    }
  }
);


/* =========================================================
   MOVIMIENTOS DE UN MES
========================================================= */

router.get(
  "/movimientos",
  async (req, res) => {
    try {
      const {
        anio,
        mes,
      } = req.query;


      if (
        !anio ||
        !mes
      ) {
        return res
          .status(400)
          .json({
            mensaje:
              "Debe indicar año y mes.",
          });
      }


      /* PAGOS DE CUOTAS */

      const pagosResult =
        await pool.query(
          `
          SELECT

            p.id,

            p.fecha_pago
              AS fecha,

            s.zona,

            s.lote,

            s.nombre,

            p.numero_recibo,

            p.monto,

            p.metodo_pago,

            c.anio
              AS anio_cuota,

            c.mes
              AS mes_cuota

          FROM pagos_cuotas p

          INNER JOIN cuotas_club c
            ON c.id = p.cuota_id

          INNER JOIN socios_club s
            ON s.id = p.socio_id

          WHERE
            p.estado = 'aprobado'

            AND EXTRACT(
              YEAR FROM p.fecha_pago
            ) = $1

            AND EXTRACT(
              MONTH FROM p.fecha_pago
            ) = $2

          ORDER BY
            p.fecha_pago ASC
          `,
          [
            Number(anio),
            Number(mes),
          ]
        );


      /* OTROS MOVIMIENTOS */

      const movimientosResult =
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
            observacion

          FROM movimientos_vigentes_club

          WHERE
            EXTRACT(
              YEAR FROM fecha
            ) = $1

            AND EXTRACT(
              MONTH FROM fecha
            ) = $2

          ORDER BY
            fecha ASC
          `,
          [
            Number(anio),
            Number(mes),
          ]
        );


      const movimientos = [];


      pagosResult.rows.forEach(
        (pago) => {
          movimientos.push({
            id:
              `pago-${pago.id}`,

            fecha:
              pago.fecha,

            tipo:
              "ingreso",

            categoria:
              "Cuota mensual",

            direccion:
              `${pago.zona || ""}-${pago.lote || ""}`,

            concepto:
              `Cuota ${MESES[pago.mes_cuota]} ${pago.anio_cuota} - ${pago.nombre}`,

            numeroRecibo:
              pago.numero_recibo,

            metodoPago:
              pago.metodo_pago,

            ingreso:
              Number(
                pago.monto || 0
              ),

            egreso: 0,
          });
        }
      );


      movimientosResult.rows.forEach(
        (movimiento) => {
          movimientos.push({
            id:
              `mov-${movimiento.id}`,

            fecha:
              movimiento.fecha,

            tipo:
              movimiento.tipo,

            categoria:
              movimiento.categoria,

            direccion:
              "",

            concepto:
              movimiento.concepto,

            numeroRecibo:
              movimiento.numero_recibo,

            metodoPago:
              movimiento.metodo_pago,

            ingreso:
              movimiento.tipo ===
              "ingreso"
                ? Number(
                    movimiento.monto ||
                    0
                  )
                : 0,

            egreso:
              movimiento.tipo ===
              "egreso"
                ? Number(
                    movimiento.monto ||
                    0
                  )
                : 0,
          });
        }
      );


      movimientos.sort(
        (a, b) =>
          new Date(a.fecha) -
          new Date(b.fecha)
      );


      res.json(
        movimientos
      );

    } catch (error) {
      console.error(
        "Error obteniendo movimientos:",
        error
      );

      res.status(500).json({
        mensaje:
          "No se pudieron obtener los movimientos del reporte.",
      });
    }
  }
);


/* =========================================================
   GENERAR EXCEL ANUAL
========================================================= */

router.get(
  "/excel/:anio",
  async (req, res) => {
    try {
      const anio =
        Number(
          req.params.anio
        );


      if (
        !anio ||
        anio < 2000
      ) {
        return res
          .status(400)
          .json({
            mensaje:
              "Año no válido.",
          });
      }


      const workbook =
        XLSX.utils.book_new();


      /* =====================================================
         HOJA 1 - LISTA SOCIOS
      ===================================================== */

      const sociosResult =
        await pool.query(`
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

          ORDER BY
            zona ASC,
            lote ASC,
            nombre ASC
      `);


      const sociosExcel =
        sociosResult.rows.map(
          (socio, index) => ({
            "N°":
              socio.numero_excel ||
              index + 1,

            "DIRECCIÓN":
              socio.direccion_tipo ||
              "MZA",

            "ZONA":
              socio.zona || "",

            "LOTE":
              socio.lote || "",

            "TIPO":
              socio.tipo || "",

            "SOCIO":
              socio.nombre,

            "CUOTA":
              Number(
                socio.cuota_base ||
                0
              ),

            "ESTADO":
              socio.estado
                ? "ACTIVO"
                : "INACTIVO",
          })
        );


      const hojaSocios =
        XLSX.utils.json_to_sheet(
          sociosExcel
        );


      hojaSocios["!cols"] = [
        { wch: 8 },
        { wch: 14 },
        { wch: 10 },
        { wch: 10 },
        { wch: 10 },
        { wch: 38 },
        { wch: 14 },
        { wch: 14 },
      ];


      XLSX.utils.book_append_sheet(
        workbook,
        hojaSocios,
        "LISTA SOCIOS"
      );


      /* =====================================================
         HOJAS DE ENERO A DICIEMBRE
      ===================================================== */

      for (
        let mes = 1;
        mes <= 12;
        mes++
      ) {

        /* ============================
           PAGOS DE CUOTAS
        ============================ */

        const pagosResult =
          await pool.query(
            `
            SELECT

              p.fecha_pago
                AS fecha,

              p.numero_recibo,

              p.monto,

              p.metodo_pago,

              s.nombre,

              s.zona,

              s.lote,

              c.anio
                AS anio_cuota,

              c.mes
                AS mes_cuota

            FROM pagos_cuotas p

            INNER JOIN cuotas_club c
              ON c.id = p.cuota_id

            INNER JOIN socios_club s
              ON s.id = p.socio_id

            WHERE
              p.estado = 'aprobado'

              AND EXTRACT(
                YEAR FROM p.fecha_pago
              ) = $1

              AND EXTRACT(
                MONTH FROM p.fecha_pago
              ) = $2

            ORDER BY
              p.fecha_pago ASC
            `,
            [
              anio,
              mes,
            ]
          );


        /* ============================
           OTROS MOVIMIENTOS
        ============================ */

        const otrosResult =
          await pool.query(
            `
            SELECT
              fecha,
              tipo,
              categoria,
              concepto,
              monto,
              metodo_pago,
              numero_recibo

            FROM movimientos_vigentes_club

            WHERE
              EXTRACT(
                YEAR FROM fecha
              ) = $1

              AND EXTRACT(
                MONTH FROM fecha
              ) = $2

            ORDER BY
              fecha ASC
            `,
            [
              anio,
              mes,
            ]
          );


        const filas = [];


        pagosResult.rows.forEach(
          (pago) => {
            filas.push({
              FECHA:
                pago.fecha,

              DIRECCIÓN:
                `${pago.zona || ""}-${pago.lote || ""}`,

              CONCEPTO:
                `CUOTA ${MESES[pago.mes_cuota]} ${pago.anio_cuota} - ${pago.nombre}`,

              "N° RECIBO":
                pago.numero_recibo ||
                "",

              MÉTODO:
                pago.metodo_pago ||
                "",

              "INGRESO (S/)":
                Number(
                  pago.monto || 0
                ),

              "EGRESO (S/)":
                "",
            });
          }
        );


        otrosResult.rows.forEach(
          (movimiento) => {
            filas.push({
              FECHA:
                movimiento.fecha,

              DIRECCIÓN:
                "",

              CONCEPTO:
                movimiento.concepto,

              "N° RECIBO":
                movimiento.numero_recibo ||
                "",

              MÉTODO:
                movimiento.metodo_pago ||
                "",

              "INGRESO (S/)":
                movimiento.tipo ===
                "ingreso"
                  ? Number(
                      movimiento.monto ||
                      0
                    )
                  : "",

              "EGRESO (S/)":
                movimiento.tipo ===
                "egreso"
                  ? Number(
                      movimiento.monto ||
                      0
                    )
                  : "",
            });
          }
        );


        filas.sort(
          (a, b) =>
            new Date(a.FECHA) -
            new Date(b.FECHA)
        );


        const totalIngresos =
          filas.reduce(
            (total, fila) =>
              total +
              Number(
                fila[
                  "INGRESO (S/)"
                ] || 0
              ),
            0
          );


        const totalEgresos =
          filas.reduce(
            (total, fila) =>
              total +
              Number(
                fila[
                  "EGRESO (S/)"
                ] || 0
              ),
            0
          );


        const saldo =
          totalIngresos -
          totalEgresos;


        filas.push({
          FECHA: "",
          DIRECCIÓN: "",
          CONCEPTO:
            "TOTAL INGRESOS",
          "N° RECIBO": "",
          MÉTODO: "",
          "INGRESO (S/)":
            totalIngresos,
          "EGRESO (S/)": "",
        });


        filas.push({
          FECHA: "",
          DIRECCIÓN: "",
          CONCEPTO:
            "TOTAL EGRESOS",
          "N° RECIBO": "",
          MÉTODO: "",
          "INGRESO (S/)": "",
          "EGRESO (S/)":
            totalEgresos,
        });


        filas.push({
          FECHA: "",
          DIRECCIÓN: "",
          CONCEPTO:
            "SALDO DEL MES",
          "N° RECIBO": "",
          MÉTODO: "",
          "INGRESO (S/)":
            saldo,
          "EGRESO (S/)": "",
        });


        /*
          Si no existen movimientos,
          mantenemos por lo menos
          los encabezados.
        */

        const hoja =
          XLSX.utils.json_to_sheet(
            filas.length > 0
              ? filas
              : [
                  {
                    FECHA: "",
                    DIRECCIÓN: "",
                    CONCEPTO: "",
                    "N° RECIBO": "",
                    MÉTODO: "",
                    "INGRESO (S/)": "",
                    "EGRESO (S/)": "",
                  },
                ]
          );


        hoja["!cols"] = [
          { wch: 14 },
          { wch: 14 },
          { wch: 50 },
          { wch: 15 },
          { wch: 22 },
          { wch: 16 },
          { wch: 16 },
        ];


        XLSX.utils.book_append_sheet(
          workbook,
          hoja,
          `ING-EGRE ${MESES[mes]}`
        );
      }


      /* =====================================================
         RESUMEN ANUAL
      ===================================================== */

      const resumenAnual = [];


      for (
        let mes = 1;
        mes <= 12;
        mes++
      ) {

        const cuotasMes =
          await pool.query(
            `
            SELECT
              COALESCE(
                SUM(monto),
                0
              ) AS total

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


        const movimientosMes =
          await pool.query(
            `
            SELECT

              COALESCE(
                SUM(monto)
                FILTER (
                  WHERE tipo = 'ingreso'
                ),
                0
              ) AS ingresos,

              COALESCE(
                SUM(monto)
                FILTER (
                  WHERE tipo = 'egreso'
                ),
                0
              ) AS egresos

            FROM movimientos_vigentes_club

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


        const cuotas =
          Number(
            cuotasMes.rows[0]
              .total || 0
          );

        const otros =
          Number(
            movimientosMes.rows[0]
              .ingresos || 0
          );

        const egresos =
          Number(
            movimientosMes.rows[0]
              .egresos || 0
          );


        resumenAnual.push({
          MES:
            MESES[mes],

          "CUOTAS COBRADAS":
            cuotas,

          "OTROS INGRESOS":
            otros,

          "TOTAL INGRESOS":
            cuotas + otros,

          EGRESOS:
            egresos,

          SALDO:
            cuotas +
            otros -
            egresos,
        });
      }


      const hojaResumen =
        XLSX.utils.json_to_sheet(
          resumenAnual
        );


      hojaResumen["!cols"] = [
        { wch: 18 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
        { wch: 18 },
        { wch: 18 },
      ];


      XLSX.utils.book_append_sheet(
        workbook,
        hojaResumen,
        "RESUMEN ANUAL"
      );


      /* =====================================================
         ENVIAR ARCHIVO
      ===================================================== */

      const buffer =
        XLSX.write(
          workbook,
          {
            type: "buffer",
            bookType: "xlsx",
          }
        );


      const nombreArchivo =
        `CLUB_CATARINDO_${anio}.xlsx`;


      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${nombreArchivo}"`
      );

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );


      res.send(buffer);

    } catch (error) {
      console.error(
        "Error generando Excel:",
        error
      );

      res.status(500).json({
        mensaje:
          "No se pudo generar el archivo Excel.",
      });
    }
  }
);


export default router;