import app from '../app.js';
import { pool } from '../db.js';
import { config } from '../config.js';
import jwt from 'jsonwebtoken';
import XLSX from 'xlsx';
const server = app.listen(0, '127.0.0.1');
await new Promise(resolve => server.once('listening', resolve));
try {
  const { rows } = await pool.query("SELECT id, rol, auth_version FROM usuarios WHERE estado = true AND rol IN ('jefe','admin','usuario') ORDER BY id");
  const jefe = rows.find(u => u.rol === 'jefe');
  if (!jefe) throw new Error('No existe jefe activo para comprobar lecturas');
  const token = jwt.sign({ id: jefe.id, sv:jefe.auth_version }, config.jwtSecret, { expiresIn: '1m' });
  const headers = { Authorization: `Bearer ${token}` };
  const base = `http://127.0.0.1:${server.address().port}`;
  const paths = ['/api/auth/me','/api/admin/socios','/api/solicitudes','/api/socios','/api/socios/resumen','/api/cuotas','/api/cuotas/resumen/2026','/api/pagos','/api/pagos/resumen','/api/pagos/cuotas-pendientes','/api/finanzas','/api/finanzas/resumen','/api/dashboard/resumen','/api/dashboard/mensual','/api/reportes/resumen','/api/reportes/movimientos','/api/reportes/excel/2026'];
  paths.push('/health','/api/cuentas','/api/configuracion','/api/socios/cuentas/disponibles','/api/comunidad/avisos','/api/comunidad/mensajes','/api/reservas','/api/importaciones/historial','/api/publico/contacto');
  for (const path of paths) {
    const query = path === '/api/reportes/movimientos' ? '?anio=2026&mes=9' : '';
    const response = await fetch(base + path + query, { headers });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${path}`);
    if (path.includes('/excel/')) {
      const book = XLSX.read(Buffer.from(await response.arrayBuffer()));
      if (book.SheetNames.length !== 14) throw new Error('Reporte incompleto');
      console.log('OK Excel: 14 hojas');
    } else { await response.json(); console.log('OK', path); }
  }
  const usuario = rows.find(u => u.rol === 'usuario');
  if (usuario) {
    const r = await fetch(base + `/api/solicitudes/usuario/${usuario.id}`, { headers: { Authorization: `Bearer ${jwt.sign({ id: usuario.id, sv:usuario.auth_version }, config.jwtSecret, { expiresIn: '1m' })}` } });
    if (!r.ok) throw new Error('Historial de usuario no disponible');
    console.log('OK historial propio de usuario');
    for (const path of ['/api/portal/cuotas','/api/portal/pagos','/api/reservas','/api/comunidad/avisos']) {
      const response=await fetch(base+path,{headers:{Authorization:`Bearer ${jwt.sign({id:usuario.id,sv:usuario.auth_version},config.jwtSecret,{expiresIn:'1m'})}`}});
      if(!response.ok)throw new Error(`HTTP ${response.status}: ${path}`);
      await response.json(); console.log('OK usuario',path);
    }
  }
} catch (error) { console.error(error.message); process.exitCode = 1; }
finally { server.closeAllConnections(); await new Promise(r => server.close(r)); await pool.end(); }
