import { Router } from "express";
import multer from "multer";
import XLSX from "xlsx";
import fs from "fs";
import { pool } from "../db.js";

const router = Router();

const upload = multer({
  dest: "uploads/excel/",
});


/* =============================================
   UTILIDADES
============================================= */

function texto(valor) {
  if (valor === null || valor === undefined) {
    return "";
  }

  return String(valor).trim();
}


function numero(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return null;
  }

  const limpio = String(valor)
    .replace("S/", "")
    .replace("S/.", "")
    .replace(",", "")
    .trim();

  const resultado = Number(limpio);

  return Number.isNaN(resultado)
    ? null
    : resultado;
}


function fechaExcel(valor) {
  if (!valor) {
    return null;
  }

  if (valor instanceof Date) {
    return valor.toISOString().split("T")[0];
  }

  if (typeof valor === "number") {
    const fecha = XLSX.SSF.parse_date_code(valor);

    if (!fecha) {
      return null;
    }

    const mes = String(fecha.m).padStart(2, "0");
    const dia = String(fecha.d).padStart(2, "0");

    return `${fecha.y}-${mes}-${dia}`;
  }

  const posibleFecha = new Date(valor);

  if (!Number.isNaN(posibleFecha.getTime())) {
    return posibleFecha.toISOString().split("T")[0];
  }

  return null;
}


/* =============================================
   LEER LISTA SOCIOS
============================================= */

function obtenerSocios(workbook) {

  const hoja = workbook.Sheets["LISTA SOCIOS"];

  if (!hoja) {
    return [];
  }

  const filas = XLSX.utils.sheet_to_json(
    hoja,
    {
      header: 1,
      defval: null,
      raw: true,
    }
  );

  const socios = [];

  /*
    En el Excel real:

    A = número
    B = DIRECCION / tipo MZA
    C = zona
    D = lote
    E = tipo
    F = nombre socio
    G = cuota
  */

  for (let i = 8; i < filas.length; i++) {

    const fila = filas[i];

    if (!fila) continue;

    const nombre = texto(fila[5]);

    if (!nombre) {
      continue;
    }

    const zona = texto(fila[2]);
    const lote = texto(fila[3]);

    /*
      Evitamos traer textos inferiores,
      subtotales o información ajena al padrón.
    */

    if (!zona && !lote) {
      continue;
    }

    socios.push({
      numeroExcel:
        numero(fila[0]),

      direccionTipo:
        texto(fila[1]),

      zona,

      lote,

      tipo:
        texto(fila[4]),

      nombre,

      cuotaBase:
        numero(fila[6]),
    });
  }

  return socios;
}


/* =============================================
   LEER INGRESOS Y EGRESOS
============================================= */

function obtenerMovimientos(workbook) {

  const movimientos = [];

  workbook.SheetNames.forEach((nombreHoja) => {

    if (nombreHoja === "LISTA SOCIOS") {
      return;
    }

    const hoja =
      workbook.Sheets[nombreHoja];

    const filas =
      XLSX.utils.sheet_to_json(
        hoja,
        {
          header: 1,
          defval: null,
          raw: true,
        }
      );

    let tipoActual = null;

    let columnas = null;


    for (let i = 0; i < filas.length; i++) {

      const fila = filas[i];

      if (!fila) continue;


      const contenido = fila
        .map((celda) =>
          texto(celda).toUpperCase()
        )
        .join(" ");


      /*
       * Determinar sección
       */

      if (
        contenido.includes("INGRESOS") &&
        !contenido.includes("EGRESOS")
      ) {
        tipoActual = "ingreso";
      }


      if (
        contenido.includes("EGRESOS") &&
        !contenido.includes("INGRESOS Y EGRESOS")
      ) {
        tipoActual = "egreso";
      }


      /*
       * Buscar encabezado de tabla
       */

      const indiceFecha =
        fila.findIndex((v) =>
          texto(v)
            .toUpperCase()
            .includes("FECHA")
        );


      const indiceDireccion =
        fila.findIndex((v) =>
          texto(v)
            .toUpperCase()
            .includes("DIRECCION")
        );


      const indiceConcepto =
        fila.findIndex((v) =>
          texto(v)
            .toUpperCase()
            .includes("CONCEPTO")
        );


      const indiceRecibo =
        fila.findIndex((v) => {

          const t =
            texto(v).toUpperCase();

          return (
            t.includes("RECIBO") ||
            t.includes("COMPROBANTE")
          );
        });


      const indiceMonto =
        fila.findIndex((v) =>
          texto(v)
            .toUpperCase()
            .includes("MONTO")
        );


      if (
        indiceFecha !== -1 &&
        indiceConcepto !== -1 &&
        indiceMonto !== -1
      ) {

        columnas = {
          fecha: indiceFecha,
          direccion: indiceDireccion,
          concepto: indiceConcepto,
          recibo: indiceRecibo,
          monto: indiceMonto,
        };

        continue;
      }


      if (!columnas || !tipoActual) {
        continue;
      }


      const fecha =
        fechaExcel(
          fila[columnas.fecha]
        );


      const concepto =
        texto(
          fila[columnas.concepto]
        );


      const monto =
        numero(
          fila[columnas.monto]
        );


      /*
       * Si la fila ya no parece un movimiento,
       * se ignora.
       */

      if (
        !fecha ||
        !concepto ||
        monto === null
      ) {
        continue;
      }


      movimientos.push({

        fecha,

        tipo:
          tipoActual,

        direccion:
          columnas.direccion >= 0
            ? texto(
                fila[columnas.direccion]
              )
            : "",

        concepto,

        numeroRecibo:
          columnas.recibo >= 0
            ? texto(
                fila[columnas.recibo]
              )
            : "",

        monto,

        hojaExcel:
          nombreHoja,

      });

    }

  });

  return movimientos;
}


