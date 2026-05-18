import { useState } from 'react'
import './RecuperarContrasena.css'
import { Link } from 'react-router-dom'
import {  KeyRound , Eye, EyeOff , Check } from 'lucide-react'

const API = 'http://localhost:3000/api'

function RecuperarContrasena() {
    const [paso, setPaso] = useState(1)
    const [correo, setCorreo] = useState('')
    const [codigo, setCodigo] = useState('')
    const [nuevaContrasena, setNuevaContrasena] = useState('')
    const [confirmar, setConfirmar] = useState('')
    const [verContrasena, setVerContrasena] = useState(false)
    const [verConfirmar, setVerConfirmar] = useState(false)
    const [error, setError] = useState('')
    const [cargando, setCargando] = useState(false)
    const [socioId, setSocioId] = useState(null)
    const [codigoId, setCodigoId] = useState(null)

    // Lista de dominios para el autocompletado
    const dominiosSugeridos = ['gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'icloud.com'];

    const handlePaso1 = async (e) => {
        e.preventDefault()
        setError('')
        setCargando(true)

        const res = await fetch(`${API}/auth/recuperar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ correo })
        })
        const data = await res.json()

        if (data.error) {
            setError(data.error)
        } else {
            setSocioId(data.socioId)
            setPaso(2)
        }
        setCargando(false)
    }

    const handlePaso2 = async (e) => {
        e.preventDefault()
        setError('')
        setCargando(true)

        const res = await fetch(`${API}/auth/recuperar/verificar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ codigo, socioId })
        })
        const data = await res.json()

        if (data.error) {
            setError(data.error)
        } else {
            setCodigoId(data.codigoId)
            setPaso(3)
        }
        setCargando(false)
    }

    const handlePaso3 = async (e) => {
        e.preventDefault()
        setError('')

        if (nuevaContrasena !== confirmar) {
            setError('Las contraseñas no coinciden')
            return
        }

        if (nuevaContrasena.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres')
            return
        }

        setCargando(true)

        const res = await fetch(`${API}/auth/recuperar/cambiar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ socioId, codigoId, nuevaContrasena })
        })
        const data = await res.json()

        if (data.error) {
            setError(data.error)
        } else {
            setPaso(4)
        }
        setCargando(false)
    }

    return (
        <div>
            <div className="recuperar-container">
                <div className="recuperar-card">

                    <div className="recuperar-header">
                        <span><KeyRound size={40}/></span>
                        <h2>Recuperar Contraseña</h2>
                    </div>

                    <div className="pasos">
                        <div className={`paso ${paso >= 1 ? 'activo' : ''}`}>1</div>
                        <div className="paso-linea"></div>
                        <div className={`paso ${paso >= 2 ? 'activo' : ''}`}>2</div>
                        <div className="paso-linea"></div>
                        <div className={`paso ${paso >= 3 ? 'activo' : ''}`}>3</div>
                    </div>

                    {error && <div className="recuperar-error">{error}</div>}

                    {/* Paso 1 — Correo con Datalist */}
                    {paso === 1 && (
                        <form onSubmit={handlePaso1}>
                            <p className="recuperar-info">
                                Ingresa tu correo y te enviaremos un código de verificación.
                            </p>
                            <div className="form-grupo">
                                <label>Correo electrónico</label>
                                <input
                                    type="email"
                                    placeholder="tucorreo@gmail.com"
                                    value={correo}
                                    onChange={(e) => setCorreo(e.target.value)}
                                    required
                                    list="emails-list"
                                />
                                <datalist id="emails-list">
                                    {dominiosSugeridos.map(dom => (
                                        <option 
                                            key={dom} 
                                            value={correo.includes('@') ? `${correo.split('@')[0]}@${dom}` : `${correo}@${dom}`} 
                                        />
                                    ))}
                                </datalist>
                            </div>
                            <button type="submit" className="btn-submit" disabled={cargando}>
                                {cargando ? 'Enviando...' : 'Enviar código'}
                            </button>
                        </form>
                    )}

                    {paso === 2 && (
                        <form onSubmit={handlePaso2}>
                            <p className="recuperar-info">
                                Ingresa el código de 6 dígitos que enviamos a <strong>{correo}</strong>
                            </p>
                            <div className="form-grupo">
                                <label>Código de verificación</label>
                                <input
                                    type="text"
                                    placeholder="123456"
                                    value={codigo}
                                    onChange={(e) => setCodigo(e.target.value)}
                                    maxLength={6}
                                    required
                                />
                            </div>
                            <button type="submit" className="btn-submit" disabled={cargando}>
                                {cargando ? 'Verificando...' : 'Verificar código'}
                            </button>
                            <button type="button" className="btn-volver" onClick={() => setPaso(1)}>
                                ← Volver
                            </button>
                        </form>
                    )}

                    {paso === 3 && (
                        <form onSubmit={handlePaso3}>
                            <p className="recuperar-info">
                                Ingresa tu nueva contraseña.
                            </p>
                            <div className="form-grupo">
                                <label>Nueva contraseña</label>
                                <div className="input-contrasena">
                                    <input
                                        type={verContrasena ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        value={nuevaContrasena}
                                        onChange={(e) => setNuevaContrasena(e.target.value)}
                                        required
                                    />
                                    <button type="button" className="ojo-btn" onClick={() => setVerContrasena(!verContrasena)}>
                                        {verContrasena ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>
                            <div className="form-grupo">
                                <label>Confirmar contraseña</label>
                                <div className="input-contrasena">
                                    <input
                                        type={verConfirmar ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        value={confirmar}
                                        onChange={(e) => setConfirmar(e.target.value)}
                                        required
                                    />
                                    <button type="button" className="ojo-btn" onClick={() => setVerConfirmar(!verConfirmar)}>
                                        {verConfirmar ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>
                            <button type="submit" className="btn-submit" disabled={cargando}>
                                {cargando ? 'Guardando...' : 'Cambiar contraseña'}
                            </button>
                        </form>
                    )}

                    {paso === 4 && (
                        <div className="recuperar-exito">
                            <span><Check size={80}/></span>
                            <h3>¡Contraseña actualizada!</h3>
                            <p>Tu contraseña fue cambiada correctamente.</p>
                            <Link to="/login" className="btn-submit">Ir al Login</Link>
                        </div>
                    )}

                    {paso < 4 && (
                        <div className="recuperar-footer">
                            <Link to="/login">← Volver al login</Link>
                        </div>
                    )}

                </div>
            </div>
        </div>
    )
}

export default RecuperarContrasena;