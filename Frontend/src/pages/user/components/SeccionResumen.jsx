import { FileText, Coins } from 'lucide-react';
import { useState } from 'react';

export function SeccionResumen({ cuenta, refrescar }) {
    const [mostrarPago, setMostrarPago] = useState(false);
    const [mensajePago, setMensajePago] = useState(''); // Movido aquí

    const handleExito = () => {
        setMensajePago("¡Pago informado con éxito!");
        setMostrarPago(false);
        refrescar();
        setTimeout(() => setMensajePago(''), 5000);
    };

    if (!cuenta) return <div className="sin-datos">No hay información de cuenta.</div>;

    return (
        <div className="section-fade">
            <div className="dashboard-header">
                <h2>Estado de Cuenta — {cuenta.mes}</h2>
                <button className="btn-pdf" onClick={() => window.print()}><FileText size={18} /> PDF</button>
            </div>

            <div className="resumen-cards">
                <div className="resumen-card azul"><p>Consumos</p><h3>S/ {Number(cuenta.consumosMes).toFixed(2)}</h3></div>
                <div className="resumen-card naranja"><p>Fijos</p><h3>S/ {Number(cuenta.cargosFijos).toFixed(2)}</h3></div>
                <div className="resumen-card gris"><p>Pagos</p><h3>S/ {Number(cuenta.pagosRealizados).toFixed(2)}</h3></div>
                <div className="resumen-card rojo"><p>Saldo</p><h3>S/ {Number(cuenta.saldoPendiente).toFixed(2)}</h3></div>
            </div>

            <div className="pago-section">
                {mensajePago && <div className="alerta-pago">{mensajePago}</div>}
                <button className="btn-pagar" onClick={() => setMostrarPago(!mostrarPago)}>
                    <Coins size={20} /> {mostrarPago ? 'Cancelar' : 'Informar Pago'}
                </button>
                {mostrarPago && (
                    <div className="form-pago-container">
                        <button className="btn-enviar-pago" onClick={handleExito}>Confirmar Pago</button>
                    </div>
                )}
            </div>
        </div>
    );
}