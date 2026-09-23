BEGIN;
CREATE TABLE IF NOT EXISTS auditoria_club (
 id BIGSERIAL PRIMARY KEY, usuario_id INTEGER REFERENCES usuarios(id), accion TEXT NOT NULL,
 entidad TEXT NOT NULL, entidad_id INTEGER, datos JSONB NOT NULL DEFAULT '{}', fecha TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS avisos_club (
 id SERIAL PRIMARY KEY, titulo TEXT NOT NULL, contenido TEXT NOT NULL,
 autor_id INTEGER REFERENCES usuarios(id), activo BOOLEAN NOT NULL DEFAULT true, fecha TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS mensajes_contacto (
 id SERIAL PRIMARY KEY, nombre TEXT NOT NULL, correo TEXT NOT NULL, asunto TEXT NOT NULL,
 mensaje TEXT NOT NULL, atendido BOOLEAN NOT NULL DEFAULT false, fecha TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE importaciones_excel ADD COLUMN IF NOT EXISTS huella TEXT;
ALTER TABLE movimientos_financieros ADD COLUMN IF NOT EXISTS huella TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS movimientos_huella_idx ON movimientos_financieros(huella) WHERE huella IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS importaciones_huella_idx ON importaciones_excel(huella) WHERE huella IS NOT NULL;
CREATE OR REPLACE VIEW saldos_cuotas_club AS
 SELECT c.id,c.socio_id,c.anio,c.mes,c.monto,c.fecha_vencimiento,c.fecha_creacion,
 COALESCE(p.pagado,0) AS pagado, COALESCE(p.pendiente,0) AS en_revision,
 GREATEST(c.monto-COALESCE(p.pagado,0),0) AS saldo,
 GREATEST(c.monto-COALESCE(p.pagado,0)-COALESCE(p.pendiente,0),0) AS disponible,
 CASE WHEN c.monto <= COALESCE(p.pagado,0) THEN 'pagado'
 WHEN c.fecha_vencimiento < CURRENT_DATE THEN 'vencido' ELSE 'pendiente' END AS estado
 FROM cuotas_club c LEFT JOIN (
 SELECT cuota_id, SUM(monto) FILTER (WHERE estado='aprobado') AS pagado,
 SUM(monto) FILTER (WHERE estado='pendiente') AS pendiente
 FROM pagos_cuotas GROUP BY cuota_id) p ON p.cuota_id=c.id;
CREATE TABLE IF NOT EXISTS reservas_club (
 id SERIAL PRIMARY KEY, usuario_id INTEGER NOT NULL REFERENCES usuarios(id), espacio TEXT NOT NULL,
 fecha DATE NOT NULL,hora_inicio TIME NOT NULL,hora_fin TIME NOT NULL, motivo TEXT NOT NULL,
 estado TEXT NOT NULL DEFAULT 'pendiente' CHECK(estado IN ('pendiente','aprobada','rechazada','cancelada')),
 observacion TEXT,creado TIMESTAMPTZ NOT NULL DEFAULT now(), CHECK(hora_fin>hora_inicio)
);
ALTER TABLE movimientos_financieros ADD COLUMN IF NOT EXISTS anulado BOOLEAN NOT NULL DEFAULT false;
CREATE OR REPLACE VIEW movimientos_vigentes_club AS SELECT * FROM movimientos_financieros WHERE anulado=false;
COMMIT;
