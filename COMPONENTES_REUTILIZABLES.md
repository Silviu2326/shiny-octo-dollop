# Componentes Reutilizables - Beer Run

## 📋 Resumen Ejecutivo

Este documento identifica todos los componentes, hooks y utilidades que se pueden extraer de los archivos de niveles (Level0.jsx - Level8.jsx) para crear una arquitectura más modular, mantenible y con menos duplicación de código.

**Beneficios de la refactorización:**
- ✅ Reducción de ~70% de código duplicado
- ✅ Mayor facilidad de mantenimiento
- ✅ Corrección de bugs en un solo lugar
- ✅ Agregar nuevos niveles más rápidamente
- ✅ Mejor testing y debugging

---

## 🎮 1. Componentes 3D de Three.js/React-Three-Fiber

### 1.1 `<MazeWalls>` Component
**Ubicación actual:** Repetido en todos los niveles como función `Maze`
**Archivo destino:** `src/components/game/MazeWalls.jsx`

**Descripción:** Renderiza las paredes del laberinto con texturas, dividiendo las paredes en secciones (brick, gold, background).

**Props:**
```typescript
interface MazeWallsProps {
  walls: Wall[];
  textures?: {
    brick?: string;
    gold?: string;
    background?: string;
  };
}

interface Wall {
  x: number;
  z: number;
  length: number;
  height: number;
  thickness: number;
  orientation: 'horizontal' | 'vertical';
}
```

**Características:**
- Usa `mergeBufferGeometries` para optimización
- Divide paredes en background (altura > 2) y foreground (brick + gold)
- Configura texturas con NearestFilter para estilo pixel art
- Uso de `useMemo` para evitar recálculos

**Código común:**
```javascript
// Se repite en Level1.jsx:156, Level2.jsx:~160, Level3.jsx:~120, etc.
function Maze({ walls }) {
  const textureUrls = { brick, gold, background };
  const textures = useLoader(THREE.TextureLoader, textureUrls);
  // ... geometría merge logic
}
```

---

### 1.2 `<GamePlayer>` Component
**Ubicación actual:** Repetido como función `Player` en todos los niveles
**Archivo destino:** `src/components/game/GamePlayer.jsx`

**Descripción:** Renderiza el jugador con sprites animados, maneja movimiento y colisiones.

**Props:**
```typescript
interface GamePlayerProps {
  position: { x: number; z: number };
  direction: { x: number; z: number };
  onPositionUpdate: (x: number, z: number) => void;
  rotation: number;
  isPaused: boolean;
  speed?: number; // default: 4.5
  sprites?: {
    primary: string;
    secondary: string;
  };
}
```

**Características:**
- Animación de sprites con 8 frames
- Lógica de flip horizontal según dirección
- Detección de colisiones integrada
- Control de velocidad configurable

**Código común:**
```javascript
// Level1.jsx:250, Level2.jsx:~280, etc.
function Player({ position, direction, onPositionUpdate, rotation, isPaused }) {
  const [currentFrame, setCurrentFrame] = useState(0);
  useFrame((state, delta) => {
    if (!isPaused && (direction.x !== 0 || direction.z !== 0)) {
      // Movement + animation logic
    }
  });
}
```

---

### 1.3 `<Collectible>` Component
**Ubicación actual:** Repetido en todos los niveles
**Archivo destino:** `src/components/game/Collectible.jsx`

**Descripción:** Renderiza objetos coleccionables (cervezas) con textura.

**Props:**
```typescript
interface CollectibleProps {
  position: { x: number; z: number };
  texture?: string; // default: '/assets/collectible_bottle.png'
  size?: number; // default: 0.6
  height?: number; // default: 0.4
}
```

**Código común:**
```javascript
// Level1.jsx:321, Level2.jsx:~350, etc.
function Collectible({ position }) {
  const texture = useLoader(THREE.TextureLoader, '/assets/collectible_bottle.png');
  // ... render plane con textura
}
```

---

