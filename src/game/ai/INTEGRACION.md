# Guía de Integración del Sistema de IA Centralizado

Este documento explica cómo integrar el sistema de IA centralizado en los niveles existentes.

---

## 📦 Archivos Creados

1. **`src/game/ai/EnemyAI.js`** - Sistema de IA completo con todas las funciones
2. **`src/components/game/Enemy.jsx`** - Componente Enemy unificado que usa el sistema de IA

---

## 🚀 Integración Rápida

### Paso 1: Importar en tu nivel

```javascript
import Enemy from '../../components/game/Enemy';
import { AIRoles, createPatrolZones, assignZone } from '../ai/EnemyAI';
```

### Paso 2: Crear zonas de patrulla (opcional pero recomendado)

```javascript
// En el nivel, fuera del componente
const patrolZones = createPatrolZones(32, 38, 2); // 4 zonas (2x2)
```

### Paso 3: Configurar enemigos con roles

```javascript
// En el estado del nivel
const [enemies, setEnemies] = useState([]);

// Al crear enemigos
useEffect(() => {
  const timer1 = setTimeout(() => {
    setEnemies(prev => [
      ...prev,
      {
        id: 1,
        x: doghousePos.x,
        z: doghousePos.z,
        role: AIRoles.CHASER,  // <-- Usar roles del sistema
        zone: assignZone(1, patrolZones),
        isReturning: false
      }
    ]);
  }, 5000);

  return () => clearTimeout(timer1);
}, []);
```

### Paso 4: Renderizar enemigos

```javascript
{enemies.map(enemy => (
  <Enemy
    key={enemy.id}
    enemyId={enemy.id}
    position={{ x: enemy.x, z: enemy.z }}
    playerPos={playerPos}
    playerDirection={direction}
    walls={walls}
    onPositionUpdate={(x, z) => handleEnemyPositionUpdate(enemy.id, x, z)}
    checkCollision={checkCollision}
    isPowerActive={powerActive}
    isPaused={isPaused}
    rotation={1.1}
    role={enemy.role}
    assignedZone={enemy.zone}
    doghousePos={doghousePos}
    isReturning={enemy.isReturning}
    spritesheet1Path="/assets/personajes/enemy_type_1.png"
    spritesheet2Path="/assets/personajes/enemy_type_2.png"
    debugMode={false} // Cambiar a true para ver debug visual
  />
))}
```

### Paso 5: Manejar actualización de posición y colisión con poder

```javascript
const handleEnemyPositionUpdate = (enemyId, x, z) => {
  setEnemies(prev => prev.map(enemy =>
    enemy.id === enemyId ? { ...enemy, x, z } : enemy
  ));
};

// Detectar colisión con jugador
useEffect(() => {
  const interval = setInterval(() => {
    if (isPaused) return;

    setEnemies(prev => prev.map(enemy => {
      const dist = Math.sqrt(
        (playerPos.x - enemy.x) ** 2 +
        (playerPos.z - enemy.z) ** 2
      );

      // Si el jugador toca al enemigo con poder activo
      if (dist < 0.6 && powerActive && !enemy.isReturning) {
        setScore(s => s + 200);
        return { ...enemy, isReturning: true };
      }

      // Si el enemigo regresó a casa
      if (enemy.isReturning) {
        const distToDoghouse = Math.sqrt(
          (enemy.x - doghousePos.x) ** 2 +
          (enemy.z - doghousePos.z) ** 2
        );
        if (distToDoghouse < 0.5) {
          return { ...enemy, isReturning: false };
        }
      }

      return enemy;
    }));
  }, 50);

  return () => clearInterval(interval);
}, [playerPos, powerActive, isPaused]);
```

---

## 📝 Ejemplo Completo: Migrar Level3

### ANTES (Level3.jsx - fragmento)

```javascript
// Enemy component definido dentro del archivo
function Enemy({ position, playerPos, walls, onPositionUpdate, rotation, isPowerActive, isPaused, enemyId }) {
  const meshRef = useRef();
  const spritesheet1 = useLoader(THREE.TextureLoader, '/assets/personajes/enemy_type_11.png');
  const spritesheet2 = useLoader(THREE.TextureLoader, '/assets/personajes/enemy_type_12.png');

  const [currentFrame, setCurrentFrame] = useState(0);
  const [direction, setDirection] = useState({ x: 1, z: 0 });
  const [mode, setMode] = useState('scatter');
  const [modeTimer, setModeTimer] = useState(0);
  const [lastIntersectionPos, setLastIntersectionPos] = useState({ x: -999, z: -999 });

  const timerConfig = useRef({
    scatterDuration: 5 + Math.random() * 3,
    chaseDuration: 5 + Math.random() * 3,
  }).current;

  // ... mucho código de IA ...
}

// Renderizado
{enemies.map(enemy => (
  <Enemy
    key={enemy.id}
    enemyId={enemy.id}
    position={{ x: enemy.x, z: enemy.z }}
    playerPos={playerPos}
    walls={walls}
    onPositionUpdate={(x, z) => handleEnemyPositionUpdate(enemy.id, x, z)}
    rotation={playerRotation}
    isPowerActive={powerActive}
    isPaused={isPaused}
  />
))}
```

