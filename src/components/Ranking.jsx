import React, { useState, useEffect } from 'react';
import { X, Trophy, Medal, Award } from 'lucide-react';
import { getLeaderboard, getUserBestScore } from '../services/supabase';
import './Ranking.css';

const LEVELS = [
  { id: 0, name: 'Nivel 0', desc: 'La Casa del Gato', color: '#F3E9C6' },
  { id: 1, name: 'Nivel 1', desc: 'Medusa 0,0', color: '#7EC8E3' },
  { id: 2, name: 'Nivel 2', desc: 'La Tostada', color: '#8A5A2B' },
  { id: 3, name: 'Nivel 3', desc: 'La Rubia', color: '#F2C94C' },
  { id: 4, name: 'Nivel 4', desc: 'Sin Gluten', color: '#D4AF37' },
  { id: 5, name: 'Nivel 5', desc: 'La Oscura', color: '#8B1E1E' },
  { id: 6, name: 'Nivel 6', desc: 'La Tropical', color: '#2ECC71' },
  { id: 7, name: 'Nivel 7', desc: 'El Final', color: '#56CCF2' },
];

export default function Ranking({ onClose, userId }) {
  const [selectedLevel, setSelectedLevel] = useState(0);
  const [rankings, setRankings] = useState({});
  const [userScores, setUserScores] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllData();
  }, [userId]);

  const loadAllData = async () => {
    setLoading(true);
    const newRankings = {};
    const newUserScores = {};

    // Cargar datos de todos los niveles
    for (const level of LEVELS) {
      // Obtener ranking del nivel
      const leaderboardResult = await getLeaderboard(level.id, 10);
      if (leaderboardResult.success) {
        newRankings[level.id] = leaderboardResult.data || [];
      } else {
        newRankings[level.id] = [];
      }

      // Obtener puntuación del usuario en este nivel
      if (userId) {
        const userScoreResult = await getUserBestScore(userId, level.id);
        if (userScoreResult.success && userScoreResult.data) {
          newUserScores[level.id] = userScoreResult.data;
        }
      }
    }

    setRankings(newRankings);
    setUserScores(newUserScores);
    setLoading(false);
  };

  const getRankIcon = (position) => {
    if (position === 0) return <Trophy size={20} color="#FFD700" />;
    if (position === 1) return <Medal size={20} color="#C0C0C0" />;
    if (position === 2) return <Award size={20} color="#CD7F32" />;
    return <span className="rank-number">{position + 1}</span>;
  };

  const formatUserId = (id) => {
    if (!id) return 'Anónimo';
    if (id.startsWith('guest_')) return 'Invitado';
    // Mostrar solo los primeros 8 caracteres si es muy largo
    return id.length > 12 ? id.substring(0, 12) + '...' : id;
  };

  const currentRanking = rankings[selectedLevel] || [];
  const currentUserScore = userScores[selectedLevel];
  const currentLevel = LEVELS[selectedLevel];

  return (
    <div className="ranking-overlay">
      <div className="ranking-container">
        <div className="ranking-header">
          <h2>RANKING DE PUNTUACIONES</h2>
          <button className="close-button" onClick={onClose}>
            <X size={24} color="#ff6b35" />
          </button>
        </div>

        {/* Selector de niveles */}
        <div className="level-tabs">
          {LEVELS.map((level) => (
            <button
              key={level.id}
              className={`level-tab ${selectedLevel === level.id ? 'active' : ''}`}
              style={{
                borderBottomColor: selectedLevel === level.id ? level.color : 'transparent',
              }}
              onClick={() => setSelectedLevel(level.id)}
            >
              <span className="level-tab-name">{level.name}</span>
              <span className="level-tab-desc">{level.desc}</span>
            </button>
          ))}
        </div>

        {/* Contenido del ranking */}
        <div className="ranking-content">
          {loading ? (
            <div className="loading-message">Cargando rankings...</div>
          ) : (
            <>
              {/* Puntuación del usuario */}
              {currentUserScore && (
                <div className="user-score-section">
                  <h3>Tu mejor puntuación</h3>
                  <div className="user-score-card">
                    <div className="score-item">
                      <span className="score-label">Puntuación:</span>
                      <span className="score-value">{currentUserScore.score}</span>
                    </div>
                    <div className="score-item">
                      <span className="score-label">Cervezas:</span>
                      <span className="score-value">{currentUserScore.beers_collected || 0}</span>
                    </div>
                    {currentUserScore.time_seconds > 0 && (
                      <div className="score-item">
                        <span className="score-label">Tiempo:</span>
                        <span className="score-value">{Math.round(currentUserScore.time_seconds)}s</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Ranking global */}
              <div className="global-ranking-section">
                <h3>Ranking Global</h3>
                {currentRanking.length === 0 ? (
                  <div className="no-scores-message">
                    Todavía no hay puntuaciones en este nivel. ¡Sé el primero!
                  </div>
                ) : (
                  <div className="ranking-list">
                    {currentRanking.map((entry, index) => (
                      <div
                        key={index}
                        className={`ranking-entry ${entry.user_id === userId ? 'current-user' : ''}`}
                      >
                        <div className="rank-icon">
                          {getRankIcon(index)}
                        </div>
                        <div className="player-info">
                          <span className="player-name">
                            {formatUserId(entry.user_id)}
                            {entry.user_id === userId && ' (Tú)'}
                          </span>
                        </div>
                        <div className="score-info">
                          <span className="score-points">{entry.score} pts</span>
                          <span className="score-beers">{entry.beers_collected || 0} 🍺</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
