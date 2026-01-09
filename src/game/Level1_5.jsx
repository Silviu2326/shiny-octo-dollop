import React, { useEffect } from 'react';
import './Level0.css';

export default function Level1_5({ onBack }) {
    useEffect(() => {
        // Redirigir automáticamente después de 2 segundos
        const timer = setTimeout(() => {
            window.location.href = 'https://shiny-octo-dollop-one.vercel.app/';
        }, 2000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="game-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="glass-panel animate-fade-in" style={{ textAlign: 'center', padding: '3rem', maxWidth: '600px' }}>
                <h2 style={{
                    fontSize: '2.5rem',
                    marginBottom: '2rem',
                    background: 'var(--gradient-main)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    🍺 Nivel 1.5 🍺
                </h2>

                <p className="subtitle" style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>
                    Redirigiendo al juego completo...
                </p>

                <a
                    href="https://shiny-octo-dollop-one.vercel.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        display: 'inline-block',
                        padding: '1rem 2rem',
                        marginBottom: '1rem',
                        background: 'var(--gradient-main)',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '8px',
                        fontWeight: 'bold',
                        fontSize: '1.1rem'
                    }}
                >
                    Ir al Juego Completo
                </a>

                <div style={{ marginTop: '2rem' }}>
                    <button onClick={onBack}>
                        Volver al Menú
                    </button>
                </div>
            </div>
        </div>
    );
}
