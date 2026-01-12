# Componentes Reutilizables del Juego

Esta carpeta contiene componentes 3D reutilizables para los niveles del juego Beer Run.

## 📦 Componentes Disponibles

### 1. `<GamePlayer>`

Componente del jugador con sprites animados, detección de colisiones y movimiento.

#### Props

| Prop | Tipo | Requerido | Default | Descripción |
|------|------|-----------|---------|-------------|
| `position` | `{ x: number, z: number }` | ✅ | - | Posición actual del jugador |
| `direction` | `{ x: number, z: number }` | ✅ | - | Dirección de movimiento (-1, 0, 1) |
| `onPositionUpdate` | `(x, z) => void` | ✅ | - | Callback cuando cambia la posición |
| `checkCollision` | `(x, z) => boolean` | ✅ | - | Función para verificar colisiones |
| `rotation` | `number` | ✅ | - | Rotación en radianes |
| `isPaused` | `boolean` | ✅ | - | Si el juego está pausado |
| `speed` | `number` | ❌ | `4.5` | Velocidad de movimiento |
| `sprites.primary` | `string` | ❌ | `/assets/personajes/player.png` | Sprite arriba/izquierda |
| `sprites.secondary` | `string` | ❌ | `/assets/personajes/player_secondary.png` | Sprite abajo/derecha |
| `size` | `number` | ❌ | `1.1` | Tamaño del sprite |
| `heightOffset` | `number` | ❌ | `0.5` | Altura sobre el suelo |

#### Ejemplo de Uso

```jsx
import GamePlayer from '../components/game/GamePlayer';

// En tu componente de nivel:
<GamePlayer
  position={playerPos}
  direction={direction}
  onPositionUpdate={handlePositionUpdate}
  checkCollision={checkCollision}
  rotation={1.1}
  isPaused={isPaused}
  speed={4.5}
/>
```

#### Migración desde código existente

**Antes:**
```jsx
// Level1.jsx - función Player duplicada
function Player({ position, direction, onPositionUpdate, walls, rotation, isPaused }) {
  const meshRef = useRef();
  const spritesheet1 = useLoader(THREE.TextureLoader, '/assets/personajes/player.png');
  // ... ~70 líneas de código
}

// En el Canvas:
<Player
  position={playerPos}
  direction={direction}
  onPositionUpdate={handlePositionUpdate}
  walls={walls}
  rotation={playerRotation}
  isPaused={isPaused}
/>
```

**Después:**
```jsx
// Importar componente
import GamePlayer from '../components/game/GamePlayer';

// En el Canvas:
<GamePlayer
  position={playerPos}
  direction={direction}
  onPositionUpdate={handlePositionUpdate}
  checkCollision={checkCollision}  // Pasar la función checkCollision existente
  rotation={playerRotation}
  isPaused={isPaused}
/>
```

---

### 2. `<MazeWalls>`

Componente para renderizar paredes del laberinto con texturas optimizadas.

#### Props

| Prop | Tipo | Requerido | Default | Descripción |
|------|------|-----------|---------|-------------|
| `walls` | `Wall[]` | ✅ | - | Array de objetos de pared |
| `textures.brick` | `string` | ❌ | `/assets/paredes/wall_brick.jpg` | Textura de ladrillo |
| `textures.gold` | `string` | ❌ | `/assets/paredes/wall_gold.png` | Textura dorada superior |
| `textures.background` | `string` | ❌ | `/assets/paredes/wall_background.png` | Textura de fondo |
| `backgroundHeightThreshold` | `number` | ❌ | `2` | Altura mínima para pared de fondo |
| `topSectionRatio` | `number` | ❌ | `0.2` | Proporción de sección dorada (0-1) |

#### Estructura de Wall

```typescript
interface Wall {
  x: number;           // Posición X
  z: number;           // Posición Z
  length: number;      // Longitud de la pared
  height: number;      // Altura de la pared
  thickness: number;   // Grosor de la pared
  orientation: 'horizontal' | 'vertical';  // Orientación
}
```

#### Ejemplo de Uso

```jsx
import MazeWalls from '../components/game/MazeWalls';

// Definir paredes del nivel
const walls = [
  { x: 0, z: 0, length: 24, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  { x: 0, z: 28, length: 24, height: 0.6, thickness: 0.2, orientation: 'horizontal' },
  // ... más paredes
];

// En el Canvas:
<MazeWalls walls={walls} />
```

