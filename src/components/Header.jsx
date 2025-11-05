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
                            onNavigateSection && onNavigateSection('inicio');
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
                            onNavigateSection && onNavigateSection('productos');
                        }}
                    >
                        Productos
                    </a>
                    <a
                        href="#contacto"
                        className={activeSection === 'contacto' ? 'active' : ''}
                        onClick={(e) => {
                            e.preventDefault();
                            setIsMobileMenuOpen(false);
                            onNavigateSection && onNavigateSection('contacto');
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


