import './LevelHeader.css';

const levelConfig = {
  1: { name: "La Casa del Gato", backgroundColor: "#F3E9C6", textColor: "#2C1810", borderColor: "#D4D4C8", totalBeers: 40, image: '/assets/drive-download-20260109T123100Z-1-001/COOL CAT.png' },
  2: { name: "Medusa", backgroundColor: "#7EC8E3", textColor: "#2C1810", borderColor: "#5DA8C3", totalBeers: 55, image: '/assets/drive-download-20260109T123100Z-1-001/MEDUSA.png' },
  3: { name: "Morena", backgroundColor: "#8A5A2B", textColor: "#FFFFFF", borderColor: "#6A3A0B", totalBeers: 60, image: '/assets/drive-download-20260109T123100Z-1-001/morena.png' },
  4: { name: "La Cararera del Ziaagzag", backgroundColor: "#F2C94C", textColor: "#2C1810", borderColor: "#D2A92C", totalBeers: 70, image: '/assets/drive-download-20260109T123100Z-1-001/CATIRA.png' },
  5: { name: " Sifrina", backgroundColor: "#F7F7F7", textColor: "#D4AF37", borderColor: "#D4AF37", totalBeers: 80, image: '/assets/drive-download-20260109T123100Z-1-001/SIFRINA.png' },
  6: { name: "La Oscura", backgroundColor: "#8B1E1E", textColor: "#FFFFFF", borderColor: "#1C1C1C", totalBeers: 85, image: '/assets/drive-download-20260109T123100Z-1-001/CANDELA.png' },
  7: { name: "La Tropical", backgroundColor: "#2ECC71", textColor: "#2C1810", borderColor: "#27AE60", totalBeers: 90, image: '/assets/drive-download-20260109T123100Z-1-001/GUAJIRA.png' },
  8: { name: "Fiesta del Gato", backgroundColor: "#EB5757", textColor: "#FFFFFF", borderColor: "#F2C94C", totalBeers: 100, image: '/assets/drive-download-20260109T123100Z-1-001/BUCK.png' },
};

export default function LevelHeader({
  lives = 3,
  levelName,
  beersCollected = 0,
  totalBeers = 0,
  score = 0,
  levelNumber,
  backgroundColor,
  textColor,
  borderColor
}) {
  const baseConfig = levelConfig[levelNumber] || {
    name: levelName || `Nivel ${levelNumber || ''}`,
    backgroundColor: "#F5F5DC",
    textColor: "#2C1810",
    borderColor: "#D4D4C8",
    totalBeers: totalBeers
  };

  // Prioritize props over hardcoded config (except for totalBeers which is now fixed by config)
  const displayConfig = {
    name: levelName || baseConfig.name,
    backgroundColor: backgroundColor || baseConfig.backgroundColor,
    textColor: textColor || baseConfig.textColor,
    borderColor: borderColor || baseConfig.borderColor,
    totalBeers: baseConfig.totalBeers || totalBeers,
    borderColor: borderColor || baseConfig.borderColor,
    totalBeers: baseConfig.totalBeers || totalBeers,
    image: baseConfig.image
  };

  const displayLevelNumber = levelNumber ? levelNumber - 1 : 0;

  return (
    <div className="level-header-safe-area" style={{ backgroundColor: displayConfig.backgroundColor }}>
      <div className="level-header-banner" style={{
        backgroundColor: displayConfig.backgroundColor,
        borderBottomColor: displayConfig.borderColor
      }}>
        {/* Sección izquierda - Avatar y Vidas */}
        <div className="level-header-section level-header-left">
          <div className="level-header-left-content">
            {displayConfig.image && (
              <img
                src={displayConfig.image}
                alt="Level Icon"
                className="level-header-icon"
              />
            )}
            <div className="level-header-lives-container">
              {[...Array(Math.max(0, lives))].map((_, i) => (
                <img
                  key={i}
                  src="/assets/image-removebg-preview (4) (1).png"
                  alt="vida"
                  className="level-header-life-icon"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Sección central - Nombre del nivel */}
        <div className="level-header-section level-header-center">
          <span
            className={`level-header-subtitle ${displayLevelNumber !== 0 ? 'level-header-subtitle-large' : ''}`}
            style={{ color: displayConfig.textColor }}
          >
            Nivel {displayConfig.name === "La Casa del Gato" && displayLevelNumber === 0 ? "0 (Tutorial)" : displayLevelNumber}
          </span>
          <span className="level-header-name" style={{ color: displayConfig.textColor }}>
            {displayConfig.name}
          </span>
        </div>

        {/* Sección derecha - Botón ajustes y Métricas */}
        <div className="level-header-section level-header-right">
          <div className="level-header-right-content">
            {/* Botón de ajustes */}
            <button className="level-header-settings-button" style={{ borderColor: displayConfig.borderColor }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={displayConfig.textColor} strokeWidth="2">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M12 1v6m0 6v6m6-12h-6m6 6h-6m-6 0h6m-6 6h6"></path>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
            </button>

            {/* Métricas */}
            <div className="level-header-metric" style={{ color: displayConfig.textColor }}>
              Cervezas: {beersCollected}/{displayConfig.totalBeers}
            </div>
            <div className="level-header-metric" style={{ color: displayConfig.textColor }}>
              Puntos: {score}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
