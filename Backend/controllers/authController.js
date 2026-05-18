require('dotenv').config();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Resend } = require('resend'); // ← cambiar nodemailer
const db = require('../config/db');
const resend = new Resend(process.env.RESEND_API_KEY); // ← instancia global


// Login socio
const loginSocio = async (req, res) => {
    try {
        const { correo, contrasena } = req.body;
        console.log("Intentando login para:", correo);
    const result = await db.query('SELECT * FROM socios WHERE correo = $1', [correo]);

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
        }

        const socio = result.rows[0];
        const valido = await bcrypt.compare(contrasena, socio.contrasena);

        if (!valido) {
            return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
        }

        const token = jwt.sign(
            { id: socio.id, correo: socio.correo, rol: 'socio' },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({ token, id: socio.id, nombre: socio.nombre, correo: socio.correo, rol: 'socio' });

    } catch (error) {
        console.error("❌ ERROR EN LOGIN:", error.message);
        res.status(500).json({ error: 'Error interno: ' + error.message });
    }
};

// Login admin
const loginAdmin = async (req, res) => {
    try {
        const { usuario, dni, contrasena } = req.body;

        const result = await db.query(
            'SELECT * FROM administradores WHERE usuario = $1 AND dni = $2',
            [usuario, dni]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        const admin = result.rows[0];
        const valido = await bcrypt.compare(contrasena, admin.contrasena);

        if (!valido) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        const codigo = Math.floor(100000 + Math.random() * 900000).toString();

        await db.query(
            "INSERT INTO codigos_verificacion (admin_id, codigo, expira_at) VALUES ($1, $2, NOW() + INTERVAL '10 minutes')",
            [admin.id, codigo]
        );
        
await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: admin.correo,
    subject: 'Código de verificación - Club Catarindo',
    html: `<h2>Tu código de verificación es: <strong>${codigo}</strong></h2>
        <p>Este código expira en 10 minutos.</p>`
});

        res.json({ mensaje: 'Código enviado al correo', adminId: admin.id });

    } catch (error) {
        console.error("❌ ERROR LOGIN ADMIN:", error.message);
        res.status(500).json({ error: 'Error en el servidor: ' + error.message });
    }
};

// Verificar código admin
const verificarCodigo = async (req, res) => {
    try {
        const { codigo, adminId } = req.body;

        const result = await db.query(
            "SELECT * FROM codigos_verificacion WHERE admin_id = $1 AND codigo = $2 AND usado = FALSE AND expira_at > NOW() ORDER BY created_at DESC LIMIT 1",
            [adminId, codigo]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Código inválido o expirado' });
        }

        await db.query('UPDATE codigos_verificacion SET usado = TRUE WHERE id = $1', [result.rows[0].id]);

        const adminResult = await db.query('SELECT * FROM administradores WHERE id = $1', [adminId]);
        const admin = adminResult.rows[0];

        const token = jwt.sign(
            { id: admin.id, correo: admin.correo, rol: 'admin' },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({ token, id: admin.id, nombre: admin.usuario, correo: admin.correo, rol: 'admin' });

    } catch (error) {
        console.error("❌ ERROR VERIFICAR CÓDIGO:", error.message);
        res.status(500).json({ error: 'Error en el servidor: ' + error.message });
    }
};

// Registro socio
const registrarSocio = async (req, res) => {
    try {
        const { nombre, apellido, dni, nroSocio, correo, contrasena } = req.body;

        const existe = await db.query(
            'SELECT id FROM socios WHERE correo = $1 OR dni = $2 OR nro_socio = $3',
            [correo, dni, nroSocio]
        );

        if (existe.rows.length > 0) {
            return res.status(400).json({ error: 'Ya existe un socio con ese correo, DNI o número de socio' });
        }

        const hash = await bcrypt.hash(contrasena, 10);

        await db.query(
            'INSERT INTO socios (nombre, apellido, dni, nro_socio, correo, contrasena) VALUES ($1, $2, $3, $4, $5, $6)',
            [nombre, apellido, dni, nroSocio, correo, hash]
        );

        res.json({ mensaje: 'Socio registrado correctamente' });

    } catch (error) {
        console.error("❌ ERROR REGISTRO:", error.message);
        res.status(500).json({ error: 'Error en el servidor: ' + error.message });
    }
};

// Solicitar recuperación de contraseña
const solicitarRecuperacion = async (req, res) => {
    try {
        const { correo } = req.body;

        const result = await db.query('SELECT id FROM socios WHERE correo = $1', [correo]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No existe una cuenta con ese correo' });
        }

        const socioId = result.rows[0].id;
        const codigo = Math.floor(100000 + Math.random() * 900000).toString();

        await db.query(
            "INSERT INTO codigos_recuperacion (socio_id, codigo, expira_at) VALUES ($1, $2, NOW() + INTERVAL '10 minutes')",
            [socioId, codigo]
        );

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        await transporter.sendMail({
            from: `"Club Catarindo" <${process.env.EMAIL_USER}>`,
            to: correo,
            subject: 'Recuperación de contraseña',
            text: `Tu código es: ${codigo}`
        });

        res.json({ mensaje: 'Código enviado al correo', socioId });

    } catch (error) {
        console.error("❌ ERROR RECUPERACIÓN:", error.message);
        res.status(500).json({ error: 'Error interno: ' + error.message });
    }
};

// Verificar código de recuperación
const verificarCodigoRecuperacion = async (req, res) => {
    try {
        const { codigo, socioId } = req.body;

        const result = await db.query(
            "SELECT * FROM codigos_recuperacion WHERE socio_id = $1 AND codigo = $2 AND usado = FALSE AND expira_at > NOW() ORDER BY created_at DESC LIMIT 1",
            [socioId, codigo]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Código inválido o expirado' });
        }

        res.json({ mensaje: 'Código válido', codigoId: result.rows[0].id });

    } catch (error) {
        console.error("❌ ERROR VERIFICAR RECUPERACIÓN:", error.message);
        res.status(500).json({ error: 'Error en el servidor: ' + error.message });
    }
};

// Cambiar contraseña
const cambiarContrasena = async (req, res) => {
    try {
        const { socioId, codigoId, nuevaContrasena } = req.body;

        const hash = await bcrypt.hash(nuevaContrasena, 10);

        await db.query('UPDATE socios SET contrasena = $1 WHERE id = $2', [hash, socioId]);
        await db.query('UPDATE codigos_recuperacion SET usado = TRUE WHERE id = $1', [codigoId]);

        res.json({ mensaje: 'Contraseña actualizada correctamente' });

    } catch (error) {
        console.error("❌ ERROR CAMBIAR CONTRASEÑA:", error.message);
        res.status(500).json({ error: 'Error en el servidor: ' + error.message });
    }
};

module.exports = {
    loginSocio,
    loginAdmin,
    verificarCodigo,
    registrarSocio,
    solicitarRecuperacion,
    verificarCodigoRecuperacion,
    cambiarContrasena
};