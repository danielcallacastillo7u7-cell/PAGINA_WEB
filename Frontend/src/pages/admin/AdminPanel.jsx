import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
    getSocios, crearSocio, editarSocio, eliminarSocio,
    getFinanzas, getMorosos, getSolicitudesPago,
    confirmarSolicitud, rechazarSolicitud
} from '../../services/adminService'
import './AdminPanel.css'
import {
    ShieldCog, Users, Landmark, BookAlert, CreditCard,
    FileChartPie, DoorClosed, SquarePen, Trash, FileText,
    ChartNoAxesCombined, Network, Sheet,
    Eye, EyeOff, CheckCircle2, XCircle, AlertCircle, Home,
    ChevronUp, ChevronDown, ChevronsUpDown, Moon, Sun, View} from 'lucide-react'
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const DOMINIOS_EMAIL = [
    'gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com',
    'icloud.com', 'live.com', 'msn.com', 'protonmail.com'
]

const soloLetras = (valor) =>
    /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]*$/.test(valor)

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

    if (!form.correo.trim()) errores.correo = 'El correo es obligatorio'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo)) errores.correo = 'Formato de correo inválido'

    if (!form.contrasena) errores.contrasena = 'La contraseña es obligatoria'
    else if (form.contrasena.length < 6) errores.contrasena = 'Mínimo 6 caracteres'

    return errores}
function useToast() {
const [toasts, setToasts] = useState([])
    const addToast = useCallback((message, type = 'info') => {
        const id = Date.now() + Math.random()
        setToasts(prev => [...prev, { id, message, type }])
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id))
        }, 3800)
    }, [])
const toast = {
        success: (msg) => addToast(msg, 'success'),
        error:   (msg) => addToast(msg, 'error'),
        info:    (msg) => addToast(msg, 'info'),
        warning: (msg) => addToast(msg, 'warning'),
    }
    return { toasts, toast }}
function ToastContainer({ toasts }) {
    if (!toasts.length) return null
    return (
        <div className="toast-container">
            {toasts.map(t => (
                <div key={t.id} className={`toast toast-${t.type}`}>
                    {t.type === 'success' && <CheckCircle2 size={16} />}
                    {t.type === 'error'   && <XCircle size={16} />}
                    {t.type === 'warning' && <AlertCircle size={16} />}
                    {t.type === 'info'    && <AlertCircle size={16} />}
                    <span>{t.message}</span>
                </div>
            ))}
        </div>
    )
}

function ModalConfirmacion({ config, onConfirmar, onCancelar }) {
    if (!config) return null
    return (
        <div className="modal-confirm-overlay" onClick={onCancelar}>
            <div className="modal-confirm" onClick={e => e.stopPropagation()}>
                <div className={`modal-confirm-icono modal-confirm-icono--${config.tipo || 'danger'}`}>
                    {config.tipo === 'warning' ? <AlertCircle size={28} /> : <Trash size={28} />}
                </div>
                <h3 className="modal-confirm-titulo">{config.titulo || '¿Estás seguro?'}</h3>
                <p className="modal-confirm-mensaje">{config.mensaje}</p>
                <div className="modal-confirm-botones">
                    <button className="modal-confirm-btn-cancelar" onClick={onCancelar}>Cancelar</button>
                    <button
                        className={`modal-confirm-btn-ok modal-confirm-btn-ok--${config.tipo || 'danger'}`}
                        onClick={onConfirmar}
                    >
                        {config.labelOk || 'Confirmar'}
                    </button>
                </div>
            </div>
        </div>
    )}
function useConfirm() {
    const [config, setConfig] = useState(null)
    const resolverRef = useRef(null)
    const confirmar = useCallback((opciones) => {
        return new Promise((resolve) => {
            resolverRef.current = resolve
            setConfig(opciones)
        })
    }, [])
const handleConfirmar = () => { resolverRef.current(true);  setConfig(null) }
const handleCancelar  = () => { resolverRef.current(false); setConfig(null) }
    const ModalConfirm = (
        <ModalConfirmacion
            config={config}
            onConfirmar={handleConfirmar}
            onCancelar={handleCancelar}
        />
    )
    return { confirmar, ModalConfirm }}