### 1.4 `<GameFloor>` Component
**Ubicación actual:** Repetido como `Floor` en todos los niveles
**Archivo destino:** `src/components/game/GameFloor.jsx`

**Descripción:** Renderiza el suelo del nivel con textura repetida.

**Props:**
```typescript
interface GameFloorProps {
  width?: number; // default: 40
  depth?: number; // default: 45
  texture?: string;
  position?: [number, number, number];
  textureRepeat?: [number, number];
}
```

**Código común:**
```javascript
// Level1.jsx:342, Level2.jsx:~370, etc.
function Floor() {
  const texture = useLoader(THREE.TextureLoader, '/assets/suelos/floor_texture.jpg');
  texture.repeat.set(40/5, 45/5);
  // ... render plane
}
```

---

### 1.5 `<CameraController>` Component
**Ubicación actual:** Repetido en todos los niveles
**Archivo destino:** `src/components/game/CameraController.jsx`

**Descripción:** Controla la posición y seguimiento de la cámara al jugador.

**Props:**
```typescript
interface CameraControllerProps {
  targetX: number;
  targetZ: number;
  rotation: number;
  distance: number;
  height: number;
  smoothness?: number; // default: 0.1
}
```

**Código común:**
```javascript
// Level1.jsx:360, Level2.jsx:~390, etc.
function CameraController({ targetX, targetZ, rotation, distance, height }) {
  useFrame(({ camera }) => {
    camera.position.x += (targetX + offsetX - camera.position.x) * 0.1;
    camera.lookAt(targetX, 0, targetZ);
  });
}
```

---

## 🎯 2. Utilidades de Física y Colisiones

### 2.1 `wallUtils.js`
**Archivo destino:** `src/utils/wallUtils.js`

**Funciones a extraer:**

```javascript
/**
 * Calcula los límites de una pared
 */
export function getWallBounds(wall) {
  const isHorizontal = wall.orientation === 'horizontal';
  // ... retorna { minX, maxX, minZ, maxZ }
}

/**
 * Construye grid espacial para optimización de colisiones
 */
export function buildSpatialGrid(walls, cellSize = 5) {
  const grid = {};
  // ... lógica de particionado espacial
  return grid;
}
```

**Usado en:** Level1.jsx:54-93, Level2.jsx:56-86, Level3.jsx:59-90, etc.

---

### 2.2 `collisionUtils.js`
**Archivo destino:** `src/utils/collisionUtils.js`

**Funciones a extraer:**

```javascript
/**
 * Verifica colisión entre jugador y paredes
 */
export function checkCollision(x, z, spatialGrid, cellSize = 5, playerRadius = 0.3) {
  // ... lógica de colisión con spatial partitioning
  return boolean;
}

/**
 * Verifica colisión simple (sin grid)
 */
export function checkCollisionSimple(x, z, walls, playerRadius = 0.3) {
  // ... lógica de colisión directa
  return boolean;
}
```

**Usado en:** Todos los niveles

---

### 2.3 `collectibleUtils.js`
**Archivo destino:** `src/utils/collectibleUtils.js`

**Funciones a extraer:**

```javascript
/**
 * Genera posiciones aleatorias de coleccionables sin colisiones
 */
export function generateCollectibles(
  count,
  walls,
  options = {
    minX: 1,
    maxX: 22,
    minZ: 1,
    maxZ: 26,
    minDistance: 1
  }
) {
  const collectibles = [];
  // ... lógica de generación
  return collectibles;
}

/**
 * Verifica si el jugador puede recoger un coleccionable
 */
export function canCollect(playerX, playerZ, collectible, radius = 0.5) {
  const dist = Math.sqrt(
    Math.pow(playerX - collectible.x, 2) +
    Math.pow(playerZ - collectible.z, 2)
  );
  return dist < radius;
}
```

**Usado en:** Level1.jsx:129-150, Level2.jsx:~130, Level3.jsx:92-112, etc.

---

## 🎨 3. Componentes de UI/Modales

