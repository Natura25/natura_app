import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import './home.css';

const Home = () => {
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="home">
            {/* Header */}
            <header className="header">
                <div className="header-container">
                    <div className="logo">
                        <img src="/images/originalfull.png" alt="NaturaCifra Logo" className="logo-image" />
                    </div>
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
                <div className="hero-container">
                    <div className="hero-content">
                        <h1>¿Estas buscando lo mejor en ERP?</h1>
                        <p>Impulsa la administración, el desarrollo, y el rendimiento de tu negocio - o simplemente a los que le sirve con NaturaCifra.</p>
                        <button className="demo-btn">Demo gratis</button>
                    </div>
                    <div className="hero-graphics">
                        <div className="gear-large">⚙️</div>
                        <div className="gear-small">⚙️</div>
                    </div>
                </div>
            </section>

            {/* Feature Section */}
            <section className="feature">
                <div className="feature-container">
                    <div className="feature-divider"></div>
                    <div className="feature-content">
                        <div className="feature-graphic">
                            <div className="gear-feature">⚙️</div>
                        </div>
                        <div className="feature-text">
                            <h2>What is Lorem Ipsum?</h2>
                            <p>Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.</p>
                            <p>It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Call to Action Section */}
            <section className="cta">
                <div className="cta-container">
                    <h2>Heading</h2>
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
                    <div className="contact-content">
                        <div className="contact-graphic">
                            <div className="gear-contact">⚙️</div>
                        </div>
                        <div className="contact-text">
                            <h2>Contactanos</h2>
                            <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
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
                            <ul>
                                <li>• Something</li>
                                <li>• Something</li>
                                <li>• Something</li>
                                <li>• Something</li>
                                <li>• Something</li>
                                <li>• Something</li>
                            </ul>
                        </div>
                        <div className="footer-column">
                            <ul>
                                <li>• Something</li>
                                <li>• Something</li>
                                <li>• Something</li>
                                <li>• Something</li>
                                <li>• Something</li>
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
