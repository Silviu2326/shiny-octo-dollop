import React from 'react';
import './LoadingScreen.css';
import { Beer } from 'lucide-react';

const LoadingScreen = () => {
    return (
        <div className="loading-screen">
            <div className="loading-content">
                <div className="loading-spinner-container">
                    <div className="beer-spinner"></div>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                        <Beer size={32} color="#FFD700" />
                    </div>
                </div>

                <h1 className="loading-text">
                    LISTO PARA DISFRUTAR LA EXPERIENCIA CERVECERA DEFINITIVA
                </h1>

                <p className="loading-status">CARGANDO...</p>
            </div>
        </div>
    );
};

export default LoadingScreen;