### 3.1 `<PauseModal>` Component
**Ubicación actual:** Repetido en todos los niveles
**Archivo destino:** `src/components/ui/PauseModal.jsx`

**Descripción:** Modal de pausa con opciones de continuar, reiniciar, silenciar y salir.

**Props:**
```typescript
interface PauseModalProps {
  isOpen: boolean;
  isMuted: boolean;
  onResume: () => void;
  onRestart: () => void;
  onToggleMute: () => void;
  onExit: () => void;
}
```

**Código común:**
```jsx
// Level1.jsx:659-680, Level2.jsx:~680, etc.
{showSettingsModal && (
  <div className="settings-modal">
    <div className="settings-content glass-panel">
      <h2>PAUSA</h2>
      <button onClick={onResume}>Seguir</button>
      <button onClick={onRestart}>Reiniciar</button>
      <button onClick={onToggleMute}>Silenciar</button>
      <button onClick={onExit}>Salir</button>
    </div>
  </div>
)}
```

---

### 3.2 `<VictoryModal>` Component
**Ubicación actual:** Repetido en todos los niveles
**Archivo destino:** `src/components/ui/VictoryModal.jsx`

**Descripción:** Modal de victoria al completar un nivel.

**Props:**
```typescript
interface VictoryModalProps {
  isOpen: boolean;
  score: number;
  onNextLevel: () => void;
  onBackToMenu: () => void;
  isLastLevel?: boolean;
}
```

**Código común:**
```jsx
// Level1.jsx:682-698, Level2.jsx:~700, etc.
{showVictoryModal && (
  <div className="settings-modal victory-modal">
    <div className="settings-content glass-panel">
      <h2>🎉 ¡NIVEL COMPLETADO! 🎉</h2>
      <p>¡Has conseguido {score} puntos!</p>
      <button onClick={onNextLevel}>Siguiente Nivel</button>
      <button onClick={onBackToMenu}>Volver al Menú</button>
    </div>
  </div>
)}
```

---

### 3.3 `<IntroVideo>` Component
**Ubicación actual:** Repetido en varios niveles
**Archivo destino:** `src/components/ui/IntroVideo.jsx`

**Descripción:** Overlay para mostrar video introductorio del nivel.

**Props:**
```typescript
interface IntroVideoProps {
  isShowing: boolean;
  videoSrc: string;
  onSkip: () => void;
  onEnded: () => void;
}
```

**Código común:**
```jsx
// Level1.jsx:701-741, Level0.jsx:~510, etc.
{showIntroVideo && (
  <div className="intro-video-overlay">
    <video src={videoSrc} autoPlay onEnded={onSkip} />
    <button onClick={onSkip}>Saltar</button>
  </div>
)}
```

---

### 3.4 `<GameUI>` Component
**Ubicación actual:** Repetido en todos los niveles
**Archivo destino:** `src/components/ui/GameUI.jsx`

**Descripción:** UI overlay con header y botón de pausa.

**Props:**
```typescript
interface GameUIProps {
  lives: number;
  levelNumber: number;
  beersCollected: number;
  score: number;
  onPause: () => void;
}
```

**Código común:**
```jsx
// Level1.jsx:644-657
<div className="ui-overlay">
  <LevelHeader
    lives={lives}
    levelNumber={levelNumber}
    beersCollected={beersCollected}
    score={score}
  />
  <button className="settings-button" onClick={onPause}>
    <Pause size={24} />
  </button>
</div>
```

---

## 🎣 4. Custom Hooks

### 4.1 `useAudioManager`
**Archivo destino:** `src/hooks/useAudioManager.js`

**Descripción:** Maneja música de fondo y efectos de sonido.

**API:**
```javascript
const {
  isMuted,
  toggleMute,
  playBackgroundMusic,
  stopBackgroundMusic,
  playSound
} = useAudioManager({
  backgroundMusic: '/assets/audio/music_background.mp3',
  volume: 0.4
});
```

