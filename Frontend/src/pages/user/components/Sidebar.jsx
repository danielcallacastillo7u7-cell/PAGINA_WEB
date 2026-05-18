import { FileUser, MessageSquare, Bolt, CreditCard, UserRound, Moon, Sun, DoorOpen, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';

export function Sidebar({ socio, seccionActual, setSeccion, tema, toggleTema, fotoPerfil, isOpen = false, onClose = () => {} }) {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => { 
        logout(); 
        navigate('/login'); 
    };

    const handleSeccion = (id) => {
        setSeccion(id);
        onClose();
    };

    const menuItems = [
        { id: 'resumen',   label: 'Resumen',   icon: FileUser },
        { id: 'comunidad', label: 'Comunidad', icon: MessageSquare },
        { id: 'consumos',  label: 'Consumos',  icon: Bolt },
        { id: 'pagos',     label: 'Pagos',     icon: CreditCard },
        { id: 'perfil',    label: 'Mi Perfil', icon: UserRound },
    ];

    return (
        <>
            {isOpen && (
                <div className="sidebar-overlay visible" onClick={onClose} />
            )}

            <aside className={`dashboard-sidebar ${isOpen ? 'abierto' : ''}`}>
                
                <button className="btn-cerrar-sidebar" onClick={onClose}>
                    <X size={20} />
                </button>

                <div className="sidebar-perfil">
                    <div className="sidebar-avatar">
                        {fotoPerfil ? (
                            <img src={fotoPerfil} alt="Perfil" className="avatar-img-min" />
                        ) : (
                            <span>{socio?.nombre ? socio.nombre[0].toUpperCase() : 'D'}</span>
                        )}
                    </div>
                    <div className="sidebar-info-user">
                        <h3>{socio?.nombre}</h3>
                        <h4>{socio?.apellido}</h4>
                        <span className="badge-activo">● {socio?.estado || 'Activo'}</span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {menuItems.map(item => (
                        <button 
                            key={item.id}
                            className={`nav-btn ${seccionActual === item.id ? 'activo' : ''}`} 
                            onClick={() => handleSeccion(item.id)}
                        >
                            <item.icon size={20} className="nav-icon" /> 
                            <span>{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <div className="theme-switch-container" onClick={toggleTema}>
                        <div className="theme-info">
                            {tema === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
                            <span>Modo {tema === 'dark' ? 'Noche' : 'Día'}</span>
                        </div>
                        <div className={`switch-track ${tema}`}>
                            <div className="switch-thumb" />
                        </div>
                    </div>
                    
                    <button className="btn-logout" onClick={handleLogout}>
                        <DoorOpen size={20} />
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            </aside>
        </>
    );
}