function SkeletonTabla({ columnas = 5, filas = 6 }) {
    return (
        <table className="tabla">
            <thead>
                <tr>{Array.from({ length: columnas }).map((_, i) => (
                    <th key={i}><div className="skeleton skeleton-th" /></th>
                ))}</tr>
            </thead>
            <tbody>
                {Array.from({ length: filas }).map((_, r) => (
                    <tr key={r}>{Array.from({ length: columnas }).map((_, c) => (
                        <td key={c}><div className="skeleton skeleton-td" /></td>
                    ))}</tr>
                ))}
            </tbody>
        </table>
    )}
function SkeletonCards({ cantidad = 4 }) {
    return (
        <div className="admin-cards">
            {Array.from({ length: cantidad }).map((_, i) => (
                <div key={i} className="admin-card skeleton-card">
                    <div className="skeleton skeleton-card-label" />
                    <div className="skeleton skeleton-card-valor" />
                </div>
            ))}
        </div>
    )}
function CampoFeedback({ error, touched, valor }) {
    if (!touched) return null
    if (error) return (
        <span className="campo-feedback campo-error">
            <XCircle size={13} /> {error}
        </span>
    )
    if (valor) return (
        <span className="campo-feedback campo-ok">
            <CheckCircle2 size={13} /> Correcto
        </span>
    )
    return null}
function BarraFortaleza({ password }) {
    if (!password) return null
    const len = password.length
    const nivel = len < 6 ? 0 : len < 8 ? 1 : len < 12 ? 2 : 3
    const colores = ['#e53e3e', '#ed8936', '#ecc94b', '#38a169']
    const etiquetas = ['Muy corta', 'Débil', 'Aceptable', 'Fuerte']
    return (
        <div className="barra-fortaleza-wrap">
            <div className="barra-fortaleza-bg">
                <div
                    className="barra-fortaleza-fill"
                    style={{ width: nivel === 0 ? '10%' : `${(nivel / 3) * 100}%`, background: colores[nivel] }}
                />
            </div>
            <span className="barra-fortaleza-label" style={{ color: colores[nivel] }}>
                {etiquetas[nivel]}
            </span>
        </div>
    )}
