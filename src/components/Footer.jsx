const Footer = () => {
    return (
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
    );
};

export default Footer;


