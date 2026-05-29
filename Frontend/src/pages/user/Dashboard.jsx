import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { SeccionResumen } from './components/SeccionResumen';
import { SeccionComunidad } from './components/SeccionComunidad';
import { HistorialTabla, ConsumosTabla } from './components/TablasData';
import { PerfilSocio } from './components/PerfilSocio';
import { Loader2, FileUser, MessageSquare, Bolt, CreditCard, UserRound } from 'lucide-react';
import { getPerfil, getCuentaMensual, getConsumos, getPagos } from '../../services/socioService';
import './Dashboard.css';

const MENU = [
    { id: 'resumen',   Icon: FileUser,      label: 'Inicio' },
    { id: 'comunidad', Icon: MessageSquare, label: 'Comunidad' },
    { id: 'consumos',  Icon: Bolt,          label: 'Consumos' },
    { id: 'pagos',     Icon: CreditCard,    label: 'Pagos' },
    { id: 'perfil',    Icon: UserRound,     label: 'Perfil' },
];

export default function Dashboard() {
    const [seccion, setSeccion]         = useState('resumen');
    const [tema, setTema]               = useState(() => localStorage.getItem('theme') || 'light');
    const [datos, setDatos]             = useState({ socio: null, cuenta: null, consumos: [], pagos: [] });
    const [cargando, setCargando]       = useState(true);
    const [fotoPerfil, setFotoPerfil]   = useState(() => localStorage.getItem('fotoPerfilSocio') || null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { usuario } = useAuth();

    const actualizarFoto = (nuevaFoto) => {
        setFotoPerfil(nuevaFoto);
        localStorage.setItem('fotoPerfilSocio', nuevaFoto);
    };

    const toggleTema = () => {
        const nuevoTema = tema === 'light' ? 'dark' : 'light';
        setTema(nuevoTema);
        localStorage.setItem('theme', nuevoTema);
    };

    const cargarTodo = useCallback(async () => {
        if (!usuario?.token) return;
        try {
            setCargando(true);
            const respuestas = await Promise.allSettled([
                getPerfil(usuario.token),
                getCuentaMensual(usuario.token),
                getConsumos(usuario.token),
                getPagos(usuario.token)
            ]);
            const [perfil, cuenta, consumos, pagos] = respuestas.map(r =>
                r.status === 'fulfilled' && !r.value?.error ? r.value : null
            );
            setDatos({ socio: perfil, cuenta, consumos: consumos || [], pagos: pagos || [] });
        } catch (error) {
            console.error("Error crítico:", error);
        } finally {
            setCargando(false);
        }
    }, [usuario?.token]);

    useEffect(() => { cargarTodo(); }, [cargarTodo]);

    if (cargando) return (
        <div className="dashboard-cargando">
            <Loader2 className="animate-spin" size={40} />
            <p>Sincronizando información...</p>
        </div>
    );

    const seccionActiva = MENU.find(m => m.id === seccion)?.label || 'Inicio';

    return (
        <div className="dashboard" data-theme={tema}>

            <Sidebar
                socio={datos.socio}
                seccionActual={seccion}
                setSeccion={setSeccion}
                tema={tema}
                toggleTema={toggleTema}
                fotoPerfil={fotoPerfil}
                isOpen={sidebarOpen}
                onOpen={() => setSidebarOpen(true)}
                onClose={() => setSidebarOpen(false)}
            />

            <main className="dashboard-main">

                {/* ── Topbar móvil ── */}
                <div className="mobile-topbar">
                    <div className="topbar-perfil">
                        <div className="topbar-avatar-wrap">
                            <div className="topbar-avatar">
                                {fotoPerfil
                                    ? <img src={fotoPerfil} alt="Perfil" className="avatar-img-min" />
                                    : <span>{datos.socio?.nombre?.[0]?.toUpperCase() || 'D'}</span>
                                }
                            </div>
                            <div className="topbar-status-dot" />
                        </div>
                        <div className="topbar-info">
                            <p className="topbar-saludo">👋 Hola,</p>
                            <h4 className="topbar-nombre">
                                {datos.socio?.nombre} {datos.socio?.apellido}
                            </h4>
                            <span className="topbar-badge">
                                {datos.socio?.tipoSocio || 'Socio Titular'}
                            </span>
                        </div>
                    </div>

                    <div className="topbar-seccion">
                        <span className="topbar-seccion-en">Estás en</span>
                        <span className="topbar-seccion-nombre">{seccionActiva}</span>
                        <span className="topbar-seccion-dot" />
                    </div>
                </div>

                {/* ── Secciones ── */}
                {seccion === 'resumen'   && <SeccionResumen cuenta={datos.cuenta} socio={datos.socio} refrescar={cargarTodo} />}
                {seccion === 'comunidad' && <SeccionComunidad socio={datos.socio} fotoPerfil={fotoPerfil} />}
                {seccion === 'consumos'  && <ConsumosTabla data={datos.consumos} alPagar={() => setSeccion('pagos')} />}
                {seccion === 'pagos'     && <HistorialTabla titulo="Mis Pagos" data={datos.pagos} />}
                {seccion === 'perfil'    && <PerfilSocio socio={datos.socio} fotoPerfil={fotoPerfil} setFotoPerfil={actualizarFoto} />}

            </main>
        </div>
    );
}