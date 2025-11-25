import React from "react";
import "./products.css";

function SectionHeading({ title, subtitle }) {
  return (
    <header className="products__heading">
      <h2 className="products__title">{title}</h2>
      {subtitle ? <p className="products__subtitle">{subtitle}</p> : null}
    </header>
  );
}

function FeatureCard({ title, items, isPopular }) {
  return (
    <article className="feature">
      {isPopular && <span className="feature__badge">Most popular</span>}
      <h3 className="feature__title">{title}</h3>
      <ul className="feature__list">
        {items.map((text, idx) => (
          <li key={idx}>{text}</li>
        ))}
      </ul>
      <div className="feature__cta">
        <button type="button" className="btn">Más info</button>
      </div>
    </article>
  );
}

function TestimonialCard({ name, quote }) {
  return (
    <article className="testimonial">
      <div className="testimonial__header">
        <span aria-hidden className="testimonial__avatar" />
        <strong>{name}</strong>
      </div>
      <p className="testimonial__quote">{quote}</p>
    </article>
  );
}

function FaqItem({ q, a }) {
  return (
    <details className="faq__item">
      <summary className="faq__summary">{q}</summary>
      <p className="faq__answer">{a}</p>
    </details>
  );
}

export default function Products() {
  return (
    <main className="products" id="productos">
      {/* Hero / Intro */}
      <section className="products__hero">
        <img
          src="/src/assets/home/results.webp"
          alt="Natura pieza"
          className="products__hero-img"
        />
        <div className="products__hero-background-square"></div>
        <div className="products__hero-container">
          <SectionHeading
            title="Productos y servicios"
            subtitle="Soluciones ligeras y potentes para administrar, analizar y mejorar tu operación. Integraciones simples, seguridad de nivel empresarial y soporte cercano."
          />
        </div>
      </section>

      <p className="products__intro-text">
        Desde el primer día obtienes visibilidad, control y datos precisos.
        Configuración guiada y lista en minutos para empezar a generar valor.
      </p>

      {/* Feature cards */}
      <section className="products__features">
        <FeatureCard
          title="Inventario y costos"
          items={[
            "Control de stock en tiempo real",
            "Valorización y costos por lote",
            "Alertas y reposiciones",
            "Reportes listos para exportar",
          ]}
        />
        <FeatureCard
          title="Finanzas y reportes"
          items={[
            "Conciliaciones simples",
            "Tableros de rentabilidad",
            "Flujos de caja y presupuestos",
            "Impuestos automatizados",
          ]}
          isPopular={true}
        />
        <FeatureCard
          title="Ventas y clientes"
          items={[
            "Pedidos y facturación",
            "CRM ligero",
            "Seguimiento de oportunidades",
            "Integraciones con tu web",
          ]}
        />
      </section>

      {/* Social proof */}
      <section className="products__social">
        <h3 className="products__social-title">¿Qué se dice de NaturaCifra?</h3>
        <div className="products__testimonials">
          <TestimonialCard
            name="Nickname"
            quote="La visibilidad que obtuvimos en inventarios nos ahorró horas cada semana."
          />
          <TestimonialCard
            name="Nickname"
            quote="Los reportes de costos y márgenes nos ayudaron a priorizar productos."
          />
          <TestimonialCard
            name="Nickname"
            quote="La implementación fue rapidísima y el soporte siempre atento."
          />
        </div>
      </section>

      {/* Video/CTA block */}
      <section className="products__cta">
        <div className="products__cta-media">
          <img
            src="/images/natura.png"
            alt="Video cover"
            className="products__cta-img"
          />
          <button type="button" className="products__play" aria-label="Reproducir demo" />
        </div>
      </section>

      {/* FAQ */}
      <section className="products__faq">
        <h3 className="products__faq-title">FAQ</h3>
        <div style={{ marginTop: 8 }}>
          <FaqItem
            q="¿Cuánto tarda la implementación?"
            a="Normalmente menos de una hora. Te guiamos durante todo el proceso."
          />
          <FaqItem q="¿Puedo exportar mis datos?" a="Sí, en CSV/Excel en un clic." />
          <FaqItem
            q="¿Tienen plan para equipos pequeños?"
            a="Contamos con planes flexibles que escalan con tu operación."
          />
        </div>
      </section>
    </main>
  );
}



