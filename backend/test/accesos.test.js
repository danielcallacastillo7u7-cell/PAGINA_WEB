import test from 'node:test';
import assert from 'node:assert/strict';
process.env.DATABASE_URL='postgresql://test:test@localhost/test';
process.env.JWT_SECRET='test-only-secret-not-for-production-123456789';
const {validarIdentidad,validarPassword}=await import('../services/cuentas.js');
test('correo se normaliza y nombre se recorta',()=>{
 assert.deepEqual(validarIdentidad('  Socio  ',' SOCIO@EXAMPLE.COM '),{nombre:'Socio',correo:'socio@example.com'});
});
test('rechaza identidades vacías, tipos incorrectos y correos inválidos',()=>{
 for(const [nombre,correo] of [['','a@b.com'],['A',{}],['A','a@@b.com'],['A','sin-arroba'],['A'.repeat(101),'a@b.com']])assert.throws(()=>validarIdentidad(nombre,correo),{status:400});
});
test('contraseña nueva debe cumplir las mismas reglas en el servidor',()=>{
 assert.doesNotThrow(()=>validarPassword('Clave-segura123'));
 for(const p of ['12345678','abcDEFGH','Ab1!','ABCDEF12!','abcdef12!',null])assert.throws(()=>validarPassword(p),{status:400});
});
test('límite bcrypt se cuenta en bytes para evitar truncar contraseñas',()=>{
 assert.throws(()=>validarPassword('Aa1!'+ 'ñ'.repeat(35)),{status:400});
 assert.doesNotThrow(()=>validarPassword('Aa1!'+ 'ñ'.repeat(34)));
});
