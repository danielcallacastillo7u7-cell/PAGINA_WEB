import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { loginSocio } from '../../services/authService'
import { Eye, EyeOff } from 'lucide-react'
import './Login.css'




function Login() {
    const [correo, setCorreo] = useState('')
    const [contrasena, setContrasena] = useState('')
    const [verContrasena, setVerContrasena] = useState(false)
    const [error, setError] = useState('')
    const [cargando, setCargando] = useState(false)
    const [sugerencias, setSugerencias] = useState([])

    const dominios = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'icloud.com']
    const { login } = useAuth()
    const navigate = useNavigate()

    const handleCorreo = (e) => {
        const valor = e.target.value
        setCorreo(valor)
        if (valor.includes('@')) {
        const partes = valor.split('@')
        const texto = partes[1] || ''
        const filtradas = dominios
            .filter(d => d.startsWith(texto) && d !== texto)
            .map(d => partes[0] + '@' + d)
        setSugerencias(filtradas)
        } else {
        setSugerencias([])
        }
    }

    const elegirSugerencia = (s) => {
        setCorreo(s)
        setSugerencias([])
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setCargando(true)
        const data = await loginSocio(correo, contrasena)
        if (data.error) {
        setError(data.error)
        } else {
        login({ ...data, rol: 'socio' })
        navigate('/dashboard')
        }
        setCargando(false)
    }

    return (
        <div className="lc-page">
            <div className="lc-card">
                <div className="lc-badge">
                    <span className="lc-badge-dot" />
                    Área de socios
                </div>

                <h2 className="lc-title">Bienvenido</h2>
                <p className="lc-subtitle">Accede a tu cuenta para continuar</p>

                {error && (
                    <div className="lc-error">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
                            <path d="M8 5v3.5M8 11h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {/* Email */}
                    <div className="lc-group">
                        <label className="lc-label">Correo electrónico</label>
                        <div className="lc-input-wrap">
                            <input
                                className="lc-input"
                                type="email"
                                placeholder="tucorreo@email.com"
                                value={correo}
                                onChange={handleCorreo}
                                autoComplete="email"
                                required
                            />
                        </div>
                        {sugerencias.length > 0 && (
                            <ul className="lc-suggestions">
                                {sugerencias.map((s, i) => (
                                    <li key={i} onClick={() => elegirSugerencia(s)}>{s}</li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Contraseña */}
                    <div className="lc-group">
                        <label className="lc-label">Contraseña</label>
                        <div className="lc-input-wrap">
                            <input
                                className="lc-input lc-input--pass"
                                type={verContrasena ? 'text' : 'password'}
                                placeholder="••••••••"
                                value={contrasena}
                                onChange={(e) => setContrasena(e.target.value)}
                                autoComplete="current-password"
                                required
                            />
                            <button
                                type="button"
                                className="lc-eye"
                                onClick={() => setVerContrasena(!verContrasena)}
                            >
                                {verContrasena ? <EyeOff size={17} /> : <Eye size={17} />}
                            </button>
                        </div>
                    </div>

                    <button className="lc-submit" type="submit" disabled={cargando}>
                        {cargando
                            ? <><span className="lc-spinner" />Ingresando...</>
                            : 'Iniciar Sesión'
                        }
                    </button>
                </form>
                <div className="lc-footer">
    <div className="lc-links-row" style={{ justifyContent: 'center' }}>
        <Link to="/recuperar" className="lc-link">¿Olvidaste tu contraseña?</Link>
    </div>
    
    <div className="lc-admin">
        <span className="lc-divider" />
        {/* Usamos un botón de tipo "button" para que NO intente enviar el formulario de login de socios */}
        <button 
            type="button" 
            onClick={() => navigate('/admin-login')} 
            className="lc-link" 
            style={{ 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer', 
                fontSize: '12px',
                padding: '0 10px' 
            }}
        >
            Acceso Administrador →
        </button>
        <span className="lc-divider" />
    </div>
</div>
            </div>
        </div>
    )
}

export default Login