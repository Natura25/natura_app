import './home.css';
import '../styles/normalize.css';
import Header from './Header';
import Footer from './Footer';
import HomeContent from './HomeContent';
import Products from './Products';
import Registro from '../pages/Registro';
import { useState } from 'react';

const Home = () => {
    const [section, setSection] = useState('inicio');

    return (
        <div className="home" id="inicio">
            <Header onNavigateSection={setSection} activeSection={section} />

            {section === 'inicio' && <HomeContent />}
            {section === 'productos' && <Products />}

            <Footer />
        </div>
    );
};

export default Home;
