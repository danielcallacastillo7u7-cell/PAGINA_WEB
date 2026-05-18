import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, EyeClosed } from "lucide-react"
import './Register.css'

function Register() {
    const [verContrasena, setVerContrasena] = useState(false)
    const [verConfirmar, setVerConfirmar] = useState(false)

    const dominios = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'icloud.com']
    const [sugerencias, setSugerencias] = useState([])
    const [correo, setCorreo] = useState('')

    const [errores, setErrores] = useState({})

    const [form, setForm] = useState({
        nombre: '',
        apellido: '',
        dni: '',
        nroSocio: '',
        contrasena: '',
        confirmar: '',
    })

    // 🔹 función auxiliar
    const soloLetras = (texto) => /^[A-Za-zÁÉÍÓÚáéíóúñÑ\s]+$/.test(texto)

    // 🔹 VALIDACIÓN (la que me diste)
    const validarFormNuevo = (form) => {
        const errores = {}

        if (!form.nombre.trim()) errores.nombre = 'El nombre es obligatorio'
        else if (!soloLetras(form.nombre)) errores.nombre = 'Solo se permiten letras'
        else if (form.nombre.trim().length < 2) errores.nombre = 'Mínimo 2 caracteres'

        if (!form.apellido.trim()) errores.apellido = 'El apellido es obligatorio'
        else if (!soloLetras(form.apellido)) errores.apellido = 'Solo se permiten letras'
        else if (form.apellido.trim().length < 2) errores.apellido = 'Mínimo 2 caracteres'

        if (!form.dni.trim()) errores.dni = 'El DNI es obligatorio'
        else if (form.dni.length !== 8) errores.dni = 'El DNI debe tener 8 dígitos'

        if (!correo.trim()) errores.correo = 'El correo es obligatorio'
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) errores.correo = 'Formato de correo inválido'

        if (!form.contrasena) errores.contrasena = 'La contraseña es obligatoria'
        else if (form.contrasena.length < 6) errores.contrasena = 'Mínimo 6 caracteres'

        return errores
    }

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

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

    const handleSubmit = (e) => {
        e.preventDefault()

        const nuevosErrores = validarFormNuevo(form)
        setErrores(nuevosErrores)

        if (Object.keys(nuevosErrores).length > 0) return

        if (form.contrasena !== form.confirmar) {
            alert('Las contraseñas no coinciden')
            return
        }

        console.log('Registrando:', { ...form, correo })
    }

    return (
        <div>
            <div className="register-container">
                <div className="register-card">
                    <h2>Registro de Socio</h2>
                    <p className="register-subtitulo">Crea tu cuenta para acceder al club</p>

                    <form onSubmit={handleSubmit}>

                        {/* Nombre y Apellido */}
                        <div className="form-fila">
                            <div className="form-grupo">
                                <label>Nombre</label>
                                <input
                                    type="text"
                                    name="nombre"
                                    value={form.nombre}
                                    onChange={handleChange}
                                />
                                {errores.nombre && <span className="error">{errores.nombre}</span>}
                            </div>

                            <div className="form-grupo">
                                <label>Apellido</label>
                                <input
                                    type="text"
                                    name="apellido"
                                    value={form.apellido}
                                    onChange={handleChange}
                                />
                                {errores.apellido && <span className="error">{errores.apellido}</span>}
                            </div>
                        </div>

                        {/* DNI */}
                        <div className="form-grupo">
                            <label>DNI</label>
                            <input
                                type="text"
                                name="dni"
                                maxLength={8}
                                value={form.dni}
                                onChange={(e) => {
                                    const valor = e.target.value.replace(/\D/g, '')
                                    setForm({ ...form, dni: valor })
                                }}
                            />
                            {errores.dni && <span className="error">{errores.dni}</span>}
                        </div>

                        {/* Correo */}
                        <div className="form-grupo">
                            <label>Correo electrónico</label>
                            <input
                                type="email"
                                value={correo}
                                onChange={handleCorreo}
                            />
                            {errores.correo && <span className="error">{errores.correo}</span>}

                            {sugerencias.length > 0 && (
                                <ul className="sugerencias">
                                    {sugerencias.map((s, i) => (
                                        <li key={i} onClick={() => elegirSugerencia(s)}>{s}</li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {/* Contraseña */}
                        <div className="form-grupo">
                            <label>Contraseña</label>
                            <div className="input-contrasena">
                                <input
                                    type={verContrasena ? 'text' : 'password'}
                                    name="contrasena"
                                    value={form.contrasena}
                                    onChange={handleChange}
                                />
                                <button type="button" onClick={() => setVerContrasena(!verContrasena)}>
                                    {verContrasena ? <EyeClosed size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {errores.contrasena && <span className="error">{errores.contrasena}</span>}
                        </div>

                        {/* Confirmar */}
                        <div className="form-grupo">
                            <label>Confirmar contraseña</label>
                            <div className="input-contrasena">
                                <input
                                    type={verConfirmar ? 'text' : 'password'}
                                    name="confirmar"
                                    value={form.confirmar}
                                    onChange={handleChange}
                                />
                                <button type="button" onClick={() => setVerConfirmar(!verConfirmar)}>
                                    {verConfirmar ? <EyeClosed size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button type="submit" className="btn-submit">Crear Cuenta</button>
                    </form>

                    <div className="register-login">
                        <span>¿Ya tienes cuenta? <Link to="/login">Inicia Sesión</Link></span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Register