**Código común:**
```javascript
// Level1.jsx:388-444, Level2.jsx:~420, etc.
useEffect(() => {
  musicRef.current = new Audio('/assets/audio/music_background.mp3');
  musicRef.current.loop = true;
  musicRef.current.volume = 0.4;
  if (!isMuted) musicRef.current.play();
  return () => musicRef.current?.pause();
}, [showIntroVideo]);

const playCollectSound = () => {
  if (isMuted) return;
  const sfx = new Audio('/assets/audio/sfx_collect.mp3');
  sfx.play();
};
```

---

### 4.2 `useKeyboardControls`
**Archivo destino:** `src/hooks/useKeyboardControls.js`

**Descripción:** Maneja controles de teclado (WASD + Arrows).

**API:**
```javascript
const { direction } = useKeyboardControls({
  enabled: !isPaused && !showTutorial
});
// direction: { x: -1|0|1, z: -1|0|1 }
```

**Código común:**
```javascript
// Level1.jsx:461-511, Level2.jsx:~490, etc.
useEffect(() => {
  const handleKeyDown = (e) => {
    switch (e.key) {
      case 'ArrowUp': case 'w': case 'W':
        setDirection({ x: 0, z: -1 });
        break;
      // ... más casos
    }
  };
  const handleKeyUp = (e) => { /* ... */ };
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
  return () => {
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
  };
}, [direction]);
```

---

### 4.3 `useTouchControls`
**Archivo destino:** `src/hooks/useTouchControls.js`

**Descripción:** Maneja controles táctiles/swipe para móviles.

**API:**
```javascript
const { direction } = useTouchControls({
  enabled: !isPaused && !showTutorial,
  minSwipeDistance: 30
});
```

**Código común:**
```javascript
// Level1.jsx:514-583, Level2.jsx:~540, etc.
useEffect(() => {
  let touchStartX = 0, touchStartY = 0;
  const handleTouchStart = (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  };
  const handleTouchEnd = () => {
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    // ... calcular dirección
  };
  window.addEventListener('touchstart', handleTouchStart);
  // ... más listeners
}, []);
```

---

### 4.4 `useGameState`
**Archivo destino:** `src/hooks/useGameState.js`

**Descripción:** Maneja estado común del juego (pausa, victoria, restart, etc.).

**API:**
```javascript
const {
  isPaused,
  setIsPaused,
  showSettingsModal,
  setShowSettingsModal,
  showVictoryModal,
  setShowVictoryModal,
  showIntroVideo,
  setShowIntroVideo,
  restartLevel
} = useGameState({
  initialPlayerPos: { x: 2, z: 2 },
  initialCollectibles: collectibles,
  onRestart: () => {
    // Custom restart logic
  }
});
```

**Estados comunes:**
```javascript
// Level1.jsx:377-387, Level2.jsx:~410, etc.
const [playerPos, setPlayerPos] = useState({ x: 2, z: 2 });
const [direction, setDirection] = useState({ x: 0, z: 0 });
const [collectibles, setCollectibles] = useState(initialCollectibles);
const [score, setScore] = useState(0);
const [lives, setLives] = useState(3);
const [isPaused, setIsPaused] = useState(false);
const [showSettingsModal, setShowSettingsModal] = useState(false);
const [showVictoryModal, setShowVictoryModal] = useState(false);
const [showIntroVideo, setShowIntroVideo] = useState(true);
const [isMuted, setIsMuted] = useState(false);
```

---

### 4.5 `useCollectibles`
**Archivo destino:** `src/hooks/useCollectibles.js`

**Descripción:** Maneja lógica de recolección de items.

**API:**
```javascript
const {
  collectibles,
  handlePositionUpdate,
  totalCollected
} = useCollectibles({
  initialCollectibles: generateCollectibles(80),
  onCollect: (item) => {
    setScore(s => s + 10);
    playCollectSound();
  },
  collectionRadius: 0.5
});
```

