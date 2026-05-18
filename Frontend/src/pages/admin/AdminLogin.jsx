import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { loginAdmin, verificarCodigo } from '../../services/authService'
import { Eye, EyeOff, UserRoundKey } from 'lucide-react'
import './AdminLogin.css'

function AdminLogin() {
    const [paso, setPaso] = useState(1)
    const [verContrasena, setVerContrasena] = useState(false)
    const [error, setError] = useState('')
    const [cargando, setCargando] = useState(false)
    const [adminId, setAdminId] = useState(null)
    const [form, setForm] = useState({
        usuario: '',
        dni: '',
        contrasena: '',
        codigo: '',
    })

    const { login } = useAuth()
    const navigate = useNavigate()

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    const handlePaso1 = async (e) => {
        e.preventDefault()
        setError('')
        setCargando(true)
        const data = await loginAdmin(form.usuario, form.dni, form.contrasena)
        if (data.error) {
        setError(data.error)
        } else {
        setAdminId(data.adminId)
        setPaso(2)
        }
        setCargando(false)
    }

    const handlePaso2 = async (e) => {
    e.preventDefault()
    setError('')
    setCargando(true)
    const data = await verificarCodigo(form.codigo, adminId)
    if (data.error) {
        setError(data.error)
    } else {
        login({ ...data, rol: 'admin' })
        // CAMBIA ESTO:
        navigate('/panel-admin') 
    }
    setCargando(false)
}

    return (
        <div className="al-page">
        <div className="al-card">

            {/* Header */}
            <div className="al-header">
            <div className="al-icon-wrap">
                <UserRoundKey size={26} />
            </div>
            <h2 className="al-title">Acceso Administrador</h2>
            <p className="al-subtitle">Panel de gestión Club Catarindo</p>
            </div>

            {/* Steps */}
            <div className="al-steps">
            <div className={`al-step ${paso >= 1 ? 'activo' : ''}`}>1</div>
            <div className="al-step-line" />
            <div className={`al-step ${paso >= 2 ? 'activo' : ''}`}>2</div>
            </div>

            {/* Error */}
            {error && (
            <div className="al-error">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                <path d="M8 5v3.5M8 11h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                {error}
            </div>
            )}

            {/* Paso 1 */}
            {paso === 1 && (
            <form onSubmit={handlePaso1}>
                <div className="al-group">
                <label className="al-label">Usuario</label>
                <input
                    className="al-input"
                    type="text"
                    name="usuario"
                    placeholder="Nombre de usuario"
                    value={form.usuario}
                    onChange={handleChange}
                    required
                />
                </div>

                <div className="al-group">
                <label className="al-label">DNI</label>
                <input
                    className="al-input"
                    type="text"
                    name="dni"
                    placeholder="12345678"
                    maxLength={8}
                    value={form.dni}
                    onChange={(e) => {
                    const valor = e.target.value.replace(/\D/g, '')
                    setForm({ ...form, dni: valor })
                    }}
                    required
                />
                </div>

                <div className="al-group">
                <label className="al-label">Contraseña</label>
                <div className="al-input-wrap">
                    <input
                    className="al-input al-input--pass"
                    type={verContrasena ? 'text' : 'password'}
                    name="contrasena"
                    placeholder="••••••••"
                    value={form.contrasena}
                    onChange={handleChange}
                    required
                    />
                    <button
                    type="button"
                    className="al-eye"
                    onClick={() => setVerContrasena(!verContrasena)}
                    >
                    {verContrasena ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                </div>
                </div>

                <button className="al-submit" type="submit" disabled={cargando}>
                {cargando
                    ? <><span className="al-spinner" />Verificando...</>
                    : 'Continuar'}
                </button>
            </form>
            )}

            {/* Paso 2 */}
            {paso === 2 && (
            <form onSubmit={handlePaso2}>
                <p className="al-code-info">
                Se envió un código de verificación a tu correo registrado.
                </p>

                <div className="al-group">
                <label className="al-label">Código de verificación</label>
                <input
                    className="al-input"
                    type="text"
                    name="codigo"
                    placeholder="Ingresa el código"
                    value={form.codigo}
                    onChange={handleChange}
                    maxLength={6}
                    required
                />
                </div>

                <button className="al-submit" type="submit" disabled={cargando}>
                {cargando
                    ? <><span className="al-spinner" />Verificando...</>
                    : 'Verificar y Acceder'}
                </button>

                <button type="button" className="al-back" onClick={() => setPaso(1)}>
                ← Volver
                </button>
            </form>
            )}

            {/* Footer */}
            <div className="al-footer">
            <Link to="/login">← Volver al login de socios</Link>
            </div>

        </div>
        </div>
    )
}

export default AdminLogin