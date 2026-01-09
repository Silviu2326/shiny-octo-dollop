import { useState } from 'react'
import './App.css'
import LevelSelector from './components/LevelSelector'
import Level0 from './game/Level0'

function App() {
  const [selectedLevel, setSelectedLevel] = useState(null)

  return (
    <div className="app-container">
      {selectedLevel === null ? (
        <LevelSelector onSelectLevel={setSelectedLevel} />
      ) : selectedLevel === 0 ? (
        <Level0 onBack={() => setSelectedLevel(null)} />
      ) : (
        <div className="glass-panel animate-fade-in" style={{ textAlign: 'center', padding: '3rem', maxWidth: '600px', margin: '2rem auto' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', background: 'var(--gradient-main)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Nivel {selectedLevel}
          </h2>
          <p className="subtitle">Próximamente... estamos portando el juego a la web.</p>
          <button onClick={() => setSelectedLevel(null)}>
            Volver al Menú
          </button>
        </div>
      )}
    </div>
  )
}

export default App
