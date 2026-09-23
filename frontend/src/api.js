const base = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
export async function apiFetch(path, options = {}) {
  const headers = new Headers(options.headers);
  const token = localStorage.getItem("token");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  let response;
  try { response = await fetch(`${base}${path}`, { ...options, headers }); }
  catch { throw new Error('No se pudo conectar con el servicio. Intenta nuevamente en unos momentos.'); }
  if (response.headers.get('content-type')?.includes('text/html')) throw new Error('El servicio todavía no está disponible. Contacta a la administración.');
  if (response.status === 401 && !path.startsWith("/api/auth/")) {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    window.location.assign("/login");
    throw new Error("Sesión vencida");
  }
  return response;
}

export async function abrirComprobante(id) {
  try {
    const response = await apiFetch(`/api/solicitudes/${id}/comprobante`);
    if (!response.ok) throw new Error("No se pudo obtener el comprobante.");
    const url = URL.createObjectURL(await response.blob());
    const link = document.createElement("a");
    link.href = url; link.download = `comprobante-${id}`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  } catch (error) { alert(error.message); }
}

export async function descargarComprobante(path) {
 try {const r=await apiFetch(path);if(!r.ok)throw new Error('No se pudo obtener el comprobante.');const url=URL.createObjectURL(await r.blob());const a=document.createElement('a');a.href=url;a.download='comprobante';a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);}catch(e){alert(e.message);}
}
