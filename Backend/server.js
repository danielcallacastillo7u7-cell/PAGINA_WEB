require('dotenv').config()
const express = require('express')
const cors = require('cors')


const app = express()

// Middlewares
app.use(cors({
    origin: ['http://localhost:5173'],
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use('/uploads', require('express').static('uploads'))

// Rutas
app.use('/api/auth', require('./routes/authRoutes'))
app.use('/api/socio', require('./routes/socioRoutes'))
app.use('/api/admin', require('./routes/adminRoutes'))
app.use('/api/pagos', require('./routes/pagoRoutes'))
app.use('/api/contacto', require('./routes/contactoRouter'));
app.use('/api/comunidad', require('./routes/comunidadRoutes'));

// Ruta de prueba
app.get('/', (req, res) => {
    res.json({ mensaje: 'Servidor Club Catarindo funcionando ✅' })
})

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor CATARINDO activo en puerto ${PORT}`);
});