import { useNavigate } from 'react-router-dom';
import './home.css';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="home">
      <h1>Welcome to Natura Finance Dashboard</h1>
      <p>This is the home page component.</p>

      <button onClick={() => navigate('/login')}>
        {1 ? 'Logout' : 'Login'}
      </button>
    </div>
  );
};

export default Home;
