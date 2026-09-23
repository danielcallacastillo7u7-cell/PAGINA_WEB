import test from 'node:test';
import assert from 'node:assert/strict';
process.env.DATABASE_URL = 'postgresql://test:test@localhost/test';
process.env.JWT_SECRET = 'test-only-secret-not-for-production-123456789';
const { pool } = await import('../db.js');
const { default: app } = await import('../app.js');
const { default: jwt } = await import('jsonwebtoken');
const roles = { 1: 'jefe', 2: 'admin', 3: 'contador', 4: 'usuario' };
const originalQuery = pool.query;
let calls = [];
pool.query = async (sql, values) => {
  calls.push(sql);
  if (sql.startsWith('SELECT id, nombre, correo, rol FROM usuarios')) {
    return { rows: roles[values[0]] ? [{ id: values[0], rol: roles[values[0]], nombre: 'Test', correo: 'test@example.com' }] : [] };
  }
  throw new Error('Unexpected database access');
};
const server = app.listen(0, '127.0.0.1');
await new Promise(resolve => server.once('listening', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
function request(path, id, body, method = 'GET') {
  const headers = { 'Content-Type': 'application/json' };
  if (id) headers.Authorization = `Bearer ${jwt.sign({ id, rol: 'jefe' }, process.env.JWT_SECRET, { expiresIn: '1h' })}`;
  return fetch(base + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
}
test.after(async () => { server.closeAllConnections(); await new Promise(r => server.close(r)); pool.query = originalQuery; await pool.end(); });
test('all business routes reject anonymous requests', async () => {
  for (const path of ['/api/admin/socios','/api/socios','/api/cuotas','/api/pagos','/api/finanzas','/api/reportes/resumen','/api/dashboard/resumen','/api/importaciones/analizar','/api/solicitudes']) {
    assert.equal((await request(path)).status, 401, path);
  }
});
test('registration is not public', async () => assert.equal((await request('/api/auth/register', null, {}, 'POST')).status, 401));
test('database role overrides forged JWT role', async () => assert.equal((await request('/api/finanzas', 4)).status, 403));
test('admin cannot create a jefe account', async () => {
  assert.equal((await request('/api/auth/register', 2, { nombre: 'test', correo:'test@example.com', password:'long-password', rol:'jefe' }, 'POST')).status, 400);
});
test('contador cannot import historical data', async () => assert.equal((await request('/api/importaciones/analizar', 3, {}, 'POST')).status, 403));
test('user cannot read another users history', async () => assert.equal((await request('/api/solicitudes/usuario/99', 4)).status, 403));
test('deactivated account rejected even with valid signature', async () => assert.equal((await request('/api/auth/me', 99)).status, 401));
test('login validates types before querying database', async () => assert.equal((await request('/api/auth/login', null, { correo: {}, password: [] }, 'POST')).status, 400));
test('negative financial amount rejected', async () => assert.equal((await request('/api/finanzas', 1, { fecha:'2026-09-18', tipo:'ingreso', categoria:'otro', concepto:'test', monto:-10 }, 'POST')).status, 400));
test('uploads directory is not publicly accessible', async () => assert.equal((await request('/uploads/pagos.routes.js')).status, 404));
test('JWT verifier returns current account', async () => {
  const response = await request('/api/auth/me', 2);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).usuario.rol, 'admin');
});