**Código común:**
```javascript
// Level1.jsx:585-600
const handlePositionUpdate = (x, z) => {
  setPlayerPos({ x, z });
  setCollectibles(prev => {
    const remaining = prev.filter(c => {
      const dist = Math.sqrt(Math.pow(x - c.x, 2) + Math.pow(z - c.z, 2));
      if (dist < 0.5) {
        setScore(s => s + 10);
        playCollectSound();
        return false;
      }
      return true;
    });
    return remaining;
  });
};
```

---

## 🎨 5. Estilos CSS Compartidos

### 5.1 `gameModals.css`
**Archivo destino:** `src/styles/gameModals.css`

**Clases comunes:**
```css
.settings-modal { /* Repetido en Level1.css:3, Level2.css:3, etc. */ }
.settings-content { }
.glass-panel { }
.modal-button { }
.restart-button { }
.cancel-button { }
.victory-modal { }
.victory-content { }
.intro-video-overlay { }
```

**Ocurrencias:** ~8 archivos CSS (Level1.css - Level8.css)

---

### 5.2 `gameUI.css`
**Archivo destino:** `src/styles/gameUI.css`

**Clases comunes:**
```css
.game-container { }
.ui-overlay { }
.settings-button { }
.level-header { }
```

---

## 🏗️ 6. Arquitectura de Nivel Base

### 6.1 `<BaseLevel>` Component
**Archivo destino:** `src/components/game/BaseLevel.jsx`

**Descripción:** Componente base que todos los niveles heredan, reduce duplicación masiva.

**Props:**
```typescript
interface BaseLevelProps {
  levelNumber: number;
  walls: Wall[];
  collectiblesCount: number;
  initialPlayerPos?: { x: number; z: number };
  targetScore: number;
  cameraConfig?: CameraConfig;
  textures?: TextureConfig;
  onBack: () => void;
  onNextLevel: () => void;
  onLevelComplete: (levelId: number) => void;
  userId?: string;
  videoSrc?: string;
}
```

**Uso:**
```jsx
// Level1.jsx se reduce a:
import BaseLevel from '../components/game/BaseLevel';
import { walls } from './level1-data';

export default function Level1(props) {
  return (
    <BaseLevel
      {...props}
      levelNumber={1}
      walls={walls}
      collectiblesCount={80}
      targetScore={150}
      videoSrc="/assets/videos/nivel0 coolcat.mp4"
    />
  );
}
```

---

## 📊 7. Análisis de Impacto

### Código Duplicado Actual
| Tipo | Líneas aprox. | Archivos afectados |
|------|---------------|-------------------|
| Componentes 3D | ~400 líneas | 8 niveles |
| Utilidades física | ~200 líneas | 8 niveles |
| Modales UI | ~150 líneas | 8 niveles |
| Controles | ~200 líneas | 8 niveles |
| Estado del juego | ~100 líneas | 8 niveles |
| CSS | ~300 líneas | 8 niveles |
| **TOTAL** | **~1,350 líneas** | **x8 = 10,800 líneas** |

### Después de Refactorización
| Tipo | Líneas aprox. | Archivos |
|------|---------------|----------|
| Componentes compartidos | ~600 líneas | 5-6 archivos |
| Hooks compartidos | ~400 líneas | 5 archivos |
| Utilidades | ~200 líneas | 3 archivos |
| CSS compartido | ~400 líneas | 2 archivos |
| Archivos de nivel (data only) | ~100 líneas c/u | 8 archivos |
| **TOTAL** | **~2,400 líneas** | **vs 10,800 anterior** |

**Reducción:** ~78% de código duplicado eliminado

---

## 🚀 8. Plan de Implementación Sugerido

### Fase 1: Utilidades (Bajo Riesgo)
1. Crear `src/utils/wallUtils.js`
2. Crear `src/utils/collisionUtils.js`
3. Crear `src/utils/collectibleUtils.js`
4. Actualizar 1-2 niveles para usar las utilidades
5. Verificar que funciona correctamente
6. Migrar todos los niveles

