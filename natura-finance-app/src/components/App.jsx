import { useState } from 'react'
import reactLogo from '../assets/react.svg'
import naturaLogo from '../assets/temporal.png'
import './App.css'

function Home() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
          <img src={reactLogo} className="logo react" alt="React logo" />
          <img src={naturaLogo} className="logo" alt="Vite logo" />
      </div>
      <h1><span className='blue'>React</span> + <span className='green'>Natura</span></h1>
      
      {/* <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div> */}
    </>
  )
}

export default Home
