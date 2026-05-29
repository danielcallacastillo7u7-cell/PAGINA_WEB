import { FileText, Coins, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft, RefreshCw } from 'lucide-react';
import './SeccionResumen.css';
import { generarEstadoCuenta } from '../../../utils/generarEstadoCuenta';


export function SeccionResumen({ cuenta, socio, refrescar }) {



    if (!cuenta) return <div className="sin-datos">No hay información de cuenta.</div>;

    const movimientos = [
        {
            tipo: 'ingreso',
            icono: <ArrowUpRight size={20} />,
            label: 'Consumos del Mes',
            monto: Number(cuenta.consumosMes).toFixed(2),
            sub: 'Cargos por consumo',
            gradient: 'grad-teal',
        },
        {
            tipo: 'ingreso',
            icono: <TrendingUp size={20} />,
            label: 'Cargos Fijos',
            monto: Number(cuenta.cargosFijos).toFixed(2),
            sub: 'Membresía y servicios',
            gradient: 'grad-gold',
        },
        {
            tipo: 'egreso',
            icono: <ArrowDownLeft size={20} />,
            label: 'Pagos Realizados',
            monto: Number(cuenta.pagosRealizados).toFixed(2),
            sub: 'Abonos registrados',
            gradient: 'grad-rose',
        },
        {
            tipo: 'saldo',
            icono: <TrendingDown size={20} />,
            label: 'Saldo Pendiente',
            monto: Number(cuenta.saldoPendiente).toFixed(2),
            sub: 'Por liquidar',
            gradient: 'grad-purple',
        },
    ];

    return (
        <div className="resumen-wrapper section-fade">

            {/* Header */}
            <div className="resumen-hero">
                <div className="resumen-hero-top">
                    <div>
                        <p className="resumen-periodo">Estado de Cuenta</p>
                        <h1 className="resumen-mes">{cuenta.mes}</h1>
                    </div>
                    <div className="resumen-hero-actions">
                        <button className="btn-icon-hero" onClick={refrescar} title="Actualizar">
                            <RefreshCw size={18} />
                        </button>
                        <button className="btn-icon-hero" onClick={() => generarEstadoCuenta(socio, cuenta)} title="PDF">
    <FileText size={18} />
</button>
                    </div>
                </div>

                <div className="resumen-saldo-total">
                    <span className="saldo-label">Saldo Pendiente</span>
                    <span className="saldo-monto">S/ {Number(cuenta.saldoPendiente).toFixed(2)}</span>
                </div>
            </div>

            {/* Movimientos */}
            <div className="resumen-section-title">Resumen del Mes</div>

            <div className="movimientos-list">
                {movimientos.map((m, i) => (
                    <div className={`mov-card ${m.gradient}`} key={i}>
                        <div className="mov-card-left">
                            <div className="mov-icon-wrap">
                                {m.icono}
                            </div>
                            <div className="mov-info">
                                <span className="mov-label">{m.label}</span>
                                <span className="mov-sub">{m.sub}</span>
                            </div>
                        </div>
                        <div className="mov-monto">
                            <span>S/</span> {m.monto}
                        </div>
                    </div>
                ))}
            </div>

        </div>
    );
}