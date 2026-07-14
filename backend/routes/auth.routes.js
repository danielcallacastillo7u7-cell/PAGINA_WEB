import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";

const router = Router();

router.get("/test", (req, res) => {
  res.json({ mensaje: "Ruta auth funcionando correctamente" });
});

router.post("/login", async (req, res) => {
  try {
    const { correo, password } = req.body;

    if (!correo || !password) {
      return res.status(400).json({
        mensaje: "Correo y contraseña son obligatorios",
      });
    }
    
    

    const resultado = await pool.query(
      "SELECT * FROM usuarios WHERE correo = $1 AND estado = true",
      [correo]
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

    const token = jwt.sign(
      {
        id: usuario.id,
        rol: usuario.rol,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "2h",
      }
    );

    res.json({
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: "Error en el servidor",
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
        mensaje: "Ese correo ya está registrado",
      });
    }

    res.status(500).json({
      mensaje: "Error al registrar usuario",
    });
  }
});
export default router;