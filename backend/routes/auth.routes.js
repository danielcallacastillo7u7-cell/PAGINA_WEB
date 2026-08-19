import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { pool } from "../db.js";

const router = Router();
const codigosJefe = new Map();

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
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function enviarCodigoPorCorreo(correo, codigo) {
  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
    throw new Error("Falta configurar MAIL_USER y MAIL_PASS en .env");
  }

  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST || "smtp.gmail.com",
    port: Number(process.env.MAIL_PORT || 587),
    secure: false,
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

router.post("/login", async (req, res) => {
  try {
    const { correo, password } = req.body;

    if (!correo || !password) {
      return res.status(400).json({
        mensaje: "Correo y contrasena son obligatorios",
      });
    }

    const correoNormalizado = correo.toLowerCase().trim();

    const resultado = await pool.query(
      "SELECT * FROM usuarios WHERE correo = $1 AND estado = true",
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

    if (!usuarioId || !codigo) {
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

    if (registro.codigo !== codigo.trim()) {
      return res.status(401).json({
        mensaje: "Codigo incorrecto",
      });
    }

    codigosJefe.delete(Number(usuarioId));

    const token = crearToken(registro.usuario);

    res.json({
      token,
      usuario: datosUsuario(registro.usuario),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: "Error al verificar el codigo",
    });
  }
});

router.post("/register", async (req, res) => {
  try {
    const { nombre, correo, password, rol } = req.body;

    if (!nombre || !correo || !password || !rol) {
      return res.status(400).json({
        mensaje: "Todos los campos son obligatorios",
      });
    }

    const rolesPermitidos = ["admin", "usuario", "jefe", "contador"];

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
