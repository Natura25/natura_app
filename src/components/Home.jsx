import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import './home.css';
import './universal.css';

const Home = () => {
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="home" id="inicio">
            {/* Header */}
            <header className="header">
                <div className="header-container">

                    <img src="src\assets\original.webp" alt="NaturaCifra Logo" className="logo-image" />

                    <nav className={`nav ${isMobileMenuOpen ? 'nav-open' : ''}`}>
                        <a href="#inicio" onClick={() => setIsMobileMenuOpen(false)}>Inicio</a>
                        <a href="#productos" onClick={() => setIsMobileMenuOpen(false)}>Productos</a>
                        <a href="#contacto" onClick={() => setIsMobileMenuOpen(false)}>Contáctanos</a>
                    </nav>

                    <div
                        className={`mobile-menu-toggle ${isMobileMenuOpen ? 'active' : ''}`}
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                    <button className="client-access-btn" onClick={() => navigate('/login')}>
                        Acceso cliente
                    </button>
                </div>
            </header>

            {/* Hero Section */}
            <section className="hero">
                <img src="src\assets\home\meeting.webp" alt="Meeting" className="hero-image" />
                <div className="hero-background-square"></div>
                <div className="hero-container">
                    {/* <div className="hero-text-content"> */}
                    <h1>¿Estas buscando lo mejor en ERP?</h1>
                    <p>Impulsa la administración, el desarrollo, y el rendimiento de tu negocio o simplemente a los que le sirve con NaturaCifra.</p>
                    <button className="demo-btn">Probar demo <span className='test'>➜</span></button>
                    {/* </div> */}
                </div>
            </section>

            {/* Feature Section */}
            <section className="feature">
                <div className="feature-container">
                    <div className="feature-divider"></div>
                    <div className="feature-content">
                        <div className="feature-graphic">
                            <img src="src\assets\dash-logos\rentabilidad.webp" alt="rentabilidad" className="feature-image" />
                        </div>
                        <div className="feature-text">
                            <h2>¿Porqué NaturaCifra?</h2>
                            <p>En NaturaCifra comprendemos que la información es un recurso estratégico para la toma de decisiones. Por ello, ofrecemos contenidos claros, didácticos y orientados a la práctica, que permiten a nuestros clientes adquirir una visión más completa sobre los beneficios de nuestros servicios. </p>
                            <p>Nuestro propósito es generar confianza a través del conocimiento, creando un espacio donde cada detalle despierte el interés y motive a profundizar en soluciones que marquen la diferencia. Más que presentar un portafolio, buscamos acompañarle en la comprensión de cada proceso, brindando herramientas que faciliten decisiones seguras y efectivas.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Call to Action Section */}
            <section className="cta">
                <div className="cta-container">
                    <h2>¿Qué nos define?</h2>
                    <div className='valores-logo'>
                        <img src="src\assets\home\1calidad.webp" alt="rentabilidad" className="values-img" />
                        <img src="src\assets\home\1innova.webp" alt="rentabilidad" className="values-img" />
                        <img src="src\assets\home\1integridad.webp" alt="rentabilidad" className="values-img" />
                        <img src="src\assets\home\1teamwork.webp" alt="rentabilidad" className="values-img" />
                        <img src="src\assets\home\respeto.webp" alt="rentabilidad" className="values-img" />

                    </div>
                    <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
                    <div className="cta-buttons">
                        <button className="member-btn">Hazte miembro</button>
                        <button className="try-free-btn">Probar gratis</button>
                    </div>
                </div>
            </section>

            {/* Contact Form Section */}
            <section className="contact" id="contacto">
                <div className="contact-container">
                    <img src="src\assets\home\1teamwork.webp" alt="rentabilidad" className="values-img" />
                    <div className="contact-content">
                        <div className="contact-text">
                            <h2>Contactanos</h2>
                            <p>Contamos con un equipo de servicios al cliente altamente capacitado.</p>
                            <p>Nuestros horarios de servicios son de Lun-Vie desde 9:00am hasta 6:00pm</p>
                        </div>
                    </div>
                    <div className="contact-form">
                        <input type="text" placeholder="Name" />
                        <input type="email" placeholder="Email" />
                        <textarea placeholder="Mensaje"></textarea>
                        <button className="send-btn">Enviar</button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="footer">
                <div className="footer-container">
                    <div className="footer-links">
                        <div className="footer-column">
                            <h4>NaturaCifra</h4>
                            <ul>
                                <li>Link 1</li>
                                <li>Link 2</li>
                                <li>Link 3</li>
                            </ul>
                        </div>
                        <div className="footer-column">
                            <h4>Grupo Natura</h4>
                            <ul>
                                <li>Link 1</li>
                                <li>Link 2</li>
                                <li>Link 3</li>
                                <li>Link 4</li>
                            </ul>
                        </div>
                    </div>
                    <div className="footer-graphic">
                        <div className="logo">
                            <img src="/images/originalfull.png" alt="NaturaCifra Logo" className="logo-image" />
                        </div>
                        <p className="footer-text">© 2025 NaturaCifra</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;
