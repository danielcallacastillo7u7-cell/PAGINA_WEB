import SocioDetalle from "./SocioDetalle";
import { useEffect, useState } from "react";

function Socios() {
    const [socioSeleccionado, setSocioSeleccionado] = useState(null);

    const [socios, setSocios] = useState([]);
    const [cargando, setCargando] = useState(true);

    async function cargarSocios() {
        try {
            const respuesta = await fetch(
                "http://localhost:3000/api/admin/socios"
            );

            const datos = await respuesta.json();

            setSocios(datos);
        } catch (error) {
            console.error(error);
        } finally {
            setCargando(false);
        }
    }

    useEffect(() => {
        cargarSocios();
    }, []);

    if (socioSeleccionado) {
        return (
            <SocioDetalle
                socio={socioSeleccionado}
                volver={() => setSocioSeleccionado(null)}
            />
        );
    }
    return (
        <>
            <header className="admin-header">
                <div>
                    <span>Panel del Jefe</span>
                    <h1>Socios registrados</h1>
                    <p>Listado general de socios del club.</p>
                </div>

                <button onClick={cargarSocios}>
                    Actualizar
                </button>
            </header>

            <section className="panel-box">

                <table className="tabla-dashboard">

                    <thead>

                        <tr>

                            <th>ID</th>

                            <th>Nombre</th>

                            <th>Correo</th>

                            <th>Rol</th>

                            <th>Estado</th>

                            <th>Acciones</th>

                        </tr>

                    </thead>

                    <tbody>

                        {cargando ? (

                            <tr>
                                <td colSpan="6">
                                    Cargando...
                                </td>
                            </tr>

                        ) : socios.length === 0 ? (

                            <tr>
                                <td colSpan="6">
                                    No existen socios
                                </td>
                            </tr>

                        ) : (

                            socios.map((socio) => (

                                <tr key={socio.id}>

                                    <td>{socio.id}</td>

                                    <td>{socio.nombre}</td>

                                    <td>{socio.correo}</td>

                                    <td>{socio.rol}</td>

                                    <td>

                                        {socio.estado ? (
                                            <span className="activo">Activo</span>
                                        ) : (
                                            <span className="inactivo">Inactivo</span>
                                        )}

                                    </td>

                                    <td>

                                        <button
                                            onClick={() => setSocioSeleccionado(socio)}
                                        >
                                            Ver
                                        </button>

                                    </td>
                                </tr>

                            ))

                        )}

                    </tbody>

                </table>

            </section>
        </>
    );
}

export default Socios;