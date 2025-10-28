import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

const Header = () => {
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <header className="header">
            <div className="header-container">
                <img src="src\\assets\\original.webp" alt="NaturaCifra Logo" className="logo-image" />

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
    );
};

export default Header;


