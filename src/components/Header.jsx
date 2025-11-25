import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

const Header = ({ onNavigateSection, activeSection }) => {
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <header className="header">
            <div className="header-container">
                <img src="src\\assets\\original.webp" alt="NaturaCifra Logo" className="logo-image" />

                <nav className={`nav ${isMobileMenuOpen ? 'nav-open' : ''}`}>
                    <a
                        href="#inicio"
                        className={activeSection === 'inicio' ? 'active' : ''}
                        onClick={(e) => {
                            e.preventDefault();
                            setIsMobileMenuOpen(false);
                            // Set section to 'inicio'
                            if (activeSection !== 'inicio') {
                                onNavigateSection && onNavigateSection('inicio');
                            }
                            // Scroll to top of inicio section
                            setTimeout(() => {
                                const inicioElement = document.getElementById('inicio');
                                if (inicioElement) {
                                    inicioElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                } else {
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }
                            }, activeSection !== 'inicio' ? 150 : 50);
                        }}
                    >
                        Inicio
                    </a>
                    <a
                        href="#productos"
                        className={activeSection === 'productos' ? 'active' : ''}
                        onClick={(e) => {
                            e.preventDefault();
                            setIsMobileMenuOpen(false);
                            // Set section to 'productos'
                            if (activeSection !== 'productos') {
                                onNavigateSection && onNavigateSection('productos');
                            }
                            // Scroll to top of productos section
                            setTimeout(() => {
                                const productosElement = document.getElementById('productos');
                                if (productosElement) {
                                    productosElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }
                            }, activeSection !== 'productos' ? 150 : 50);
                        }}
                    >
                        Productos
                    </a>
                    <a
                        href="#contacto"
                        className={activeSection === 'contacto' || activeSection === 'inicio' ? 'active' : ''}
                        onClick={(e) => {
                            e.preventDefault();
                            setIsMobileMenuOpen(false);
                            // Set section to 'inicio' since contact form is in HomeContent
                            if (activeSection !== 'inicio') {
                                onNavigateSection && onNavigateSection('inicio');
                            }
                            // Scroll to contact form after a short delay to ensure DOM is updated
                            setTimeout(() => {
                                const contactElement = document.getElementById('contacto');
                                if (contactElement) {
                                    contactElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }
                            }, activeSection !== 'inicio' ? 150 : 50);
                        }}
                    >
                        Contáctanos
                    </a>
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
    );
};

export default Header;


