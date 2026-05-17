const db = require('../config/db');

const getPerfil = async (req, res) => {
    try {
        const result = await db.query(
            'SELECT id, nombre, apellido, dni, nro_socio, correo, estado FROM socios WHERE id = $1',
            [req.usuario.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Socio no encontrado' });
        res.json(result.rows[0]);
    } catch (error) {
        console.error("❌ ERROR getPerfil:", error.message);
        res.status(500).json({ error: 'Error en el servidor: ' + error.message });
    }
};

const getCuenta = async (req, res) => {
    try {
        const mes = new Date().getMonth() + 1;
        const anio = new Date().getFullYear();

        const consumos = await db.query(
            'SELECT SUM(monto) as total FROM consumos WHERE socio_id = $1 AND EXTRACT(MONTH FROM fecha) = $2 AND EXTRACT(YEAR FROM fecha) = $3',
            [req.usuario.id, mes, anio]
        );

        const pagos = await db.query(
            "SELECT SUM(monto) as total FROM pagos WHERE socio_id = $1 AND EXTRACT(MONTH FROM fecha) = $2 AND EXTRACT(YEAR FROM fecha) = $3 AND estado = 'Confirmado'",
            [req.usuario.id, mes, anio]
        );

        const cargos = await db.query('SELECT SUM(monto) as total FROM cargos_fijos WHERE activo = TRUE');

        const consumosMes = parseFloat(consumos.rows[0].total) || 0;
        const pagosRealizados = parseFloat(pagos.rows[0].total) || 0;
        const cargosFijos = parseFloat(cargos.rows[0].total) || 0;
        const totalPagar = consumosMes + cargosFijos;
        const saldoPendiente = totalPagar - pagosRealizados;

        res.json({
            mes: new Date().toLocaleString('es-PE', { month: 'long', year: 'numeric' }),
            consumosMes,
            cargosFijos,
            totalPagar,
            pagosRealizados,
            saldoPendiente
        });
    } catch (error) {
        console.error("❌ ERROR getCuenta:", error.message);
        res.status(500).json({ error: 'Error en el servidor: ' + error.message });
    }
};

const getConsumos = async (req, res) => {
    try {
        const mes = new Date().getMonth() + 1;
        const anio = new Date().getFullYear();

        const result = await db.query(
            'SELECT * FROM consumos WHERE socio_id = $1 AND EXTRACT(MONTH FROM fecha) = $2 AND EXTRACT(YEAR FROM fecha) = $3 ORDER BY fecha DESC',
            [req.usuario.id, mes, anio]
        );
        res.json(result.rows);
    } catch (error) {
        console.error("❌ ERROR getConsumos:", error.message);
        res.status(500).json({ error: 'Error en el servidor: ' + error.message });
    }
};

const getPagos = async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM pagos WHERE socio_id = $1 ORDER BY fecha DESC',
            [req.usuario.id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error("❌ ERROR getPagos:", error.message);
        res.status(500).json({ error: 'Error en el servidor: ' + error.message });
    }
};

const enviarPago = async (req, res) => {
    try {
        const { monto, metodo } = req.body;
        const fecha = new Date().toISOString().split('T')[0];

        await db.query(
            'INSERT INTO pagos (socio_id, monto, metodo, fecha) VALUES ($1, $2, $3, $4)',
            [req.usuario.id, monto, metodo, fecha]
        );

        res.json({ mensaje: 'Pago registrado, esperando confirmación del administrador' });
    } catch (error) {
        console.error("❌ ERROR enviarPago:", error.message);
        res.status(500).json({ error: 'Error en el servidor: ' + error.message });
    }
};

module.exports = { getPerfil, getCuenta, getConsumos, getPagos, enviarPago };