#### Con texturas personalizadas

```jsx
<MazeWalls
  walls={walls}
  textures={{
    brick: '/assets/custom/brick.jpg',
    gold: '/assets/custom/gold.png',
    background: '/assets/custom/bg.png'
  }}
/>
```

#### Migración desde código existente

**Antes:**
```jsx
// Level1.jsx - función Maze duplicada
function Maze({ walls }) {
  const textureUrls = {
    brick: '/assets/paredes/wall_brick.jpg',
    gold: '/assets/paredes/wall_gold.png',
    background: '/assets/paredes/wall_background.png'
  };

  const brickTexture = useLoader(THREE.TextureLoader, textureUrls.brick);
  // ... ~90 líneas de código con merge de geometrías
}

// En el Canvas:
<Maze walls={walls} />
```

**Después:**
```jsx
// Importar componente
import MazeWalls from '../components/game/MazeWalls';

// En el Canvas:
<MazeWalls walls={walls} />
```

---

## 🔄 Proceso de Migración Completo

### Paso 1: Importar componentes

```jsx
import GamePlayer from '../components/game/GamePlayer';
import MazeWalls from '../components/game/MazeWalls';
```

### Paso 2: Eliminar funciones duplicadas

Elimina las funciones `Player` y `Maze` de tu archivo de nivel (normalmente ~160 líneas de código).

### Paso 3: Actualizar el Canvas

**Antes:**
```jsx
<Canvas camera={{ position: [12, 15, 20], fov: 60 }}>
  <Maze walls={walls} />
  <Player
    position={playerPos}
    direction={direction}
    onPositionUpdate={handlePositionUpdate}
    walls={walls}
    rotation={playerRotation}
    isPaused={isPaused}
  />
  <Floor />
  {/* ... más componentes */}
</Canvas>
```

**Después:**
```jsx
<Canvas camera={{ position: [12, 15, 20], fov: 60 }}>
  <MazeWalls walls={walls} />
  <GamePlayer
    position={playerPos}
    direction={direction}
    onPositionUpdate={handlePositionUpdate}
    checkCollision={checkCollision}
    rotation={playerRotation}
    isPaused={isPaused}
  />
  <Floor />
  {/* ... más componentes */}
</Canvas>
```

### Paso 4: Verificar

- ✅ El jugador se mueve correctamente
- ✅ Las colisiones funcionan
- ✅ Las texturas se ven bien
- ✅ La animación del sprite funciona
- ✅ No hay errores en consola

---

## 📊 Beneficios

### Reducción de código por nivel
- **Antes:** ~160 líneas de componentes duplicados
- **Después:** 2 líneas de imports

### Mantenimiento
- Correcciones de bugs en un solo lugar
- Mejoras de rendimiento benefician todos los niveles
- Fácil agregar features nuevas

### Ejemplo de ahorro

```
8 niveles × 160 líneas = 1,280 líneas duplicadas
Después de migración: ~300 líneas en componentes + 16 líneas en imports
Reducción: ~76% de código
```

---

## 🐛 Troubleshooting

### El jugador no se mueve

**Problema:** No pasaste la función `checkCollision`.

**Solución:**
```jsx
<GamePlayer
  // ... otras props
  checkCollision={checkCollision}  // ← Asegúrate de pasar esto
/>
```

### Las texturas no cargan

**Problema:** Rutas incorrectas de assets.

**Solución:** Verifica que las rutas de texturas existan o pasa rutas personalizadas:
```jsx
<MazeWalls
  walls={walls}
  textures={{
    brick: '/ruta/correcta/brick.jpg',
    // ...
  }}
/>
```

### El jugador parece "congelado"

**Problema:** `isPaused` está en `true` o `direction` es siempre `{0, 0}`.

**Solución:** Verifica tu lógica de controles de teclado/touch.

---

## 🚀 Próximos Pasos

Otros componentes que podrías migrar:
- `<Collectible>` - Items coleccionables
- `<GameFloor>` - Suelo del nivel
- `<CameraController>` - Control de cámara

Consulta el archivo `COMPONENTES_REUTILIZABLES.md` en la raíz del proyecto para más detalles.
