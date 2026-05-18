import React from 'react';
import { Coffee, Utensils, Beer, ShoppingBag, Calendar, Info } from 'lucide-react';

export function ConsumosTabla({ data }) {
    // Cálculo rápido del total acumulado en consumos
    const totalConsumos = data?.reduce((acc, curr) => acc + (parseFloat(curr.monto) || 0), 0).toFixed(2);

    return (
        <div className="seccion-tabla-container">
            <header className="perfil-header-pagos">
                <div>
                    <h2>Consumos del Mes</h2>
                    <p>Detalle de consumos realizados en restaurante y servicios</p>
                </div>
                <div className="total-badge-consumo">
                    <span>Acumulado:</span>
                    <strong>S/ {totalConsumos}</strong>
                </div>
            </header>

            <div className="alert-info-consumos">
                <Utensils size={18} />
                <span>Los consumos se facturan al cierre de cada semana.</span>
            </div>

            <div className="card-pro tabla-card">
                <div className="table-responsive">
                    <table className="tabla-custom">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Categoría</th>
                                <th>Descripción / Producto</th>
                                <th>Cantidad</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data && data.length > 0 ? (
                                data.map((item, index) => (
                                    <tr key={index}>
                                        <td>{item.fecha}</td>
                                        <td>
                                            <span className="categoria-tag">
                                                {item.categoria === 'Restaurante' ? <Utensils size={12}/> : <ShoppingBag size={12}/>}
                                                {item.categoria || 'Servicio'}
                                            </span>
                                        </td>
                                        <td><strong>{item.producto}</strong></td>
                                        <td>{item.cantidad || 1}</td>
                                        <td className="monto-valor">S/ {parseFloat(item.monto).toFixed(2)}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="sin-datos">No registras consumos este mes.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}