function FormNuevoSocio({ onCrear, onCancelar }) {
    const [form, setForm] = useState({
        nombre: '', apellido: '', dni: '', correo: '',
        contrasena: '', estado: 'Activo', nombreFamilia: ''
    })
    const [tocados, setTocados]                       = useState({})
    const [verContrasena, setVerContrasena]           = useState(false)
    const [sugerencias, setSugerencias]               = useState([])
    const [mostrarSugerencias, setMostrarSugerencias] = useState(false)
    const [enviado, setEnviado]                       = useState(false)

    const correoRef      = useRef(null)
    const sugerenciasRef = useRef(null)
    const errores        = validarFormNuevo(form)
    const formularioValido = Object.keys(errores).length === 0

    useEffect(() => {
        const handler = (e) => {
            if (
                sugerenciasRef.current && !sugerenciasRef.current.contains(e.target) &&
                correoRef.current && !correoRef.current.contains(e.target)
            ) setMostrarSugerencias(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const handleChange = (e) => {
        const { name, value } = e.target
        if ((name === 'nombre' || name === 'apellido') && value && !soloLetras(value)) return
        if (name === 'dni') {
            setForm(f => ({ ...f, dni: value.replace(/\D/g, '').slice(0, 8) }))
            setTocados(t => ({ ...t, dni: true }))
            return
        }
        if (name === 'correo') {
            setForm(f => ({ ...f, correo: value }))
            setTocados(t => ({ ...t, correo: true }))
            const arroba = value.indexOf('@')
            if (arroba !== -1) {
                const despues = value.slice(arroba + 1)
                const filtradas = DOMINIOS_EMAIL.filter(d => d.startsWith(despues) && d !== despues)
                setSugerencias(filtradas.map(d => value.slice(0, arroba + 1) + d))
                setMostrarSugerencias(filtradas.length > 0)
            } else {
                setMostrarSugerencias(false)
            }
            return
        }
        setForm(f => ({ ...f, [name]: value }))
    }

    const handleBlur  = (e) => setTocados(t => ({ ...t, [e.target.name]: true }))
    const handleSugerencia = (s) => {
        setForm(f => ({ ...f, correo: s }))
        setMostrarSugerencias(false)
        setTocados(t => ({ ...t, correo: true }))
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        setEnviado(true)
        setTocados({ nombre: true, apellido: true, dni: true, correo: true, contrasena: true })
        if (!formularioValido) return
        onCrear(form)
    }

    const hayError = (campo) => tocados[campo] && errores[campo]
    const estaOk   = (campo) => tocados[campo] && !errores[campo] && form[campo]

    return (
        <div className="fns-overlay">
            <div className="fns-modal">
                <h3 className="fns-titulo">➕ Nuevo Socio</h3>
                <p className="fns-subtitulo">Completá todos los campos obligatorios para registrar al socio.</p>
            {enviado && !formularioValido && (
                    <div className="fns-alerta-global">
                        <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                        <span>Hay campos con errores o incompletos. Revisá los campos marcados antes de continuar.</span>
                    </div>
                )}
            <form onSubmit={handleSubmit} noValidate>
                    <div className="fns-fila">
                        <div className="fns-grupo">
                            <label className="fns-label">Nombre</label>
                            <input
                                className={`fns-input ${hayError('nombre') ? 'input-error' : ''} ${estaOk('nombre') ? 'input-ok' : ''}`}
                                type="text" name="nombre" value={form.nombre}
                                onChange={handleChange} onBlur={handleBlur}
                                placeholder="Ej: Juan" autoComplete="off"
                            />
                            <CampoFeedback error={errores.nombre} touched={tocados.nombre} valor={form.nombre} />
                        </div>
                        <div className="fns-grupo">
                            <label className="fns-label">Apellido</label>
                            <input
                                className={`fns-input ${hayError('apellido') ? 'input-error' : ''} ${estaOk('apellido') ? 'input-ok' : ''}`}
                                type="text" name="apellido" value={form.apellido}
                                onChange={handleChange} onBlur={handleBlur}
                                placeholder="Ej: Pérez" autoComplete="off"
                            />
                            <CampoFeedback error={errores.apellido} touched={tocados.apellido} valor={form.apellido} />
                        </div>
                    </div>
                <div className="fns-fila">
                        <div className="fns-grupo">
                            <label className="fns-label">DNI</label>
                            <input
                                className={`fns-input ${hayError('dni') ? 'input-error' : ''} ${estaOk('dni') ? 'input-ok' : ''}`}
                                type="text" name="dni" value={form.dni}
                                onChange={handleChange} onBlur={handleBlur}
                                placeholder="8 dígitos" maxLength={8} inputMode="numeric"
                            />
                            <CampoFeedback error={errores.dni} touched={tocados.dni} valor={form.dni} />
                        </div>
                        <div className="fns-grupo">
                            <label className="fns-label">N° Socio</label>
                            <input className="fns-input fns-input-disabled" type="text" value="Se asignará automáticamente" disabled />
                        </div>
                    </div>
                <div className="fns-grupo fns-grupo-full" style={{ position: 'relative' }}>
                        <label className="fns-label">Correo electrónico</label>
                        <input
                            ref={correoRef}
                            className={`fns-input ${hayError('correo') ? 'input-error' : ''} ${estaOk('correo') ? 'input-ok' : ''}`}
                            type="email" name="correo" value={form.correo}
                            onChange={handleChange} onBlur={handleBlur}
                            placeholder="ejemplo@gmail.com" autoComplete="off"
                        />
                        <CampoFeedback error={errores.correo} touched={tocados.correo} valor={form.correo} />
                        {mostrarSugerencias && (
                            <div className="fns-sugerencias" ref={sugerenciasRef}>
                                {sugerencias.map(s => {
                                    const at = s.indexOf('@')
                                    return (
                                        <div key={s} className="fns-sugerencia" onMouseDown={() => handleSugerencia(s)}>
                                            {s.slice(0, at)}<span className="fns-at">@{s.slice(at + 1)}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                <div className="fns-grupo fns-grupo-full">
                        <label className="fns-label">Contraseña</label>
                        <div className="fns-input-wrap">
                            <input
                                className={`fns-input ${hayError('contrasena') ? 'input-error' : ''} ${estaOk('contrasena') ? 'input-ok' : ''}`}
                                type={verContrasena ? 'text' : 'password'}
                                name="contrasena" value={form.contrasena}
                                onChange={handleChange} onBlur={handleBlur}
                                placeholder="Mínimo 6 caracteres"
                                style={{ paddingRight: 44 }}
                            />
                            <button type="button" className="fns-ojo" onClick={() => setVerContrasena(v => !v)} tabIndex={-1}>
                                {verContrasena ? <EyeOff size={17} /> : <Eye size={17} />}
                            </button>
                        </div>
                        <CampoFeedback error={errores.contrasena} touched={tocados.contrasena} valor={form.contrasena} />
                        <BarraFortaleza password={form.contrasena} />
                    </div>
                <hr className="fns-divider" />
                <div className="fns-opcional-titulo"><Home size={13} /> Datos opcionales</div>
                    <div className="fns-grupo fns-grupo-full">
                        <label className="fns-label">
                            Nombre de familia / Casa
                            <span className="fns-opcional-tag">(opcional)</span>
                        </label>
                        <input
                            className="fns-input"
                            type="text" name="nombreFamilia" value={form.nombreFamilia}
                            onChange={handleChange}
                            placeholder="Ej: Familia García, Casa Los Pinos..."
                        />
                    </div>
                <div className="fns-botones">
                        <button type="submit" className="fns-btn-crear">Crear Socio</button>
                        <button type="button" className="fns-btn-cancelar" onClick={onCancelar}>Cancelar</button>
                    </div>
                </form>
            </div>
        </div>
    )}
function FormEditarSocio({ socio, onEditar, onCancelar }) {
    const [form, setForm] = useState({
        nombre: socio.nombre, apellido: socio.apellido,
        dni: socio.dni, correo: socio.correo, estado: socio.estado
    })
const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    const handleSubmit = (e) => { e.preventDefault(); onEditar(form) }

    return (
        <form className="admin-form" onSubmit={handleSubmit}>
            <h3>Editar Socio</h3>
            <div className="form-fila">
                <div className="form-grupo">
                    <label>Nombre</label>
                    <input type="text" name="nombre" value={form.nombre} onChange={handleChange} required />
                </div>
                <div className="form-grupo">
                    <label>Apellido</label>
                    <input type="text" name="apellido" value={form.apellido} onChange={handleChange} required />
                </div>
            </div>
            <div className="form-fila">
                <div className="form-grupo">
                    <label>DNI</label>
                    <input
                        type="text" name="dni" value={form.dni}
                        onChange={(e) => setForm(f => ({ ...f, dni: e.target.value.replace(/\D/g, '').slice(0, 8) }))}
                        required maxLength={8}
                    />
                </div>
                <div className="form-grupo">
                    <label>N° Socio</label>
                    <input type="text" value={socio.nro_socio} disabled style={{ opacity: 0.5, cursor: 'not-allowed' }} />
                </div>
            </div>
            <div className="form-grupo">
                <label>Correo</label>
                <input type="email" name="correo" value={form.correo} onChange={handleChange} required />
            </div>
            <div className="form-grupo">
                <label>Estado</label>
                <select name="estado" value={form.estado} onChange={handleChange}>
                    <option>Activo</option>
                    <option>Suspendido</option>
                </select>
            </div>
            <div className="form-botones">
                <button type="submit" className="btn-nuevo">Guardar cambios</button>
                <button type="button" className="btn-cancelar" onClick={onCancelar}>Cancelar</button>
            </div>
        </form>
    )}
function useOrdenTabla(datos, columnaInicial = null) {
    const [orden, setOrden] = useState({ columna: columnaInicial, dir: 'asc' })
const toggleOrden = (columna) => {
        setOrden(prev =>
            prev.columna === columna
                ? { columna, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
                : { columna, dir: 'asc' }
        )
    }
const datoOrdenados = [...datos].sort((a, b) => {
        if (!orden.columna) return 0
        const valA = a[orden.columna] ?? ''
        const valB = b[orden.columna] ?? ''
        const cmp = typeof valA === 'number'
            ? valA - valB
            : String(valA).localeCompare(String(valB), 'es')
        return orden.dir === 'asc' ? cmp : -cmp
    })
const IconoOrden = ({ columna }) => {
        if (orden.columna !== columna) return <ChevronsUpDown size={13} className="sort-icon sort-icon--neutral" />
        return orden.dir === 'asc'
            ? <ChevronUp size={13} className="sort-icon sort-icon--active" />
            : <ChevronDown size={13} className="sort-icon sort-icon--active" />
    }
return { datoOrdenados, orden, toggleOrden, IconoOrden }
}

// ─── Componente principal ─────────────────────────────────────
function AdminPanel() {
    const [seccion,          setSeccion]          = useState('socios')
    const [socios,           setSocios]           = useState([])
    const [finanzas,         setFinanzas]         = useState(null)
    const [morosos,          setMorosos]          = useState([])
    const [pagos,            setPagos]            = useState([])
    const [solicitudes,      setSolicitudes]      = useState([])
    const [busqueda,         setBusqueda]         = useState('')
    const [cargando,         setCargando]         = useState(true)
    const [mostrarFormNuevo, setMostrarFormNuevo] = useState(false)
    const [socioEditando,    setSocioEditando]    = useState(null)
    const [pendientesCount,  setPendientesCount]  = useState(0)
    const [tema,             setTema]             = useState('light')

    const { usuario, logout } = useAuth()
    const navigate = useNavigate()
    const { toasts, toast } = useToast()
    const { confirmar, ModalConfirm } = useConfirm()

    const toggleTema = () => setTema(t => t === 'light' ? 'dark' : 'light')

    const sociosFiltrados = socios.filter(s =>
        s.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        s.apellido.toLowerCase().includes(busqueda.toLowerCase()) ||
        s.dni.includes(busqueda) ||
        s.nro_socio.includes(busqueda)
    )

    const { datoOrdenados: sociosOrdenados, toggleOrden: toggleOrdenSocios, IconoOrden: IconoOrdenSocios }
        = useOrdenTabla(sociosFiltrados, 'nro_socio')

    // ✅ FIX: cargarDatos con useCallback para evitar recreación infinita
    const cargarDatos = useCallback(async () => {
        setCargando(true)
        if (seccion === 'socios') {
            const data = await getSocios(usuario.token)
            if (!data.error) setSocios(data)
        }
        if (seccion === 'finanzas') {
            const data = await getFinanzas(usuario.token)
            if (!data.error) { setFinanzas(data); setPagos(data.movimientos || []) }
        }
        if (seccion === 'morosidad') {
            const data = await getMorosos(usuario.token)
            if (!data.error) setMorosos(data)
        }
        if (seccion === 'pagos') {
            const data = await getSolicitudesPago(usuario.token)
            if (!data.error) {
                setSolicitudes(data)
                setPendientesCount(data.filter(s => s.estado === 'Pendiente').length)
            }
        }
        setCargando(false)
    }, [seccion, usuario.token])

    // ✅ FIX: useEffect que llama cargarDatos cuando cambia la sección
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        cargarDatos()
    }, [cargarDatos])

    // ✅ FIX: useEffect separado para pendientes
    useEffect(() => {
        const cargarPendientes = async () => {
            const data = await getSolicitudesPago(usuario.token)
            if (!data.error) {
                setPendientesCount(data.filter(s => s.estado === 'Pendiente').length)
            }
        }
        cargarPendientes()
    }, [usuario.token])

    const handleLogout = () => { logout(); navigate('/login') }

    const handleCrear = async (formData) => {
        const { nombreFamilia, ...datosBase } = formData
        const payload = nombreFamilia ? { ...datosBase, nombreFamilia } : datosBase
        const data = await crearSocio(usuario.token, payload)
        if (data.error) {
            toast.error(data.error)
        } else {
            toast.success(`Socio creado — N° Socio: ${data.nroSocio}`)
            setMostrarFormNuevo(false)
            cargarDatos()
        }
    }

    const handleEditar = async (formData) => {
        const data = await editarSocio(usuario.token, socioEditando.id, formData)
        if (data.error) {
            toast.error(data.error)
        } else {
            toast.success('Socio actualizado correctamente')
            setSocioEditando(null)
            cargarDatos()
        }
    }

    const handleEliminar = async (id, nombre) => {
        const ok = await confirmar({
            titulo: 'Eliminar socio',
            mensaje: `¿Seguro que querés eliminar a ${nombre}? Esta acción no se puede deshacer.`,
            labelOk: 'Sí, eliminar',
            tipo: 'danger'
        })
        if (!ok) return
        const data = await eliminarSocio(usuario.token, id)
        if (data.error) {
            toast.error(data.error)
        } else {
            toast.success('Socio eliminado correctamente')
            cargarDatos()
        }
    }

    const handleConfirmarPago = async (id) => {
        const ok = await confirmar({
            titulo: 'Confirmar pago',
            mensaje: '¿Confirmar este pago como válido?',
            labelOk: 'Sí, confirmar',
            tipo: 'warning'
        })
        if (!ok) return
        const data = await confirmarSolicitud(usuario.token, id)
        if (data.error) {
            toast.error(data.error)
        } else {
            toast.success('Pago confirmado ✅')
            cargarDatos()
        }
    }

    const handleRechazarPago = async (id) => {
        const ok = await confirmar({
            titulo: 'Rechazar pago',
            mensaje: '¿Seguro que querés rechazar esta solicitud de pago?',
            labelOk: 'Sí, rechazar',
            tipo: 'danger'
        })
        if (!ok) return
        const data = await rechazarSolicitud(usuario.token, id)
        if (data.error) {
            toast.error(data.error)
        } else {
            toast.warning('Pago rechazado')
            cargarDatos()
        }
    }
return (
    <div className="admin" data-theme={tema}>
        <aside className="admin-sidebar">
            <div className="admin-sidebar-header">
                <ShieldCog className="icono-admin" />
                <h3>Panel Admin</h3>
                <p>Club Catarindo</p>
            </div>
            <nav className="admin-nav">
                <button className={seccion === 'socios'    ? 'activo' : ''} onClick={() => setSeccion('socios')}>
                    <Users /> Gestión de Socios
                </button>
                <button className={seccion === 'finanzas'  ? 'activo' : ''} onClick={() => setSeccion('finanzas')}>
                    <Landmark /> Finanzas
                </button>
                <button className={seccion === 'morosidad' ? 'activo' : ''} onClick={() => setSeccion('morosidad')}>
                    <BookAlert /> Morosidad
                </button>
                <button className={seccion === 'pagos'     ? 'activo' : ''} onClick={() => setSeccion('pagos')}>
                    <CreditCard /> Pagos
                    {pendientesCount > 0 && (
                        <span className="sidebar-badge">{pendientesCount}</span>
                    )}
                </button>
                <button className={seccion === 'reportes'  ? 'activo' : ''} onClick={() => setSeccion('reportes')}>
                    <FileChartPie /> Reportes
                </button>
            </nav>
            <div className="sidebar-footer">
                <div className="theme-toggle-row" onClick={toggleTema}>
                    <span className="theme-toggle-label">
                        {tema === 'dark' ? (
                            <><Moon size={18} style={{ marginRight: '6px' }} /> Modo noche</>
                        ) : (
                            <><Sun size={18} style={{ marginRight: '6px' }} /> Modo día</>
                        )}
                    </span>
                    <div className="toggle-switch">
                        <div className="toggle-knob" />
                    </div>
                </div>
                <button className="btn-cerrar-admin" onClick={handleLogout}>
                    <DoorClosed /> Cerrar Sesión
                </button>
            </div>
        </aside>

        <main className="admin-main">

            {/* ── SOCIOS ── */}
            {seccion === 'socios' && (
                <div>
                    <div className="admin-header">
                        <h2>Gestión de Socios</h2>
                        <button className="btn-nuevo" onClick={() => { setMostrarFormNuevo(true); setSocioEditando(null) }}>
                            + Nuevo Socio
                        </button>
                    </div>
                    {socioEditando && (
                        <FormEditarSocio
                            socio={socioEditando}
                            onEditar={handleEditar}
                            onCancelar={() => setSocioEditando(null)}
                        />
                    )}
                    <div className="admin-buscador">
                        <input
                            type="text"
                            placeholder="Buscar por nombre, DNI o N° socio..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                        />
                    </div>
                    {cargando ? (
                        <SkeletonTabla columnas={6} filas={6} />
                    ) : sociosOrdenados.length > 0 ? (
                        <table className="tabla tabla-sortable">
                            <thead>
                                <tr>
                                    <th className="th-sortable" onClick={() => toggleOrdenSocios('nro_socio')}>
                                        N° Socio <IconoOrdenSocios columna="nro_socio" />
                                    </th>
                                    <th className="th-sortable" onClick={() => toggleOrdenSocios('nombre')}>
                                        Nombre <IconoOrdenSocios columna="nombre" />
                                    </th>
                                    <th>DNI</th>
                                    <th>Correo</th>
                                    <th className="th-sortable" onClick={() => toggleOrdenSocios('estado')}>
                                        Estado <IconoOrdenSocios columna="estado" />
                                    </th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sociosOrdenados.map((s) => (
                                    <tr key={s.id}>
                                        <td data-label="N° Socio">{s.nro_socio}</td>
                                        <td data-label="Nombre">{s.nombre} {s.apellido}</td>
                                        <td data-label="DNI">{s.dni}</td>
                                        <td data-label="Correo">{s.correo}</td>
                                        <td data-label="Estado">
                                            <span className={`badge-estado ${s.estado === 'Activo' ? 'activo' : 'suspendido'}`}>
                                                {s.estado}
                                            </span>
                                        </td>
                                        <td data-label="Acciones">
                                            <button className="btn-editar"   onClick={() => setSocioEditando(s)}><SquarePen /></button>
                                            <button className="btn-eliminar" onClick={() => handleEliminar(s.id, `${s.nombre} ${s.apellido}`)}><Trash /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="sin-datos">
                            <Users size={40} className="sin-datos-icono" />
                            <p>No hay socios registrados.</p>
                        </div>
                    )}
                </div>
            )}

            {/* ── FINANZAS ── */}
            {seccion === 'finanzas' && (
                <div>
                    <h2>Resumen Financiero</h2>
                    {cargando ? (
                        <><SkeletonCards cantidad={4} /><SkeletonTabla columnas={5} filas={5} /></>
                    ) : (
                        <>
                            {finanzas && (
                                <div className="admin-cards">
                                    <div className="admin-card azul"><p>Ingresos del mes</p><h3>S/ {Number(finanzas.ingresosMes).toFixed(2)}</h3></div>
                                    <div className="admin-card verde"><p>Pagos confirmados</p><h3>{finanzas.pagosConfirmados}</h3></div>
                                    <div className="admin-card naranja"><p>Pagos pendientes</p><h3>{finanzas.pagosPendientes}</h3></div>
                                    <div className="admin-card rojo"><p>Total deuda</p><h3>S/ {Number(finanzas.totalDeuda).toFixed(2)}</h3></div>
                                </div>
                            )}
                            <h3 className="subtitulo-seccion">Movimientos recientes</h3>
                            {pagos.length > 0 ? (
                                <table className="tabla">
                                    <thead>
                                        <tr><th>Fecha</th><th>Socio</th><th>Método</th><th>Monto</th><th>Estado</th></tr>
                                    </thead>
                                    <tbody>
                                        {pagos.map((p, i) => (
                                            <tr key={i}>
                                                <td data-label="Fecha">{new Date(p.fecha).toLocaleDateString('es-PE')}</td>
                                                <td data-label="Socio">{p.nombre} {p.apellido}</td>
                                                <td data-label="Método">{p.metodo}</td>
                                                <td data-label="Monto">S/ {Number(p.monto).toFixed(2)}</td>
                                                <td data-label="Estado">
                                                    <span className={`badge-estado-pago ${p.estado === 'Confirmado' ? 'confirmado' : 'pendiente'}`}>
                                                        {p.estado}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="sin-datos">
                                    <Landmark size={40} className="sin-datos-icono" />
                                    <p>No hay movimientos registrados.</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* ── MOROSIDAD ── */}
            {seccion === 'morosidad' && (
                <div>
                    <h2>Control de Morosidad</h2>
                    {cargando ? (
                        <><SkeletonCards cantidad={3} /><SkeletonTabla columnas={5} filas={5} /></>
                    ) : (
                        <>
                            <div className="admin-cards">
                                <div className="admin-card naranja"><p>Socios con deuda</p><h3>{morosos.length}</h3></div>
                                <div className="admin-card rojo">
                                    <p>Deuda mayor 60 días</p>
                                    <h3>{morosos.filter(m => Math.floor((new Date() - new Date(m.fecha_deuda_mas_antigua)) / 86400000) > 60).length}</h3>
                                </div>
                                <div className="admin-card gris"><p>Suspendidos</p><h3>{morosos.filter(m => m.estado === 'Suspendido').length}</h3></div>
                            </div>
                            {morosos.length > 0 ? (
                                <table className="tabla">
                                    <thead>
                                        <tr><th>N° Socio</th><th>Nombre</th><th>Deuda total</th><th>Días de mora</th><th>Estado</th></tr>
                                    </thead>
                                    <tbody>
                                        {morosos.map((m, i) => {
                                            const dias = Math.floor((new Date() - new Date(m.fecha_deuda_mas_antigua)) / 86400000)
                                            return (
                                                <tr key={i}>
                                                    <td data-label="N° Socio">{m.nro_socio}</td>
                                                    <td data-label="Nombre">{m.nombre} {m.apellido}</td>
                                                    <td data-label="Deuda total">S/ {Number(m.deuda_total).toFixed(2)}</td>
                                                    <td data-label="Días de mora"><span className={dias > 60 ? 'texto-rojo' : 'texto-naranja'}>{dias} días</span></td>
                                                    <td data-label="Estado"><span className={`badge-estado ${m.estado === 'Activo' ? 'activo' : 'suspendido'}`}>{m.estado}</span></td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="sin-datos">
                                    <BookAlert size={40} className="sin-datos-icono" />
                                    <p>No hay socios morosos.</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* ── PAGOS ── */}
            {seccion === 'pagos' && (
                <div>
                    <h2>Solicitudes de Pago</h2>
                    {cargando ? (
                        <SkeletonTabla columnas={11} filas={5} />
                    ) : solicitudes.length > 0 ? (
                        <table className="tabla">
                            <thead>
                                <tr>
                                    <th>Socio</th><th>Casa</th><th>Servicio</th><th>Monto</th>
                                    <th>Fecha</th><th>Hora</th><th>N° operación</th>
                                    <th>Subido</th><th>Comprobante</th><th>Estado</th><th>Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {solicitudes.map((s, i) => (
                                    <tr key={i}>
                                        <td data-label="Socio">{s.nombre} {s.apellido}</td>
                                        <td data-label="Casa">Casa {s.nro_casa}</td>
                                        <td data-label="Servicio">{s.servicio}</td>
                                        <td data-label="Monto">S/ {Number(s.monto).toFixed(2)}</td>
                                        <td data-label="Fecha">{s.fecha_operacion ? new Date(s.fecha_operacion).toLocaleDateString('es-PE') : '—'}</td>
                                        <td data-label="Hora">{s.hora_operacion || '—'}</td>
                                        <td data-label="N° operación">{s.nro_operacion || '—'}</td>
                                        <td data-label="Subido">{s.fecha_subida ? new Date(s.fecha_subida).toLocaleString('es-PE') : '—'}</td>
                                        <td data-label="Comprobante">
                                            {s.comprobante ? (
                                                <a href={`${API_BASE}/uploads/${s.comprobante}`} target="_blank" rel="noreferrer" className="btn-ver-comprobante">
                                                    <View /> Ver
                                                </a>
                                            ) : '—'}
                                        </td>
                                        <td data-label="Estado">
                                            <span className={`badge-estado-pago ${s.estado === 'Confirmado' ? 'confirmado' : s.estado === 'Rechazado' ? 'rechazado' : 'pendiente'}`}>
                                                {s.estado}
                                            </span>
                                        </td>
                                        <td data-label="Acción">
                                            {s.estado === 'Pendiente' && (
                                                <div className="acciones-pago">
                                                    <button className="btn-confirmar" onClick={() => handleConfirmarPago(s.id)}>✅</button>
                                                    <button className="btn-rechazar"  onClick={() => handleRechazarPago(s.id)}>❌</button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="sin-datos">
                            <CreditCard size={40} className="sin-datos-icono" />
                            <p>No hay solicitudes de pago.</p>
                        </div>
                    )}
                </div>
            )}

            {/* ── REPORTES ── */}
            {seccion === 'reportes' && (
                <div>
                    <h2>Generar Reportes</h2>
                    <div className="reportes-grid">
                        <div className="reporte-card">
                            <span><FileText size={50} /></span>
                            <h4>Reporte PDF</h4>
                            <p>Estado de cuentas general</p>
                            <button className="btn-reporte" onClick={() => toast.info('PDF próximamente')}>Generar PDF</button>
                        </div>
                        <div className="reporte-card">
                            <span><Sheet size={50} /></span>
                            <h4>Exportar Excel</h4>
                            <p>Lista completa de socios y pagos</p>
                            <button className="btn-reporte" onClick={() => toast.info('Excel próximamente')}>Exportar Excel</button>
                        </div>
                        <div className="reporte-card">
                            <span><ChartNoAxesCombined size={50} /></span>
                            <h4>Gráficos de consumo</h4>
                            <p>Consumos por servicio y mes</p>
                            <button className="btn-reporte" onClick={() => toast.info('Gráficos próximamente')}>Ver Gráficos</button>
                        </div>
                        <div className="reporte-card">
                            <span><Network size={50} /></span>
                            <h4>Ranking de socios</h4>
                            <p>Socios con mayor consumo</p>
                            <button className="btn-reporte" onClick={() => toast.info('Ranking próximamente')}>Ver Ranking</button>
                        </div>
                    </div>
                </div>
            )}

        </main>

        {mostrarFormNuevo && (
            <FormNuevoSocio
                onCrear={handleCrear}
                onCancelar={() => setMostrarFormNuevo(false)}
            />
        )}

        <ToastContainer toasts={toasts} />
        {ModalConfirm}
    </div>
    )
}

export default AdminPanel