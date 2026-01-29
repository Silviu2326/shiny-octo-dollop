import React, { useState, useEffect } from 'react';
import { X, Trophy, Medal, Award } from 'lucide-react';
import { getLeaderboard, getUserBestScore } from '../services/supabase';
import './Ranking.css';

// Traducciones de niveles para el ranking
const LEVELS_TRANSLATIONS = {
  en: [
    { id: 0, name: 'Level 0', desc: 'The Cat House', color: '#F3E9C6' },
    { id: 1, name: 'Level 1', desc: 'Medusa 0,0', color: '#7EC8E3' },
    { id: 2, name: 'Level 2', desc: 'The Toasted One', color: '#8A5A2B' },
    { id: 3, name: 'Level 3', desc: 'The Blonde', color: '#F2C94C' },
    { id: 4, name: 'Level 4', desc: 'Gluten Free', color: '#D4AF37' },
    { id: 5, name: 'Level 5', desc: 'The Dark One', color: '#8B1E1E' },
    { id: 6, name: 'Level 6', desc: 'The Tropical', color: '#2ECC71' },
    { id: 7, name: 'Level 7', desc: 'The Finale', color: '#56CCF2' },
  ],
  es: [
    { id: 0, name: 'Nivel 0', desc: 'La Casa del Gato', color: '#F3E9C6' },
    { id: 1, name: 'Nivel 1', desc: 'Medusa 0,0', color: '#7EC8E3' },
    { id: 2, name: 'Nivel 2', desc: 'La Tostada', color: '#8A5A2B' },
    { id: 3, name: 'Nivel 3', desc: 'La Rubia', color: '#F2C94C' },
    { id: 4, name: 'Nivel 4', desc: 'Sin Gluten', color: '#D4AF37' },
    { id: 5, name: 'Nivel 5', desc: 'La Oscura', color: '#8B1E1E' },
    { id: 6, name: 'Nivel 6', desc: 'La Tropical', color: '#2ECC71' },
    { id: 7, name: 'Nivel 7', desc: 'El Final', color: '#56CCF2' },
  ]
};

// Traducciones de la UI del ranking
const RANKING_UI_TRANSLATIONS = {
  en: {
    title: 'SCORE RANKING',
    loading: 'Loading rankings...',
    yourBestScore: 'Your best score',
    score: 'Score:',
    beers: 'Beers:',
    time: 'Time:',
    globalRanking: 'Global Ranking',
    noScores: 'No scores yet for this level. Be the first!',
    you: '(You)',
    anonymous: 'Anonymous',
    guest: 'Guest',
    pts: 'pts'
  },
  es: {
    title: 'RANKING DE PUNTUACIONES',
    loading: 'Cargando rankings...',
    yourBestScore: 'Tu mejor puntuación',
    score: 'Puntuación:',
    beers: 'Cervezas:',
    time: 'Tiempo:',
    globalRanking: 'Ranking Global',
    noScores: 'Todavía no hay puntuaciones en este nivel. ¡Sé el primero!',
    you: '(Tú)',
    anonymous: 'Anónimo',
    guest: 'Invitado',
    pts: 'pts'
  }
};

const getLevels = (lang) => LEVELS_TRANSLATIONS[lang] || LEVELS_TRANSLATIONS.en;
const getRankingUI = (lang) => RANKING_UI_TRANSLATIONS[lang] || RANKING_UI_TRANSLATIONS.en;

export default function Ranking({ onClose, userId, language = 'en' }) {
  const [selectedLevel, setSelectedLevel] = useState(0);
  const [rankings, setRankings] = useState({});
  const [userScores, setUserScores] = useState({});
  const [loading, setLoading] = useState(true);

  const LEVELS = getLevels(language);
  const uiText = getRankingUI(language);

  useEffect(() => {
    loadAllData();
  }, [userId, language]);

  const loadAllData = async () => {
    setLoading(true);
    const newRankings = {};
    const newUserScores = {};
    const levels = getLevels(language);

    // Cargar datos de todos los niveles
    for (const level of levels) {
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
    if (!id) return uiText.anonymous;
    if (id.startsWith('guest_')) return uiText.guest;
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
          <h2>{uiText.title}</h2>
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
            <div className="loading-message">{uiText.loading}</div>
          ) : (
            <>
              {/* Puntuación del usuario */}
              {currentUserScore && (
                <div className="user-score-section">
                  <h3>{uiText.yourBestScore}</h3>
                  <div className="user-score-card">
                    <div className="score-item">
                      <span className="score-label">{uiText.score}</span>
                      <span className="score-value">{currentUserScore.score}</span>
                    </div>
                    <div className="score-item">
                      <span className="score-label">{uiText.beers}</span>
                      <span className="score-value">{currentUserScore.beers_collected || 0}</span>
                    </div>
                    {currentUserScore.time_seconds > 0 && (
                      <div className="score-item">
                        <span className="score-label">{uiText.time}</span>
                        <span className="score-value">{Math.round(currentUserScore.time_seconds)}s</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Ranking global */}
              <div className="global-ranking-section">
                <h3>{uiText.globalRanking}</h3>
                {currentRanking.length === 0 ? (
                  <div className="no-scores-message">
                    {uiText.noScores}
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
                            {entry.user_id === userId && ` ${uiText.you}`}
                          </span>
                        </div>
                        <div className="score-info">
                          <span className="score-points">{entry.score} {uiText.pts}</span>
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