### Fase 2: Componentes UI (Medio Riesgo)
1. Crear `src/components/ui/PauseModal.jsx`
2. Crear `src/components/ui/VictoryModal.jsx`
3. Crear `src/components/ui/IntroVideo.jsx`
4. Crear `src/components/ui/GameUI.jsx`
5. Crear `src/styles/gameModals.css`
6. Actualizar niveles uno por uno

### Fase 3: Custom Hooks (Medio Riesgo)
1. Crear `src/hooks/useAudioManager.js`
2. Crear `src/hooks/useKeyboardControls.js`
3. Crear `src/hooks/useTouchControls.js`
4. Crear `src/hooks/useGameState.js`
5. Crear `src/hooks/useCollectibles.js`
6. Migrar niveles gradualmente

### Fase 4: Componentes 3D (Alto Riesgo)
1. Crear `src/components/game/MazeWalls.jsx`
2. Crear `src/components/game/GamePlayer.jsx`
3. Crear `src/components/game/Collectible.jsx`
4. Crear `src/components/game/GameFloor.jsx`
5. Crear `src/components/game/CameraController.jsx`
6. Actualizar niveles cuidadosamente

### Fase 5: BaseLevel Component (Opcional, Alto Impacto)
1. Crear `src/components/game/BaseLevel.jsx`
2. Migrar 1 nivel como prueba
3. Ajustar según problemas encontrados
4. Migrar todos los niveles

---

## ✅ 9. Checklist de Componentes

### Componentes 3D
- [ ] `<MazeWalls>`
- [ ] `<GamePlayer>`
- [ ] `<Collectible>`
- [ ] `<GameFloor>`
- [ ] `<CameraController>`

### Componentes UI
- [ ] `<PauseModal>`
- [ ] `<VictoryModal>`
- [ ] `<IntroVideo>`
- [ ] `<GameUI>`

### Hooks
- [ ] `useAudioManager`
- [ ] `useKeyboardControls`
- [ ] `useTouchControls`
- [ ] `useGameState`
- [ ] `useCollectibles`

### Utilidades
- [ ] `wallUtils.js`
- [ ] `collisionUtils.js`
- [ ] `collectibleUtils.js`

### Estilos
- [ ] `gameModals.css`
- [ ] `gameUI.css`

### Componente Base
- [ ] `<BaseLevel>` (opcional)

---

## 📝 10. Notas Adicionales

### Diferencias entre Niveles a Considerar
- **Configuración de cámara:** Varía ligeramente entre niveles
- **Número de coleccionables:** Diferente en cada nivel
- **Puntuación objetivo:** Varía según nivel
- **Videos introductorios:** No todos los niveles tienen
- **Texturas:** Algunos niveles usan texturas diferentes
- **Tamaño del mapa:** Los walls definen diferentes dimensiones

### Consideraciones de Testing
- Testear cada nivel individualmente después de migración
- Verificar rendimiento (FPS) antes y después
- Comprobar que audio funciona correctamente
- Validar controles en mobile y desktop
- Verificar sistema de guardado de puntuaciones

### Mejoras Adicionales (Bonus)
- Agregar sistema de configuración centralizado
- Crear editor de niveles visual
- Implementar sistema de guardado de progreso más robusto
- Agregar analytics/telemetría de juego
- Sistema de logros/achievements

---

## 🎯 Conclusión

La refactorización propuesta reduciría significativamente la duplicación de código, facilitaría el mantenimiento y aceleraría el desarrollo de nuevos niveles. Se recomienda implementar por fases, comenzando con las utilidades (bajo riesgo) y avanzando gradualmente hacia componentes más complejos.

**Tiempo estimado total:**
- Fase 1: 4-6 horas
- Fase 2: 6-8 horas
- Fase 3: 8-10 horas
- Fase 4: 10-12 horas
- Fase 5: 6-8 horas (opcional)

**Total: 34-44 horas de desarrollo**

**ROI:** Alta - Cada nuevo nivel tomará ~2 horas en lugar de ~8 horas
