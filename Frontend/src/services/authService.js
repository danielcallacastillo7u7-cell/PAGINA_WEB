const API_URL = "http://localhost:3000/api";
// --- LOGIN Y REGISTRO DE SOCIOS ---
export const loginSocio = async (correo, contrasena) => {
    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ correo, contrasena })
        });
        return await res.json();
    // eslint-disable-next-line no-unused-vars
    } catch (error) {
        return { error: 'No se pudo conectar con el servidor' };
    }
};

export const registrarSocio = async (form) => {
    try {
        const res = await fetch(`${API_URL}/auth/registro`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(form)
        });
        return await res.json();
    // eslint-disable-next-line no-unused-vars
    } catch (error) {
        return { error: 'No se pudo conectar con el servidor' };
    }
};

// --- LOGIN DE ADMINISTRADOR (NUEVO) ---

// Paso 1: Verificación de credenciales admin
export const loginAdmin = async (usuario, dni, contrasena) => {
    try {
        // Quitamos el "/auth" de la URL
        const res = await fetch(`${API_URL}/auth/login-admin`, { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario, dni, contrasena })
        });
        return await res.json();
    // eslint-disable-next-line no-unused-vars
    } catch (error) {
        return { error: 'No se pudo conectar con el servidor' };
    }
};

// Paso 2: Verificar código de seguridad enviado al correo del admin
export const verificarCodigo = async (codigo, adminId) => {
    try {
        // Quitamos el "/auth" de la URL
        const res = await fetch(`${API_URL}/auth/verificar-codigo`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ codigo, adminId })
        });
        return await res.json();
    // eslint-disable-next-line no-unused-vars
    } catch (error) {
        return { error: 'Error al verificar el código de administrador' };
    }
};

// --- RECUPERACIÓN DE CONTRASEÑA SOCIOS ---
export const solicitarRecuperacion = async (correo) => {
    try {
        const res = await fetch(`${API_URL}/auth/recuperar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ correo })
        });
        return await res.json();
    // eslint-disable-next-line no-unused-vars
    } catch (error) {
        return { error: 'Error al solicitar código' };
    }
};

export const verificarCodigoRecuperacion = async (codigo, socioId) => {
    try {
        const res = await fetch(`${API_URL}/auth/recuperar/verificar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ codigo, socioId })
        });
        return await res.json();
    // eslint-disable-next-line no-unused-vars
    } catch (error) {
        return { error: 'Error al verificar código' };
    }
};

export const cambiarContrasena = async (socioId, codigoId, nuevaContrasena) => {
    try {
        const res = await fetch(`${API_URL}/auth/recuperar/cambiar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ socioId, codigoId, nuevaContrasena })
        });
        return await res.json();
    // eslint-disable-next-line no-unused-vars
    } catch (error) {
        return { error: 'Error al cambiar contraseña' };
    }
};
