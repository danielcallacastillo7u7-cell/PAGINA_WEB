const API_URL = "http://localhost:3000/api";
export const getPerfil = async (token) => {
    try {
        const res = await fetch(`${API_URL}/socio/perfil`, {
        headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await res.json()
        return data
    } catch (error) {
        console.error('Error obteniendo perfil:', error)
        return { error: 'No se pudo conectar con el servidor' }
    }
    
    }

    export const getCuentaMensual = async (token) => {
    try {
        const res = await fetch(`${API_URL}/socio/cuenta`, {
        headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await res.json()
        return data
    } catch (error) {
        console.error('Error obteniendo cuenta:', error)
        return { error: 'No se pudo conectar con el servidor' }
    }
    }

    export const getConsumos = async (token) => {
    try {
        const res = await fetch(`${API_URL}/socio/consumos`, {
        headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await res.json()
        return data
    } catch (error) {
        console.error('Error obteniendo consumos:', error)
        return { error: 'No se pudo conectar con el servidor' }
    }
    }

    export const getPagos = async (token) => {
    try {
        const res = await fetch(`${API_URL}/socio/pagos`, {
        headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await res.json()
        return data
    } catch (error) {
        console.error('Error obteniendo pagos:', error)
        return { error: 'No se pudo conectar con el servidor' }
    }
    }

    export const enviarPago = async (token, formData) => {
    try {
        const res = await fetch(`${API_URL}/socio/pago`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
        })
        const data = await res.json()
        return data
    } catch (error) {
        console.error('Error enviando pago:', error)
        return { error: 'No se pudo conectar con el servidor' }
    }
}
// Añade estas funciones a tu archivo socioService.js

export const getPublicaciones = async (token) => {
    try {
        const resp = await fetch('TU_API_URL_URL/publicaciones', { // Ajusta la URL de tu API_URL
            headers: { 'Authorization': `Bearer ${token}` }
        });
        return await resp.json();
    } catch (error) {
        return { error: true, msg: error.message };
    }
};

export const postPublicacion = async (token, texto) => {
    try {
        const resp = await fetch('TU_API_URL_URL/publicaciones', {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ texto })
        });
        return await resp.json();
    } catch (error) {
        return { error: true, msg: error.message };
    }
};