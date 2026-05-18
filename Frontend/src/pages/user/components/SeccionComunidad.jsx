import React, { useState, useEffect, useRef } from 'react';
import { Send, Heart, MessageSquare, Camera, X } from 'lucide-react';

export function SeccionComunidad({ socio, fotoPerfil }) {
    const [comentario, setComentario] = useState("");
    const [imagenSeleccionada, setImagenSeleccionada] = useState(null);
    const [postExpandido, setPostExpandido] = useState(null);
    const [publicaciones, setPublicaciones] = useState([]);
    const fileInputRef = useRef(null);

    const API_URL = 'http://localhost:3000/api/comunidad';

    // 1. CARGAR PUBLICACIONES DESDE EL SERVIDOR (MYSQL)
    useEffect(() => {
        const cargarPosts = async () => {
            try {
                const response = await fetch(API_URL);
                const data = await response.json();
                
                // Formatear comentarios (vienen como string JSON de la DB)
                const postsFormateados = data.map(post => ({
                    ...post,
                    liked: Boolean(post.liked), // Convertir 0/1 a boolean
                    comentarios: post.comentarios ? (typeof post.comentarios === 'string' ? JSON.parse(post.comentarios) : post.comentarios) : []
                }));
                
                setPublicaciones(postsFormateados);
            } catch (error) {
                console.error("Error al cargar publicaciones:", error);
            }
        };
        cargarPosts();
    }, []);

    const manejarImagen = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                // Aquí podrías añadir una compresión antes de enviar si la imagen es muy grande
                setImagenSeleccionada(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // 2. ENVIAR PUBLICACIÓN AL SERVIDOR
    const manejarPublicacion = async (e) => {
        e.preventDefault();
        if (!comentario.trim() && !imagenSeleccionada) return;

        const nuevoPost = {
            autor: socio?.nombre || "Socio",
            avatarAutor: fotoPerfil || "/default-avatar.png",
            texto: comentario,
            image: imagenSeleccionada,
            fecha: new Date().toLocaleString('es-ES', { 
                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true 
            })
        };

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(nuevoPost)
            });

            const data = await response.json();

            if (data.status === 'success') {
                // Añadimos el ID que generó la base de datos y actualizamos la lista local
                setPublicaciones([{ ...nuevoPost, id: data.id, likes: 0, liked: false, comentarios: [] }, ...publicaciones]);
                setComentario("");
                setImagenSeleccionada(null);
            }
        // eslint-disable-next-line no-unused-vars
        } catch (error) {
            alert("No se pudo conectar con el servidor para publicar.");
        }
    };

    // 3. ACTUALIZAR LIKES EN EL SERVIDOR
    const toggleLike = async (id) => {
        const post = publicaciones.find(p => p.id === id);
        const nuevoEstadoLiked = !post.liked;
        const nuevosLikes = nuevoEstadoLiked ? post.likes + 1 : post.likes - 1;

        try {
            // Actualizar localmente para respuesta inmediata
            setPublicaciones(publicaciones.map(p => 
                p.id === id ? { ...p, liked: nuevoEstadoLiked, likes: nuevosLikes } : p
            ));

            // Enviar al servidor
            await fetch(`${API_URL}/like`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, likes: nuevosLikes, liked: nuevoEstadoLiked ? 1 : 0 })
            });
        // eslint-disable-next-line no-unused-vars
        } catch (error) {
            console.error("Error al guardar like");
        }
    };

    const agregarComentario = async (postId, textoComentario) => {
        if (!textoComentario.trim()) return;

        const postActual = publicaciones.find(p => p.id === postId);
        const nuevoComentario = {
            id: Date.now(),
            user: socio?.nombre || "Socio",
            avatar: fotoPerfil || "/default-avatar.png",
            texto: textoComentario
        };

        const nuevosComentarios = [...(postActual.comentarios || []), nuevoComentario];

        try {
            // Actualizar local
            setPublicaciones(publicaciones.map(p => 
                p.id === postId ? { ...p, comentarios: nuevosComentarios } : p
            ));

            // Aquí podrías crear una ruta en tu backend específica para comentarios
            // Por ahora, si tu tabla soporta la columna comentarios:
            await fetch(`${API_URL}/comentario`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: postId, comentarios: JSON.stringify(nuevosComentarios) })
            });
        // eslint-disable-next-line no-unused-vars
        } catch (error) {
            console.error("Error al guardar comentario");
        }
    };

    return (
        <div className="comunidad-muro animate-fadeIn">
            <header className="muro-header">
                <h2>Muro de la Comunidad</h2>
                <p>Comparte momentos y noticias con los demás socios</p>
            </header>

            <form className="card-pro muro-form" onSubmit={manejarPublicacion}>
                <div className="form-avatar">
                    <img src={fotoPerfil || "/default-avatar.png"} alt="Yo" className="avatar-img" />
                </div>
                <div className="form-input-container">
                    <textarea 
                        placeholder={`¿Qué quieres compartir, ${socio?.nombre?.split(' ')[0] || 'Socio'}?`}
                        value={comentario}
                        onChange={(e) => setComentario(e.target.value)}
                    />
                    
                    {imagenSeleccionada && (
                        <div className="preview-image-container">
                            <img src={imagenSeleccionada} alt="Preview" />
                            <button type="button" onClick={() => setImagenSeleccionada(null)} className="btn-remove-preview">
                                <X size={16}/>
                            </button>
                        </div>
                    )}

                    <div className="form-footer">
                        <input type="file" hidden ref={fileInputRef} accept="image/*" onChange={manejarImagen} />
                        <button type="button" className="btn-adjuntar" onClick={() => fileInputRef.current.click()}>
                            <Camera size={20} /> <span>Imagen</span>
                        </button>
                        <button type="submit" disabled={!comentario.trim() && !imagenSeleccionada} className="btn-publicar">
                            <Send size={16} /> Publicar
                        </button>
                    </div>
                </div>
            </form>

            <div className="muro-feed">
                {publicaciones.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#666', marginTop: '20px' }}>No hay publicaciones aún. ¡Sé el primero!</p>
                ) : (
                    publicaciones.map(post => (
                        <div key={post.id} className={`post-entry card-pro ${post.esAdmin ? 'post-admin' : ''}`}>
                            <div className="post-header-muro">
                                <div className="post-info-container">
                                    <div className="post-avatar-col">
                                        <img src={post.avatarAutor || "/default-avatar.png"} alt="Avatar" className="post-avatar-circle" />
                                    </div>
                                    <div className="post-texts-col">
                                        <div className="post-meta-name">
                                            <strong>{post.autor}</strong>
                                            {post.esAdmin === 1 && <span className="badge-admin">Admin</span>}
                                        </div>
                                        <span className="post-fecha">{post.fecha}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="post-body-muro">
                                {post.texto && <p className="post-texto-p">{post.texto}</p>}
                                {post.image && (
                                    <div className="post-image-wrapper">
                                        <img src={post.image} alt="Publicación" />
                                    </div>
                                )}
                            </div>

                            <div className="post-footer-muro">
                                <button className={`post-action-btn ${post.liked ? 'active' : ''}`} onClick={() => toggleLike(post.id)}>
                                    <Heart size={18} fill={post.liked ? "currentColor" : "none"} /> 
                                    <span>{post.likes || 0}</span>
                                </button>
                                <button className="post-action-btn" onClick={() => setPostExpandido(postExpandido === post.id ? null : post.id)}>
                                    <MessageSquare size={18} /> 
                                    <span>{post.comentarios?.length || 0}</span>
                                </button>
                            </div>

                            {postExpandido === post.id && (
                                <div className="modal-comentarios-overlay" onClick={() => setPostExpandido(null)}>
                                    <div className="cartilla-comentarios animate-slideUp" onClick={(e) => e.stopPropagation()}>
                                        <div className="cartilla-header">
                                            <h3>Comentarios</h3>
                                            <button className="btn-cerrar-modal" onClick={() => setPostExpandido(null)}>
                                                <X size={20} />
                                            </button>
                                        </div>

                                        <div className="cartilla-body">
                                            {post.comentarios?.map(c => (
                                                <div key={c.id} className="comentario-item-mini">
                                                    <div className="comentario-avatar-col">
                                                        <img src={c.avatar || "/default-avatar.png"} alt={c.user} className="avatar-circle-mini" />
                                                    </div>
                                                    <div className="comentario-text-col">
                                                        <strong>{c.user}</strong>
                                                        <p>{c.texto}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="cartilla-footer">
                                            <input 
                                                type="text" 
                                                placeholder="Escribe un comentario..." 
                                                autoFocus
                                                id={`input-comentario-${post.id}`}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && e.target.value.trim()) {
                                                        agregarComentario(post.id, e.target.value);
                                                        e.target.value = "";
                                                    }
                                                }}
                                            />
                                            <button 
                                                className="btn-enviar-comentario"
                                                onClick={() => {
                                                    const elInput = document.getElementById(`input-comentario-${post.id}`);
                                                    if (elInput && elInput.value.trim()) {
                                                        agregarComentario(post.id, elInput.value);
                                                        elInput.value = "";
                                                    }
                                                }}
                                            >
                                                <Send size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}