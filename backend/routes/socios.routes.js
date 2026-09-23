import { roles } from '../middleware/auth.js';
import { transaccion, auditar, fallo, centimos } from '../services/contabilidad.js';
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
        usuario_id, numero_excel,
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
          usuario_id, numero_excel,
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

        FROM movimientos_vigentes_club

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


router.get('/cuentas/disponibles', roles('jefe','admin'), async(_req,res)=>res.json((await pool.query("SELECT id,nombre,correo FROM usuarios WHERE rol='usuario' AND estado=true ORDER BY nombre")).rows));
async function guardarSocio(req,res) {
 const {nombre,zona,lote,tipo='socio',cuota_base,usuario_id}=req.body||{};
 if(![nombre,zona,lote].every(v=>typeof v==='string'&&v.trim()&&v.length<=160))throw fallo(400,'Nombre, zona y lote son obligatorios.');
 const cuota=centimos(cuota_base)/100;
 const vinculo=usuario_id ? Number(usuario_id) : null;
 if(vinculo!==null&&!Number.isSafeInteger(vinculo))throw fallo(400,'Cuenta inválida.');
 const socio=await transaccion(async db=>{
  if(vinculo && !(await db.query("SELECT id FROM usuarios WHERE id=$1 AND rol='usuario' AND estado=true FOR SHARE",[vinculo])).rowCount)throw fallo(400,'Selecciona una cuenta activa de socio.');
  const values=[nombre.trim(),zona.trim().toUpperCase(),lote.trim().toUpperCase(),tipo,cuota,vinculo];
  let result;
  if(req.params.id)result=await db.query('UPDATE socios_club SET nombre=$1,zona=$2,lote=$3,tipo=$4,cuota_base=$5,usuario_id=$6 WHERE id=$7 RETURNING *',[...values,req.params.id]);
  else result=await db.query('INSERT INTO socios_club(nombre,zona,lote,tipo,cuota_base,usuario_id) VALUES($1,$2,$3,$4,$5,$6) RETURNING *',values);
  if(!result.rows[0])throw fallo(404,'Socio no encontrado.');
  await auditar(db,req.usuario.id,req.params.id?'editar':'crear','socio',result.rows[0].id,{usuario_id:vinculo,cuota_base:cuota});
  return result.rows[0];
 });res.status(req.params.id?200:201).json({socio,mensaje:'Socio guardado.'});
}
router.post('/',guardarSocio);
router.put('/:id',guardarSocio);
export default router;
