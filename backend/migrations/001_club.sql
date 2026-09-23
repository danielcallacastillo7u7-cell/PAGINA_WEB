-- Esquema nuevo independiente. No modifica ni borra tablas o filas antiguas.
BEGIN;
CREATE TABLE IF NOT EXISTS importaciones_excel (
  id SERIAL PRIMARY KEY,
  nombre_archivo TEXT NOT NULL,
  total_socios INTEGER NOT NULL DEFAULT 0,
  total_movimientos INTEGER NOT NULL DEFAULT 0,
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS socios_club (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER REFERENCES usuarios(id),
  numero_excel INTEGER,
  direccion_tipo TEXT,
  zona TEXT,
  lote TEXT,
  tipo TEXT,
  nombre TEXT NOT NULL,
  cuota_base NUMERIC(12,2) CHECK (cuota_base >= 0),
  estado BOOLEAN NOT NULL DEFAULT true,
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT now(),
  importacion_id INTEGER REFERENCES importaciones_excel(id)
);
CREATE TABLE IF NOT EXISTS cuotas_club (
  id SERIAL PRIMARY KEY,
  socio_id INTEGER NOT NULL REFERENCES socios_club(id),
  anio INTEGER NOT NULL CHECK (anio BETWEEN 1900 AND 2200),
  mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
  monto NUMERIC(12,2) NOT NULL CHECK (monto >= 0),
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','pagado','vencido')),
  fecha_vencimiento DATE NOT NULL,
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (socio_id, anio, mes),
  UNIQUE (id, socio_id)
);
CREATE TABLE IF NOT EXISTS pagos_cuotas (
  id SERIAL PRIMARY KEY,
  cuota_id INTEGER NOT NULL,
  socio_id INTEGER NOT NULL REFERENCES socios_club(id),
  monto NUMERIC(12,2) NOT NULL CHECK (monto > 0),
  fecha_pago DATE NOT NULL,
  metodo_pago TEXT NOT NULL,
  numero_recibo TEXT,
  referencia TEXT,
  comprobante_url TEXT,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','aprobado','rechazado')),
  observacion TEXT,
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_revision TIMESTAMPTZ,
  FOREIGN KEY (cuota_id, socio_id) REFERENCES cuotas_club(id, socio_id)
);
CREATE TABLE IF NOT EXISTS movimientos_financieros (
  id SERIAL PRIMARY KEY,
  fecha DATE NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('ingreso','egreso')),
  direccion TEXT,
  categoria TEXT NOT NULL DEFAULT 'historico',
  concepto TEXT NOT NULL,
  monto NUMERIC(12,2) NOT NULL CHECK (monto > 0),
  metodo_pago TEXT,
  numero_recibo TEXT,
  referencia TEXT,
  observacion TEXT,
  hoja_excel TEXT,
  importacion_id INTEGER REFERENCES importaciones_excel(id),
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS pagos_cuotas_cuota_idx ON pagos_cuotas(cuota_id);
CREATE INDEX IF NOT EXISTS movimientos_financieros_fecha_idx ON movimientos_financieros(fecha);
COMMIT;