/* =============================================
   ANALIZAR EXCEL
   NO GUARDA NADA
============================================= */

router.post(
  "/analizar",
  upload.single("archivo"),
  async (req, res) => {

    try {

      if (!req.file) {

        return res.status(400).json({
          mensaje:
            "Debes seleccionar un archivo Excel.",
        });

      }


      const workbook =
        XLSX.readFile(
          req.file.path,
          {
            cellDates: true,
          }
        );


      const socios =
        obtenerSocios(workbook);


      const movimientos =
        obtenerMovimientos(workbook);


      const ingresos =
        movimientos.filter(
          (m) =>
            m.tipo === "ingreso"
        );


      const egresos =
        movimientos.filter(
          (m) =>
            m.tipo === "egreso"
        );


      fs.unlinkSync(
        req.file.path
      );


      res.json({

        archivo:
          req.file.originalname,

        resumen: {

          socios:
            socios.length,

          movimientos:
            movimientos.length,

          ingresos:
            ingresos.length,

          egresos:
            egresos.length,

          montoIngresos:
            ingresos.reduce(
              (total, mov) =>
                total +
                Number(mov.monto),
              0
            ),

          montoEgresos:
            egresos.reduce(
              (total, mov) =>
                total +
                Number(mov.monto),
              0
            ),

        },

        socios:
          socios.slice(0, 20),

        movimientos:
          movimientos.slice(0, 50),

      });

    } catch (error) {

      console.error(
        "Error analizando Excel:",
        error
      );


      res.status(500).json({
        mensaje:
          "No se pudo analizar el archivo Excel.",
      });

    }

  }
);


/* =============================================
   CONFIRMAR IMPORTACIÓN
============================================= */

router.post(
  "/confirmar",
  upload.single("archivo"),
  async (req, res) => {

    const cliente =
      await pool.connect();

    try {

      if (!req.file) {

        return res.status(400).json({
          mensaje:
            "Debes seleccionar el archivo Excel.",
        });

      }


      const workbook =
        XLSX.readFile(
          req.file.path,
          {
            cellDates: true,
          }
        );


      const socios =
        obtenerSocios(workbook);


      const movimientos =
        obtenerMovimientos(workbook);


      await cliente.query(
        "BEGIN"
      );


      const importacion =
        await cliente.query(
          `
          INSERT INTO importaciones_excel
          (
            nombre_archivo,
            total_socios,
            total_movimientos
          )
          VALUES ($1, $2, $3)

          RETURNING id
          `,
          [
            req.file.originalname,
            socios.length,
            movimientos.length,
          ]
        );


      const importacionId =
        importacion.rows[0].id;


      /*
       * Guardar socios
       */

      for (const socio of socios) {

        await cliente.query(
          `
          INSERT INTO socios_club
          (
            numero_excel,
            direccion_tipo,
            zona,
            lote,
            tipo,
            nombre,
            cuota_base,
            importacion_id
          )

          VALUES
          (
            $1,$2,$3,$4,$5,$6,$7,$8
          )
          `,
          [
            socio.numeroExcel,
            socio.direccionTipo,
            socio.zona,
            socio.lote,
            socio.tipo,
            socio.nombre,
            socio.cuotaBase,
            importacionId,
          ]
        );

      }


      /*
       * Guardar movimientos
       */

      for (
        const movimiento
        of movimientos
      ) {

        await cliente.query(
          `
          INSERT INTO movimientos_financieros
          (
            fecha,
            tipo,
            direccion,
            concepto,
            numero_recibo,
            monto,
            hoja_excel,
            importacion_id
          )

          VALUES
          (
            $1,$2,$3,$4,$5,$6,$7,$8
          )
          `,
          [
            movimiento.fecha,
            movimiento.tipo,
            movimiento.direccion,
            movimiento.concepto,
            movimiento.numeroRecibo,
            movimiento.monto,
            movimiento.hojaExcel,
            importacionId,
          ]
        );

      }


      await cliente.query(
        "COMMIT"
      );


      fs.unlinkSync(
        req.file.path
      );


      res.status(201).json({

        mensaje:
          "Archivo importado correctamente.",

        importacionId,

        socios:
          socios.length,

        movimientos:
          movimientos.length,

      });

    } catch (error) {

      await cliente.query(
        "ROLLBACK"
      );


      console.error(
        "Error importando Excel:",
        error
      );


      res.status(500).json({
        mensaje:
          "Error al importar el archivo.",
      });

    } finally {

      cliente.release();

    }

  }
);


export default router;