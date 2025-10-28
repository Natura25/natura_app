import './home.css';
import '../styles/normalize.css';
import Layout from './Layout';
import HomeContent from './HomeContent';

const Home = () => {
    return (
        <div className="home" id="inicio">
            <Layout>
                <HomeContent />
            </Layout>
        </div>
    );
};

export default Home;
