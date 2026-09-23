import { randomInt } from "node:crypto";
import { autenticar, roles } from "../middleware/auth.js";
import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { pool } from "../db.js";

const router = Router();
const codigosJefe = new Map();
const intentosLogin = new Map();
const limpieza = setInterval(() => {
  for (const [key, value] of intentosLogin) if (value.vence < Date.now()) intentosLogin.delete(key);
  for (const [key, value] of codigosJefe) if (value.vence < Date.now()) codigosJefe.delete(key);
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

function generarCodigo() {
  return String(randomInt(100000, 1000000));
}

async function enviarCodigoPorCorreo(correo, codigo) {
  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
    throw new Error("Falta configurar MAIL_USER y MAIL_PASS en .env");
  }

  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST || "smtp.gmail.com",
    port: Number(process.env.MAIL_PORT || 587),
    secure: Number(process.env.MAIL_PORT || 587) === 465,
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
      const codigo = generarCodigo();
      const vence = Date.now() + 10 * 60 * 1000;

      await enviarCodigoPorCorreo(usuario.correo, codigo);

      codigosJefe.set(usuario.id, {
        codigo,
        intentos: 0,
        vence,
        usuario,
      });

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
    console.error(error);
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

    const registro = codigosJefe.get(Number(usuarioId));

    if (!registro) {
      return res.status(400).json({
        mensaje: "Solicita un nuevo codigo de acceso",
      });
    }

    if (Date.now() > registro.vence) {
      codigosJefe.delete(Number(usuarioId));
      return res.status(400).json({
        mensaje: "El codigo vencio. Solicita uno nuevo",
      });
    }

    registro.intentos += 1;
    if (registro.intentos >= 5) codigosJefe.delete(Number(usuarioId));
    if (registro.codigo !== codigo.trim()) {
      return res.status(401).json({
        mensaje: "Codigo incorrecto",
      });
    }

    codigosJefe.delete(Number(usuarioId));

    const vigente = await pool.query("SELECT id, nombre, correo, rol FROM usuarios WHERE id = $1 AND estado = true AND rol = 'jefe'", [Number(usuarioId)]);
    if (!vigente.rows[0]) return res.status(401).json({ mensaje: "La cuenta ya no está habilitada." });
    const token = crearToken(vigente.rows[0]);

    res.json({
      token,
      usuario: datosUsuario(vigente.rows[0]),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: "Error al verificar el codigo",
    });
  }
});

router.get("/me", autenticar, (req, res) => res.json({ usuario: req.usuario }));

router.post("/register", autenticar, roles("jefe", "admin"), async (req, res) => {
  try {
    const { nombre, correo, password, rol } = req.body;

    if (![nombre, correo, password, rol].every(v => typeof v === "string" && v.trim()) || password.length < 8) {
      return res.status(400).json({
        mensaje: "Todos los campos son obligatorios",
      });
    }

    const rolesPermitidos = req.usuario.rol === "jefe" ? ["admin", "usuario", "jefe", "contador"] : ["usuario"];

    if (!rolesPermitidos.includes(rol)) {
      return res.status(400).json({
        mensaje: "Rol no permitido",
      });
    }

    const correoNormalizado = correo.toLowerCase().trim();

    const passwordHash = await bcrypt.hash(password, 10);

    const resultado = await pool.query(
      `INSERT INTO usuarios (nombre, correo, password_hash, rol)
       VALUES ($1, $2, $3, $4)
       RETURNING id, nombre, correo, rol, estado`,
      [nombre.trim(), correoNormalizado, passwordHash, rol]
    );

    res.status(201).json({
      mensaje: "Usuario registrado correctamente",
      usuario: resultado.rows[0],
    });
  } catch (error) {
    console.error(error);

    if (error.code === "23505") {
      return res.status(400).json({
        mensaje: "Ese correo ya esta registrado",
      });
    }

    res.status(500).json({
      mensaje: "Error al registrar usuario",
    });
  }
});

export default router;
