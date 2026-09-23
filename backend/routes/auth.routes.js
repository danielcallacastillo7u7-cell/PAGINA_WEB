import { emitirCodigo, verificarCodigo } from "../services/codigos.js";
import { crearCuenta, validarPassword } from "../services/cuentas.js";
import { transaccion, auditar, fallo } from "../services/contabilidad.js";
import { autenticar, roles } from "../middleware/auth.js";
import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { pool } from "../db.js";

const router = Router();
const intentosLogin = new Map();
const limpieza = setInterval(() => {
  for (const [key, value] of intentosLogin) if (value.vence < Date.now()) intentosLogin.delete(key);
}, 60000);
limpieza.unref();
function limitarLogin(req, res, next) {
  const key = req.ip;
  let registro = intentosLogin.get(key);
  if (!registro || registro.vence < Date.now()) registro = { cuenta: 0, vence: Date.now() + 60000 };
  registro.cuenta++;
  intentosLogin.set(key, registro);
  if (registro.cuenta > 10) return res.status(429).json({ mensaje: "Demasiados intentos. Espera un minuto." });
  next();
}

function crearToken(usuario) {
  return jwt.sign(
    {
      id: usuario.id,
      rol: usuario.rol,
      sv: usuario.auth_version || 0,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "2h",
    }
  );
}

function datosUsuario(usuario) {
  return {
    id: usuario.id,
    nombre: usuario.nombre,
    correo: usuario.correo,
    rol: usuario.rol,
  };
}

async function enviarCodigoPorCorreo(correo, codigo) {
  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
    throw new Error("Falta configurar MAIL_USER y MAIL_PASS en .env");
  }

  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST || "smtp.gmail.com",
    port: Number(process.env.MAIL_PORT || 587),
    secure: Number(process.env.MAIL_PORT || 587) === 465,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.MAIL_USER,
    to: correo,
    subject: "Codigo de acceso administrativo",
    html: `
      <h2>Acceso administrativo</h2>
      <p>Tu codigo para ingresar al panel de jefe es:</p>
      <h1 style="letter-spacing:4px;">${codigo}</h1>
      <p>Este codigo vence en 10 minutos.</p>
    `,
  });
}

router.get("/test", (req, res) => {
  res.json({ mensaje: "Ruta auth funcionando correctamente" });
});

router.post("/login", limitarLogin, async (req, res) => {
  try {
    const { correo, password } = req.body;

    if (typeof correo !== "string" || typeof password !== "string" || !correo.trim() || !password) {
      return res.status(400).json({
        mensaje: "Correo y contrasena son obligatorios",
      });
    }

    const correoNormalizado = correo.toLowerCase().trim();

    const resultado = await pool.query(
      "SELECT * FROM usuarios WHERE LOWER(correo) = $1 AND estado = true",
      [correoNormalizado]
    );

    if (resultado.rows.length === 0) {
      return res.status(401).json({
        mensaje: "Credenciales incorrectas",
      });
    }

    const usuario = resultado.rows[0];

    const passwordValido = await bcrypt.compare(
      password,
      usuario.password_hash
    );

    if (!passwordValido) {
      return res.status(401).json({
        mensaje: "Credenciales incorrectas",
      });
    }

    if (usuario.rol === "jefe") {
      await emitirCodigo(usuario.id, codigo => enviarCodigoPorCorreo(usuario.correo,codigo));

      return res.json({
        requiereCodigo: true,
        mensaje: "Codigo enviado al correo del jefe",
        usuarioPendiente: {
          id: usuario.id,
          correo: usuario.correo,
          rol: usuario.rol,
        },
      });
    }

    const token = crearToken(usuario);

    res.json({
      token,
      usuario: datosUsuario(usuario),
    });
  } catch (error) {
    console.error("Error de autenticación:", error.code || error.name);
    res.status(500).json({
      mensaje:
        error.message === "Falta configurar MAIL_USER y MAIL_PASS en .env"
          ? "Falta configurar el correo para enviar el codigo administrativo"
          : "Error en el servidor",
    });
  }
});

router.post("/verificar-jefe", async (req, res) => {
  try {
    const { usuarioId, codigo } = req.body;

    if (!Number.isSafeInteger(Number(usuarioId)) || typeof codigo !== "string" || !/^\d{6}$/.test(codigo)) {
      return res.status(400).json({
        mensaje: "El codigo es obligatorio",
      });
    }

    const resultado = await verificarCodigo(Number(usuarioId), codigo);
    if (resultado.error) return res.status(401).json({mensaje:resultado.error});
    res.json({token:crearToken(resultado.usuario),usuario:datosUsuario(resultado.usuario)});
  } catch (error) {
    console.error("Error de autenticación:", error.code || error.name);
    res.status(500).json({
      mensaje: "Error al verificar el codigo",
    });
  }
});

router.get("/me", autenticar, (req, res) => res.json({ usuario: req.usuario }));

router.post("/register", autenticar, roles("jefe", "admin"), async (req,res) => {
  const usuario = await crearCuenta(req.usuario,req.body||{});
  res.status(201).json({mensaje:'Cuenta creada correctamente.',usuario});
});

router.post('/cambiar-password', autenticar, limitarLogin, async (req,res) => {
  const {actual,nueva}=req.body||{};
  if (typeof actual !== 'string' || !actual || actual.length>1000) throw fallo(400,'Indica tu contraseña actual.');
  validarPassword(nueva);
  await transaccion(async db => {
    const u=(await db.query('SELECT password_hash FROM usuarios WHERE id=$1 FOR UPDATE',[req.usuario.id])).rows[0];
    if (!u || !await bcrypt.compare(actual,u.password_hash)) throw fallo(400,'La contraseña actual no es correcta.');
    if (await bcrypt.compare(nueva,u.password_hash)) throw fallo(400,'Elige una contraseña diferente.');
    const hash=await bcrypt.hash(nueva,10);
    await db.query('UPDATE usuarios SET password_hash=$1,auth_version=auth_version+1 WHERE id=$2',[hash,req.usuario.id]);
    await db.query('UPDATE codigos_acceso SET usado=true WHERE usuario_id=$1',[req.usuario.id]);
    await auditar(db,req.usuario.id,'cambiar_password','cuenta',req.usuario.id);
  });
  res.json({mensaje:'Contraseña actualizada. Inicia sesión nuevamente.'});
});

export default router;
