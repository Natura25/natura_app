const HomeContent = () => {
    return (
        <>
            {/* Hero Section */}
            <section className="hero">
                <img src="src\\assets\\home\\meeting.webp" alt="Meeting" className="hero-image" />
                <div className="hero-background-square"></div>
                <div className="hero-container">
                    <h1>¿Estas buscando lo mejor en ERP?</h1>
                    <p>Impulsa la administración, el desarrollo, y el rendimiento de tu negocio o simplemente a los que le sirve con NaturaCifra.</p>
                    <button className="demo-btn">Probar demo <span className='test'>➜</span></button>
                </div>
            </section>

            {/* Feature Section */}
            <section className="feature-home">
                <div className="feature-container">
                    <div className="feature-divider"></div>
                    <div className="feature-content">
                        <div className="feature-graphic">
                            <img src="src\\assets\\home\\results.webp" alt="rentabilidad" className="feature-image" />
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
                    <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
                    <div className="cta-buttons">
                        <button className="member-btn">Hazte miembro</button>
                        <button className="try-free-btn">Probar gratis</button>
                    </div>
                </div>
            </section>

            <section className="core-values">
                <div className="values-container">
                    <h2>¿Qué nos define?</h2>
                    <div className='valores-logo'>
                        <div className="value-pict-container">
                            <img src="src\\assets\\home\\1calidad.webp" alt="rentabilidad" className="values-img" />
                            <p>Calidad</p>
                        </div>

                        <div className="value-pict-container">
                            <img src="src\\assets\\home\\1integridad.webp" alt="rentabilidad" className="values-img" />
                            <p>Integridad</p>
                        </div>

                        <div className="value-pict-container">
                            <img src="src\\assets\\home\\1innova.webp" alt="rentabilidad" className="values-img" />
                            <p>Innovación</p>
                        </div>

                        <div className="value-pict-container">
                            <img src="src\\assets\\home\\1teamwork.webp" alt="rentabilidad" className="values-img" />
                            <p>Compañerismo</p>
                        </div>

                        <div className="value-pict-container">
                            <img src="src\\assets\\home\\respeto.webp" alt="rentabilidad" className="values-img" />
                            <p>Respeto</p>
                        </div>

                    </div>
                </div>
            </section>

            {/* Contact Form Section */}
            <section className="contact" id="contacto">
                <div className="contact-container">
                    <img src="src\\assets\\home\\meeting2.webp" alt="rentabilidad" className="contact-pict" />
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
                        <textarea placeholder="Mensaje" ></textarea>
                        <button className="send-btn">Enviar</button>
                    </div>
                </div>
            </section>
        </>
    );
};

export default HomeContent;


