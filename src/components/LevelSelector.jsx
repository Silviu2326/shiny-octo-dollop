import { useState } from 'react';
import './LevelSelector.css';

const levels = [
    { id: 0, emoji: '🏠', name: 'Nivel 0', desc: 'La Casa del Gato (Tutorial)', color: '#F3E9C6' },
    { id: 1, emoji: '🐙', name: 'Nivel 1', desc: 'Medusa 0,0', color: '#7EC8E3' },
    { id: 2, emoji: '🍞', name: 'Nivel 2', desc: 'La Tostada (Morena)', color: '#8A5A2B' },
    { id: 3, emoji: '👩', name: 'Nivel 3', desc: 'La Rubia (Catira)', color: '#F2C94C' },
    { id: 4, emoji: '🌾', name: 'Nivel 4', desc: 'Sin Gluten (Sifrina)', color: '#D4AF37' },
    { id: 5, emoji: '🕯️', name: 'Nivel 5', desc: 'La Oscura (Candela)', color: '#8B1E1E' },
    { id: 6, emoji: '🌴', name: 'Nivel 6', desc: 'La Tropical (Guajira)', color: '#2ECC71' },
    { id: 7, emoji: '🎉', name: 'Nivel 7', desc: 'El Final (Fiesta del Gato)', color: '#56CCF2' },
];

export default function LevelSelector({ onSelectLevel }) {
    // Add hover state for interactivity if needed, though CSS :hover is usually enough
    // keeping it simple for now to rely on CSS

    return (
        <div className="level-selector-container animate-fade-in">
            <div className="title-container">
                <h1 className="main-title">🍺 LABERINTO 🍺</h1>
                <p className="subtitle">Selecciona tu nivel</p>
                <div className="title-underline"></div>
            </div>

            <div className="levels-grid">
                {levels.map((level) => (
                    <button
                        key={level.id}
                        className="level-card"
                        style={{ borderLeftColor: level.color }}
                        onClick={() => onSelectLevel(level.id)}
                        aria-label={`Jugar ${level.name}`}
                    >
                        <div className="level-icon-container">
                            <span className="level-emoji">{level.emoji}</span>
                        </div>
                        <div className="level-info">
                            <h3 className="level-name">{level.name}</h3>
                            <span className="level-desc">{level.desc}</span>
                        </div>
                        <div className="level-arrow">
                            ▶
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