### DESPUÉS (Level3.jsx mejorado)

```javascript
import Enemy from '../components/game/Enemy';
import { AIRoles, createPatrolZones, assignZone } from './ai/EnemyAI';

// Crear zonas de patrulla fuera del componente
const patrolZones = createPatrolZones(28, 32, 2);

export default function Level3({ onBack, onNextLevel, onLevelComplete }) {
  // ... resto del estado ...

  const [enemies, setEnemies] = useState([]);

  // Spawn con roles diferenciados
  useEffect(() => {
    const timer1 = setTimeout(() => {
      setEnemies(prev => [
        ...prev,
        {
          id: 1,
          x: doghousePos.x,
          z: doghousePos.z,
          role: AIRoles.CHASER,  // Primer enemigo agresivo
          zone: assignZone(0, patrolZones),
          isReturning: false
        }
      ]);
    }, 5000);

    const timer2 = setTimeout(() => {
      setEnemies(prev => [
        ...prev,
        {
          id: 2,
          x: doghousePos.x,
          z: doghousePos.z,
          role: AIRoles.PATROL,  // Segundo enemigo patrulla
          zone: assignZone(1, patrolZones),
          isReturning: false
        }
      ]);
    }, 10000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  // Renderizado simplificado
  return (
    <Canvas>
      {/* ... resto del canvas ... */}

      {enemies.map(enemy => (
        <Enemy
          key={enemy.id}
          enemyId={enemy.id}
          position={{ x: enemy.x, z: enemy.z }}
          playerPos={playerPos}
          playerDirection={direction}
          walls={walls}
          onPositionUpdate={(x, z) => handleEnemyPositionUpdate(enemy.id, x, z)}
          checkCollision={checkCollision}
          isPowerActive={powerActive}
          isPaused={isPaused}
          rotation={playerRotation}
          role={enemy.role}
          assignedZone={enemy.zone}
          doghousePos={doghousePos}
          isReturning={enemy.isReturning}
          spritesheet1Path="/assets/personajes/enemy_type_11.png"
          spritesheet2Path="/assets/personajes/enemy_type_12.png"
        />
      ))}
    </Canvas>
  );
}
```

**Beneficios:**
- ✅ Código 80% más corto
- ✅ IA mejorada automáticamente
- ✅ Roles diferenciados
- ✅ Zonas de patrulla
- ✅ Más fácil de mantener

---

## 🎮 Configuración de Roles por Nivel

### Level 3 (Introducción - Fácil)
```javascript
const enemyConfigs = [
  { role: AIRoles.PATROL, spawnTime: 5000 },
  { role: AIRoles.NORMAL, spawnTime: 10000 }
];
```

**Objetivo:** Introducir enemigos básicos, predecibles.

---

### Level 5 (Intermedio)
```javascript
const enemyConfigs = [
  { role: AIRoles.STRAIGHT, spawnTime: 4000 },
  { role: AIRoles.TURNER, spawnTime: 8000 },
  { role: AIRoles.CHASER, spawnTime: 15000 }
];
```

**Objetivo:** Variedad de comportamientos, requiere estrategia.

---

### Level 8 (Avanzado)
```javascript
const enemyConfigs = [
  { role: AIRoles.CHASER, spawnTime: 1000 },
  { role: AIRoles.CUTTER, spawnTime: 3000 },
  { role: AIRoles.ROTATOR, spawnTime: 6000 },
  { role: AIRoles.AMBUSHER, spawnTime: 9000 }
];
```

**Objetivo:** Desafío máximo, cada enemigo tiene rol único.

---

## 🔧 Personalización Avanzada

### Crear un rol personalizado

```javascript
// En tu nivel
import { getRoleConfig, AIRoles } from './ai/EnemyAI';

const CUSTOM_ROLE = 'super_fast';

const getCustomRoleConfig = (role) => {
  if (role === CUSTOM_ROLE) {
    return {
      scatterDuration: 2,
      chaseDuration: 10,
      straightBias: 0.9,
      speed: 6.0,  // Muy rápido!
      detectionRadius: 30,
      chaseRadius: 28,
      losePlayerDistance: 35,
      usePrediction: true,
      description: 'Enemigo ultra rápido con detección extendida'
    };
  }
  return getRoleConfig(role); // Fallback a roles estándar
};

// Usar en Enemy
<Enemy
  role={CUSTOM_ROLE}
  // Necesitarías pasar también getCustomRoleConfig si modificas el componente
  {...props}
/>
```

---

## 🐛 Modo Debug

Activa el modo debug para ver la IA en acción:

```javascript
<Enemy
  {...props}
  debugMode={true}
/>
```

