import React, { useRef, useState } from 'react';
import { User, Mail, IdCard, CreditCard, Award, Camera, Loader2, CheckCircle } from 'lucide-react';

export function PerfilSocio({ socio, fotoPerfil, setFotoPerfil }) {
    const fileInputRef = useRef(null);
    const [cargandoImagen, setCargandoImagen] = useState(false);

    const handleFotoChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            setCargandoImagen(true);
            const reader = new FileReader();
            reader.onloadend = () => {
                setFotoPerfil(reader.result);
                setCargandoImagen(false);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="perfil-layout">
            <div className="perfil-content">
                
                {/* TARJETA IZQUIERDA */}
                <aside className="perfil-card-main">
                    <div className="perfil-avatar-wrapper">
                        {fotoPerfil ? (
                            <img src={fotoPerfil} alt="Perfil" className="perfil-avatar-img" />
                        ) : (
                            <div className="perfil-avatar-placeholder">
                                <span>{socio?.nombre?.[0]?.toUpperCase() || <User size={40}/>}</span>
                            </div>
                        )}
                        {cargandoImagen && <div className="avatar-loader"><Loader2 className="animate-spin" /></div>}
                        <button className="btn-cambiar-foto" onClick={() => fileInputRef.current.click()}>
                            <Camera size={16} />
                        </button>
                        <input type="file" ref={fileInputRef} hidden onChange={handleFotoChange} accept="image/*" />
                    </div>
                    <div className="perfil-info-basica">
                        <h3>{socio?.nombre} {socio?.apellido}</h3>
                        <p className="perfil-tag">Socio Titular</p>
                    </div>
                </aside>

                {/* TARJETA DERECHA */}
                <section className="perfil-detalles">
                    <div className="detalles-header">
                        <h4>Información de Membresía</h4>
                        <CheckCircle size={20} className="icon-success" />
                    </div>

                    <div className="detalles-lista">
                        <div className="detalle-fila">
                            <div className="label-group">
                                <IdCard size={18} />
                                <span>DNI / Identificación</span>
                            </div>
                            <span className="value-text">{socio?.dni || '12345666'}</span>
                        </div>

                        <div className="detalle-fila">
                            <div className="label-group">
                                <Mail size={18} />
                                <span>Correo Electrónico</span>
                            </div>
                            <span className="value-text email-text">{socio?.correo || 'correo@ejemplo.com'}</span>
                        </div>

                        <div className="detalle-fila">
                            <div className="label-group">
                                <CreditCard size={18} />
                                <span>Número de Socio</span>
                            </div>
                            <span className="value-text">{socio?.nro_socio || '007'}</span>
                        </div>

                        <div className="detalle-fila">
                            <div className="label-group">
                                <Award size={18} />
                                <span>Estado de Cuenta</span>
                            </div>
                            <span className="badge-status">{socio?.estado || 'Activo'}</span>
                        </div>
                    </div>

                    <button className="btn-solicitar">
                        Solicitar Corrección de Datos
                    </button>
                </section>
            </div>
        </div>
    );
}