import React, { useState } from 'react';
import { X, Camera, Info, CheckCircle2, Clock, Utensils, ShoppingBag, CreditCard } from 'lucide-react';

// --- COMPONENTE PARA PAGOS (CUOTAS/MANTENIMIENTO) ---
export function HistorialTabla({ titulo, data: inicialData }) {
    const [mostrarModal, setMostrarModal] = useState(false);
    const [tipoServicio, setTipoServicio] = useState('piscina_mensual');
    const [cantidad, setCantidad] = useState(1);
    const [comprobante, setComprobante] = useState(null);
    const [registros, setRegistros] = useState(inicialData || []);

    const TARIFAS = { piscina_mensual: 150, piscina_diario: 2.50, mantenimiento_casa: 160 };
    const total = (TARIFAS[tipoServicio] * cantidad).toFixed(2);

    const procesarPago = () => {
        const nuevo = {
            fecha: new Date().toLocaleDateString(),
            concepto: `${tipoServicio.replace('_', ' ').toUpperCase()} (${cantidad} ${tipoServicio.includes('diario') ? 'día(s)' : 'mes(es)'})`,
            monto: total,
            estado: 'Pendiente'
        };
        setRegistros([nuevo, ...registros]);
        setMostrarModal(false);
        setComprobante(null);
        alert('Comprobante enviado a revisión.');
    };

    return (
        <div className="seccion-tabla-container animate-fadeIn">
            <header className="perfil-header-pagos">
                <div><h2>{titulo}</h2><p>Historial de cuotas y servicios fijos</p></div>
                <button className="btn-nuevo-pago" onClick={() => setMostrarModal(true)}>Registrar Transferencia</button>
            </header>

            <div className="card-pro tabla-card">
                <table className="tabla-custom">
                    <thead><tr><th>Fecha</th><th>Concepto</th><th>Monto</th><th>Estado</th></tr></thead>
                    <tbody>
                        {registros.length > 0 ? registros.map((item, i) => (
                            <tr key={i}>
                                <td>{item.fecha}</td>
                                <td>{item.concepto}</td>
                                <td className="monto-valor">S/ {parseFloat(item.monto).toFixed(2)}</td>
                                <td><span className={`badge-pago ${item.estado?.toLowerCase()}`}>{item.estado}</span></td>
                            </tr>
                        )) : <tr><td colSpan="4" className="sin-datos">No hay pagos registrados.</td></tr>}
                    </tbody>
                </table>
            </div>

            {mostrarModal && (
                <div className="modal-overlay">
                    <div className="modal-content-pago">
                        <div className="modal-header"><h3>Subir Voucher</h3><button onClick={() => setMostrarModal(false)}><X size={20}/></button></div>
                        <div className="modal-body">
                            <label>Seleccione Servicio:</label>
                            <select className="select-custom" onChange={(e) => setTipoServicio(e.target.value)}>
                                <option value="piscina_mensual">Piscina Mensual (S/ 150)</option>
                                <option value="piscina_diario">Piscina Diario (S/ 2.50)</option>
                                <option value="mantenimiento_casa">Mantenimiento Casa (S/ 160)</option>
                            </select>
                            <label>Meses/Días a pagar:</label>
                            <input type="number" min="1" value={cantidad} onChange={(e) => setCantidad(e.target.value)} className="input-cantidad" />
                            <div className="total-previo">Monto a pagar: <strong>S/ {total}</strong></div>
                            <label className="upload-box">
                                {comprobante ? <img src={comprobante} className="preview-voucher" /> : <><Camera size={30}/><span>Adjuntar Imagen</span></>}
                                <input type="file" hidden onChange={(e) => setComprobante(URL.createObjectURL(e.target.files[0]))} />
                            </label>
                        </div>
                        <button className="btn-confirmar-pago" disabled={!comprobante} onClick={procesarPago}>Confirmar Pago</button>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- COMPONENTE PARA CONSUMOS (RESTAURANTE/BAR) ---
export function ConsumosTabla({ data, alPagar }) {
    const totalConsumos = data?.reduce((acc, curr) => acc + (parseFloat(curr.monto) || 0), 0).toFixed(2);

    return (
        <div className="seccion-tabla-container animate-fadeIn">
            <header className="perfil-header-pagos">
                <div><h2>Consumos del Mes</h2><p>Detalle de consumos por liquidar</p></div>
                <div className="total-badge-consumo">
                    <span>Deuda Total:</span>
                    <strong>S/ {totalConsumos}</strong>
                </div>
            </header>

            <div className="card-pro tabla-card">
                <table className="tabla-custom">
                    <thead><tr><th>Fecha</th><th>Categoría</th><th>Producto</th><th>Cant.</th><th>Subtotal</th></tr></thead>
                    <tbody>
                        {data.length > 0 ? data.map((item, i) => (
                            <tr key={i}>
                                <td>{item.fecha}</td>
                                <td><span className="categoria-tag">{item.categoria === 'Restaurante' ? <Utensils size={12}/> : <ShoppingBag size={12}/>} {item.categoria}</span></td>
                                <td><strong>{item.producto}</strong></td>
                                <td>{item.cantidad || 1}</td>
                                <td className="monto-valor">S/ {parseFloat(item.monto).toFixed(2)}</td>
                            </tr>
                        )) : <tr><td colSpan="5" className="sin-datos">No hay consumos pendientes.</td></tr>}
                    </tbody>
                </table>
            </div>

            {totalConsumos > 0 && (
                <div className="footer-accion-consumos">
                    <button className="btn-liquidar" onClick={alPagar}>
                        <CreditCard size={18} /> Registrar Pago de Consumos
                    </button>
                </div>
            )}
        </div>
    );
}