**Muestra:**
- 🔴 Círculo de detección según el estado
- 🟡 Línea de dirección actual
- 🎨 Color según estado:
  - Gris: Idle
  - Verde: Patrol
  - Amarillo: Alert
  - Rojo: Chase
  - Azul: Search
  - Morado: Flee
  - Cyan: Return

---

## 📊 Ejemplo: Sistema de Dificultad Progresiva

```javascript
// En el nivel
const [difficulty, setDifficulty] = useState(1);

// Aumentar dificultad cada 30 segundos
useEffect(() => {
  const interval = setInterval(() => {
    setDifficulty(prev => Math.min(3, prev + 0.5));
  }, 30000);

  return () => clearInterval(interval);
}, []);

// Aplicar dificultad a enemigos
const getAdjustedRole = (baseRole, difficultyLevel) => {
  if (difficultyLevel >= 2.5) {
    return AIRoles.CHASER; // Todos se vuelven chasers
  }
  if (difficultyLevel >= 2) {
    return AIRoles.STRAIGHT; // Perseguidores directos
  }
  return baseRole; // Rol base
};

// Al crear enemigos
{
  id: enemyIdRef.current++,
  x: doghousePos.x,
  z: doghousePos.z,
  role: getAdjustedRole(AIRoles.NORMAL, difficulty),
  zone: assignZone(enemyIdRef.current, patrolZones)
}
```

---

## ⚡ Optimizaciones

### 1. Precargar texturas

```javascript
// Al inicio del nivel
import { useLoader } from '@react-three/fiber';

useLoader.preload(THREE.TextureLoader, '/assets/personajes/enemy_type_1.png');
useLoader.preload(THREE.TextureLoader, '/assets/personajes/enemy_type_2.png');
```

### 2. Limitar actualización de enemigos lejanos

El sistema ya incluye culling por distancia (30 unidades), pero puedes ajustarlo:

```javascript
// En EnemyAI.js, modificar la línea:
if (distance > 30 && currentState !== AIStates.RETURN) {
  // Cambiar 30 por tu valor preferido
}
```

### 3. Throttling de pathfinding

Si implementas pathfinding A* en el futuro, ya está preparado:

```javascript
// El sistema recalcula decisiones solo en intersecciones
// No requiere cálculo constante
```

---

## 🎯 Checklist de Migración

Para migrar un nivel existente:

- [ ] Eliminar la función `Enemy` interna del archivo del nivel
- [ ] Importar `Enemy` desde `components/game/Enemy.jsx`
- [ ] Importar `AIRoles, createPatrolZones, assignZone` desde `game/ai/EnemyAI.js`
- [ ] Crear zonas de patrulla: `const zones = createPatrolZones(width, height, 2)`
- [ ] Agregar roles a la configuración de enemigos
- [ ] Asignar zona a cada enemigo: `zone: assignZone(id, zones)`
- [ ] Agregar `playerDirection` al componente Enemy
- [ ] Agregar prop `assignedZone` al componente Enemy
- [ ] Probar que todo funciona correctamente
- [ ] (Opcional) Activar debugMode temporalmente para verificar comportamiento

---

## 📚 Referencia Rápida de Roles

| Rol | Velocidad | Comportamiento | Uso Recomendado |
|-----|-----------|----------------|------------------|
| `NORMAL` | 3.60 | Equilibrado | Niveles iniciales |
| `STRAIGHT` | 4.0 | Persigue directo | Niveles 3-5 |
| `TURNER` | 4.0 | Gira mucho | Niveles 3-5 |
| `FREQUENT` | 4.28 | Cambia de modo | Niveles 3-5 |
| `CHASER` | 5.0 | Muy agresivo | Niveles 5-8 |
| `CUTTER` | 4.28 | Corta camino | Niveles 5-8 |
| `ROTATOR` | 4.28 | Impredecible | Niveles 5-8 |
| `LAZY` | 3.5 | Lento, patrulla | Niveles 5-8 |
| `AMBUSHER` | 4.0 | Embosca | Niveles 8+ |
| `FLANKER` | 4.5 | Flanquea | Niveles 8+ |
| `PATROL` | 3.8 | Zona fija | Todos los niveles |
| `SWARM` | 4.8 | Coordinado | Niveles 8+ |

---

## 💡 Tips

1. **Mezcla de roles:** Usa 2-3 roles diferentes por nivel para variedad
2. **Progresión:** Empieza con NORMAL/PATROL, termina con CHASER/AMBUSHER
3. **Balance:** Alterna enemigos rápidos con lentos
4. **Zonas:** 2x2 zonas para mapas pequeños, 3x3 para mapas grandes
5. **Testing:** Usa debugMode para ajustar comportamiento

---

## 🔄 Próximos Pasos

Una vez migrado:

1. ✅ Todos los niveles usan el mismo sistema
2. ✅ Agregar nuevos roles es trivial (solo en EnemyAI.js)
3. ✅ Mejoras de IA benefician a todos los niveles
4. ✅ Código más limpio y mantenible

**Siguiente:** Implementar pathfinding A* en el sistema centralizado (Fase 3 del plan de mejoras)
