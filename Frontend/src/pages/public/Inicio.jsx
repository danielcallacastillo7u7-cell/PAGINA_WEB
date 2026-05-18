import React from 'react';
import Navbar from '../../components/Navbar';
import Hero from '../../components/Hero';
import Servicios from '../../components/Servicios';
import Galeria from '../../components/Galeria';
import Contacto from '../../components/Contacto';
import Footer from '../../components/Footer';
import './Inicio.css'; // Asegúrate de que este CSS exista

const Inicio = () => {
    return (
        <div className="inicio-container">
            {/* 1. Sección de Bienvenida */}
            <Hero />

            {/* 2. Sección de Servicios de Agua/Pagos */}
            <section id="servicios" className="section-padding">
                <Servicios />
            </section>

            {/* 3. Galería de fotos del lugar/medidores */}
            <section id="galeria" className="section-padding">
                <Galeria />
            </section>

            {/* 4. Formulario de contacto para dudas */}
            <section id="contacto" className="section-padding">
                <Contacto />
            </section>

            {/* 5. Pie de página */}
            <Footer />
        </div>
    );
};

export default Inicio;