// Traducciones compartidas para toda la aplicación

// Traducciones de la UI del juego (modales, botones, etc.)
export const GAME_UI_TRANSLATIONS = {
  en: {
    // Modal de pausa
    pause: 'PAUSE',
    continue: 'Continue',
    restart: 'Restart',
    enableSound: 'Enable Sound',
    muteSound: 'Mute',
    exit: 'Exit',

    // Modal de victoria
    victory: 'VICTORY!',
    levelCompleted: 'Level Completed!',
    baseScore: 'Base Score',
    timeBonus: 'Time Bonus',
    totalScore: 'Total',
    nextLevel: 'Next Level',
    backToMenu: 'Back to Menu',
    playAgain: 'Play Again',

    // Modal de derrota
    gameOver: 'GAME OVER',
    goodTry: 'GOOD TRY!',
    youLost: 'YOU LOST!',
    canAdvance: 'You can advance to the next level',
    outOfLives: 'Out of lives',
    tryAgain: 'Try Again',
    beersCollected: 'Beers collected',
    minimumCompleted: 'Minimum goal completed!',

    // Otros textos comunes
    beers: 'Beers',
    points: 'Points',
    lives: 'Lives',
    time: 'Time',
    level: 'Level',
    tutorial: '(Tutorial)',
    loading: 'Loading...',

    // Estrellas
    stars: 'Stars',

    // Tetris específico
    tetrisChallenge: 'TETRIS CHALLENGE',
    get1000Points: 'Get 1000 points to win',
    score: 'Score',
    lines: 'Lines',
    next: 'Next',
    levelCompleted1000: 'LEVEL COMPLETED!',
    passed1000Points: 'You passed 1000 points!',
    finalScore: 'Final Score',

    // Frogger específico
    beerSpilled: 'The beer has spilled...',
    goalReached: 'GOAL REACHED',
    crossedBarSuccess: 'You crossed the bar successfully. Score:',

    // Wood/Pacman específico
    back: 'Back',
    retry: 'Retry',
    levelComplete: 'LEVEL COMPLETED!',

    // Level8 específico
    gameCompleted: 'GAME COMPLETED!',
    allLevelsCompleted: 'You completed all levels!',
    thanksForPlaying: 'Thanks for playing Beer Run!',
    skip: 'Skip',
    stop: 'Stop',
    play: 'Play',
    unmute: 'Unmute',
    mute: 'Mute',
    superSpeedActivated: 'SUPER SPEED ACTIVATED!',
    pursuerAppeared: 'A pursuer appeared!',
    enemyAppeared: 'An enemy appeared!',
    anotherEnemy: 'Watch out, another enemy!',
    moreDanger: 'More danger!',
    noLives: 'No lives left',

    // Level2_5 específico (IA avanzada)
    advancedEnemiesCaught: 'The smart enemies caught you',
    advancedAIUsed: 'The enemies used advanced AI',
    youScored: 'You scored',
    challengeLevelBeaten: 'You beat the challenge level!',
    defeatedAdvancedAI: 'You defeated the enemies with advanced AI!',
    total: 'Total'
  },
  es: {
    // Modal de pausa
    pause: 'PAUSA',
    continue: 'Seguir',
    restart: 'Reiniciar',
    enableSound: 'Activar Sonido',
    muteSound: 'Silenciar',
    exit: 'Salir',

    // Modal de victoria
    victory: '¡VICTORIA!',
    levelCompleted: '¡Nivel Completado!',
    baseScore: 'Puntuación Base',
    timeBonus: 'Bonus Tiempo',
    totalScore: 'Total',
    nextLevel: 'Siguiente Nivel',
    backToMenu: 'Volver al menú',
    playAgain: 'Jugar de nuevo',

    // Modal de derrota
    gameOver: 'GAME OVER',
    goodTry: '¡BUEN INTENTO!',
    youLost: '¡HAS PERDIDO!',
    canAdvance: 'Puedes avanzar al siguiente nivel',
    outOfLives: 'Se acabaron las vidas',
    tryAgain: 'Reintentar',
    beersCollected: 'Cervezas recogidas',
    minimumCompleted: '¡Objetivo mínimo completado!',

    // Otros textos comunes
    beers: 'Cervezas',
    points: 'Puntos',
    lives: 'Vidas',
    time: 'Tiempo',
    level: 'Nivel',
    tutorial: '(Tutorial)',
    loading: 'Cargando...',

    // Estrellas
    stars: 'Estrellas',

    // Tetris específico
    tetrisChallenge: 'DESAFÍO TETRIS',
    get1000Points: 'Consigue 1000 puntos para ganar',
    score: 'Puntuación',
    lines: 'Líneas',
    next: 'Siguiente',
    levelCompleted1000: '¡NIVEL COMPLETADO!',
    passed1000Points: '¡Has superado los 1000 puntos!',
    finalScore: 'Puntuación final',

    // Frogger específico
    beerSpilled: 'La cerveza se ha derramado...',
    goalReached: 'META ALCANZADA',
    crossedBarSuccess: 'Has cruzado el bar con éxito. Puntuación:',

    // Wood/Pacman específico
    back: 'Volver',
    retry: 'Reintentar',
    levelComplete: '¡NIVEL COMPLETADO!',

    // Level8 específico
    gameCompleted: '¡JUEGO COMPLETADO!',
    allLevelsCompleted: '¡Has completado todos los niveles!',
    thanksForPlaying: '¡Gracias por jugar Beer Run!',
    skip: 'Saltar',
    stop: 'Parar',
    play: 'Reproducir',
    unmute: 'Activar Sonido',
    mute: 'Silenciar',
    superSpeedActivated: '¡SUPER VELOCIDAD ACTIVADA!',
    pursuerAppeared: '¡Apareció un perseguidor!',
    enemyAppeared: '¡Apareció un enemigo!',
    anotherEnemy: '¡Cuidado, otro enemigo!',
    moreDanger: '¡Más peligro!',
    noLives: 'Se acabaron las vidas',

    // Level2_5 específico (IA avanzada)
    advancedEnemiesCaught: 'Los enemigos inteligentes te atraparon',
    advancedAIUsed: 'Los enemigos usaron IA avanzada',
    youScored: 'Has conseguido',
    challengeLevelBeaten: '¡Has superado el nivel desafío!',
    defeatedAdvancedAI: '¡Venciste a los enemigos con IA avanzada!',
    total: 'Total'
  }
};

// Función para obtener traducciones del juego
export const getGameUI = (lang) => GAME_UI_TRANSLATIONS[lang] || GAME_UI_TRANSLATIONS.en;
