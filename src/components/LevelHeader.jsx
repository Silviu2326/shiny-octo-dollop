import './LevelHeader.css';

const levelConfig = {
  1: { name: "La Casa del Gato", backgroundColor: "#F3E9C6", textColor: "#2C1810", borderColor: "#D4D4C8", totalBeers: 40, image: '/assets/drive-download-20260109T123100Z-1-001/COOL CAT.png' },
  2: { name: "Medusa", backgroundColor: "#7EC8E3", textColor: "#2C1810", borderColor: "#5DA8C3", totalBeers: 110, image: '/assets/drive-download-20260109T123100Z-1-001/MEDUSA.png' },
  3: { name: "Morena", backgroundColor: "#8A5A2B", textColor: "#FFFFFF", borderColor: "#6A3A0B", totalBeers: 140, image: '/assets/drive-download-20260109T123100Z-1-001/morena.png' },
  4: { name: "La Cararera del Ziaagzag", backgroundColor: "#F2C94C", textColor: "#2C1810", borderColor: "#D2A92C", totalBeers: 150, image: '/assets/drive-download-20260109T123100Z-1-001/CATIRA.png' },
  5: { name: " Sifrina", backgroundColor: "#F7F7F7", textColor: "#D4AF37", borderColor: "#D4AF37", totalBeers: 145, image: '/assets/drive-download-20260109T123100Z-1-001/SIFRINA.png' },
  6: { name: "La Oscura", backgroundColor: "#8B1E1E", textColor: "#FFFFFF", borderColor: "#1C1C1C", totalBeers: 155, image: '/assets/drive-download-20260109T123100Z-1-001/CANDELA.png' },
  7: { name: "La Tropical", backgroundColor: "#2ECC71", textColor: "#2C1810", borderColor: "#27AE60", totalBeers: 150, image: '/assets/drive-download-20260109T123100Z-1-001/GUAJIRA.png' },
  8: { name: "Fiesta del Gato", backgroundColor: "#EB5757", textColor: "#FFFFFF", borderColor: "#F2C94C", totalBeers: 160, image: '/assets/drive-download-20260109T123100Z-1-001/BUCK.png' },
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
        {/* Sección izquierda - Vidas */}
        {/* Sección izquierda - Imagen del nivel */}
        <div className="level-header-section">
          {displayConfig.image && (
            <img
              src={displayConfig.image}
              alt="Level Icon"
              className="level-header-icon"
            />
          )}
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

        {/* Sección derecha - Métricas */}
        <div className="level-header-section level-header-right">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginRight: -10 }}>
            <div className="level-header-lives-container" style={{ marginBottom: '-8px' }}>
              {[...Array(Math.max(0, lives))].map((_, i) => (
                <img
                  key={i}
                  src="/assets/image-removebg-preview (4) (1).png"
                  alt="vida"
                  className="level-header-life-icon"
                />
              ))}
            </div>
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
