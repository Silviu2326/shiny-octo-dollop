# 🧠 Level 2.5 con IA AVANZADA - Configuración

## ✅ ¡Actualizado! Level 2.5 ahora usa **EnemyAI_Advanced.js**

---

## 🎯 Cambios Implementados

### 1. **Importaciones Nuevas**
```javascript
import EnemyAdvanced from '../components/game/Enemy_Advanced';
import { EnemyCoordinator, AdvancedAIConfig } from './ai/EnemyAI_Advanced';
```

### 2. **Configuración de Dificultad IA**
```javascript
// Líneas 16-21: Configuración optimizada para nivel difícil
AdvancedAIConfig.VISION_ANGLE = Math.PI * 0.85;        // 153° visión
AdvancedAIConfig.HEARING_RADIUS = 14;                   // Buena audición
AdvancedAIConfig.COORDINATION_RADIUS = 18;              // Alta coordinación
AdvancedAIConfig.PLAYER_MEMORY_LENGTH = 35;             // 35 frames de memoria
AdvancedAIConfig.PATTERN_DETECTION_THRESHOLD = 4;       // Detecta patrones rápido
AdvancedAIConfig.PATH_RECALC_INTERVAL = 0.4;           // Recalcula cada 0.4s
```

### 3. **Coordinador de Enemigos**
```javascript
// Líneas 587-592
const coordinatorRef = useRef(null);

useEffect(() => {
  coordinatorRef.current = new EnemyCoordinator();
  console.log('🧠 Level 2.5: Advanced AI Coordinator initialized');
}, []);
```

### 4. **Enemigos con IA Avanzada**
```javascript
// Líneas 994-1015: Uso de EnemyAdvanced
<EnemyAdvanced
  key={enemy.id}
  enemyId={enemy.id}
  position={{ x: enemy.x, z: enemy.z }}
  playerPos={playerPos}
  playerDirection={direction}
  walls={walls}
  onPositionUpdate={(x, z) => handleEnemyPositionUpdate(enemy.id, x, z)}
  checkCollision={checkCollision}
  rotation={playerRotation}
  isPaused={isPaused}
  role={enemy.role}
  assignedZone={enemy.zone}
  doghousePos={doghousePos}
  isReturning={enemy.isReturning}
  spritesheet1Path="/assets/personajes/enemy_type_13.png"
  spritesheet2Path="/assets/personajes/enemy_type_14.png"
  coordinator={coordinatorRef.current}  // ← NUEVO
  debugMode={false}  // Cambiar a true para visualización
/>
```

---

## 🤖 Comportamiento de los 4 Enemigos con IA Avanzada

### 🎯 Enemy 1: CHASER (3s)
**Comportamiento Básico**: Perseguidor agresivo
**Con IA Avanzada**:
- ✅ **Predicción**: Predice tu posición 8 pasos adelante
- ✅ **Memoria**: Recuerda tus últimas 35 posiciones
- ✅ **Persistencia**: Te persigue hasta 30 unidades
- ✅ **Velocidad**: 5.0 (muy rápido)
- ✅ **Línea de visión**: 25 unidades, 153° cono
- ✅ **Pathfinding A***: Encuentra ruta óptima para interceptarte

### ✂️ Enemy 2: CUTTER (6s)
**Comportamiento Básico**: Intercepta tu camino
**Con IA Avanzada**:
- ✅ **Intercepción inteligente**: Calcula punto de corte adelante
- ✅ **Predicción dinámica**: Ajusta intercepción según tu velocidad
- ✅ **Coordinación**: Comparte info con otros enemigos (18 unid radio)
- ✅ **Pathfinding**: Usa A* para atajos que no ves
- ✅ **Detección patrones**: Detecta si usas misma ruta (4 veces)

### 🔄 Enemy 3: TURNER (9s)
**Comportamiento Básico**: Impredecible, gira mucho
**Con IA Avanzada**:
- ✅ **Decisión por utilidad**: Evalúa 8 acciones diferentes cada frame
- ✅ **Cambio táctico**: Alterna entre persecución, emboscada, búsqueda
- ✅ **Memoria espacial**: Recuerda dónde te vio por última vez
- ✅ **Búsqueda inteligente**: Si te pierde, busca en área lógica
- ✅ **Exploración**: 10% de acciones aleatorias (explora nuevas tácticas)

### 🔀 Enemy 4: FLANKER (12s)
**Comportamiento Básico**: Rodea y ataca por los lados
**Con IA Avanzada**:
- ✅ **Coordinación avanzada**: Calcula posiciones de rodeo con otros
- ✅ **Formaciones tácticas**: Se posiciona en círculo alrededor tuyo
- ✅ **Emboscadas coordinadas**: Planea trampas con otros enemigos
- ✅ **Comunicación**: Comparte última posición conocida del jugador
- ✅ **Roles dinámicos**: Cambia entre bloqueador/perseguidor/flanqueador

---

## 🧠 Características de IA Avanzada Activas

### 1. **Sistema de Memoria del Jugador** 📊
```javascript
PlayerMemory {
  positionHistory: [últimas 35 posiciones],
  directionHistory: [direcciones preferidas],
  preferredDirections: { up: 10, down: 5, left: 12, right: 8 },
  averageSpeed: 4.5,
  escapePatterns: [patrones detectados]
}
```

**Efecto**: Los enemigos aprenden tus movimientos y anticipan tu siguiente paso

### 2. **Pathfinding A*** 🗺️
```javascript
AStarPathfinder {
  findPath(start, goal) → [paso1, paso2, ..., objetivo]
  cache: Map de rutas calculadas,
  cacheMaxAge: 2000ms,
  gridSize: 1 unidad
}
```

**Efecto**: Enemigos encuentran el camino más corto, incluso si no lo ves

### 3. **Sistema de Visión Realista** 👁️
```javascript
VisionSystem {
  visionAngle: 153°,  // Muy amplio
  maxDistance: 25,
  hasLineOfSight(enemy, player, walls) → boolean,
  raycast(from, to, walls) → boolean
}
```

**Efecto**: Si te escondes detrás de un muro, ¡te pierden de vista!

### 4. **Coordinación Grupal** 🤝
```javascript
EnemyCoordinator {
  enemies: Map de todos los enemigos,
  sharedMemory: {
    lastKnownPlayerPos: { x, z },
    currentThreatLevel: 0-10
  },
  calculateSurroundPositions(playerPos, enemyCount),
  planAmbush(playerPos, playerDir, enemies)
}
```

**Efecto**: Los 4 enemigos trabajan en equipo para rodearte

### 5. **Toma de Decisiones por Utilidad (Utility AI)** 🎲
```javascript
UtilityAI.evaluateActions({
  CHASE_DIRECT:   utilityChase(context),      // 65
  CHASE_PREDICT:  utilityPredictive(context), // 82 ← MEJOR
  AMBUSH:         utilityAmbush(context),     // 45
  PATROL:         utilityPatrol(context),     // 30
  COORDINATE:     utilityCoordinate(context), // 55
  BLOCK_PATH:     utilityBlockPath(context),  // 70
  SEARCH:         utilitySearch(context),     // 40
  FLEE:           utilityFlee(context)        // 0
})
// Elige: CHASE_PREDICT (mayor utilidad)
```

**Efecto**: Cada frame, el enemigo elige la MEJOR acción posible

---

## 📈 Comparación: IA Básica vs IA Avanzada

| Característica | IA Básica | IA Avanzada Level 2.5 |
|----------------|-----------|------------------------|
| **Navegación** | Intersecciones aleatorias | **A* óptimo + caché** |
| **Persecución** | Va a tu posición actual | **Predice 8 pasos adelante** |
| **Visión** | Omnisciente (siempre te ve) | **Cono 153° + raycasting** |
| **Memoria** | 0 frames | **35 frames guardados** |
| **Coordinación** | Individual | **Grupal con emboscadas** |
| **Decisiones/frame** | 1 modo (scatter/chase) | **8 acciones evaluadas** |
| **Detección patrones** | No | **Sí, después de 4 veces** |
| **Intercepción** | No | **Calcula punto de corte** |
| **Búsqueda** | Aleatoria | **Área lógica basada en memoria** |
| **Aprendizaje** | No | **Sí, adapta estrategia** |

---

## 🎮 Cómo Se Siente la IA Avanzada

### Antes (IA Básica)
```
Jugador corre en círculo → Enemigos siempre atrás
Jugador se esconde → Enemigos lo saben igual
Jugador usa misma ruta → Funciona siempre
Enemigos individuales → Fácil de dividir
```

### Ahora (IA Avanzada)
```
Jugador corre en círculo → Enemigo INTERCEPTA adelante 😱
Jugador se esconde → Enemigo: "¿Dónde fue?" 🤔
Jugador usa misma ruta → En la 4ta vez: ¡EMBOSCADA! 🎯
Enemigos coordinados → TE RODEAN EN FORMACIÓN 🔄
```

---

## 🔥 Acciones de IA que Verás

### 1. **Persecución Predictiva**
```
Tu posición: (10, 15), dirección: derecha
IA piensa: "En 2 segundos estará en (14, 15)"
IA acción: Va directo a (14, 15) por atajo
Resultado: ¡Te intercepta antes de que llegues!
```

### 2. **Emboscada Coordinada**
```
Enemy 1 (CHASER): "Voy de frente"
Enemy 2 (CUTTER): "Bloqueo su salida norte"
Enemy 3 (TURNER): "Me pongo en su camino habitual"
Enemy 4 (FLANKER): "Cierro por detrás"
Resultado: ¡TRAMPA PERFECTA!
```

### 3. **Búsqueda Inteligente**
```
IA pierde línea de visión en (12, 14)
IA analiza: "Última vez iba hacia arriba"
IA predice: "Probablemente está en (12, 10) ahora"
IA acción: Va a buscar a (12, 10) en lugar de aleatoriamente
Resultado: ¡Te encuentra más rápido!
```

### 4. **Detección de Patrones**
```
Turno 1: Usas ruta por esquina superior
Turno 2: Usas misma ruta (IA cuenta: 1)
Turno 3: Usas misma ruta (IA cuenta: 2)
Turno 4: Usas misma ruta (IA cuenta: 3)
Turno 5: IA detecta patrón → ¡EMBOSCADA EN ESQUINA!
Resultado: Te están ESPERANDO ahí
```

---

## 🎯 Indicadores Visuales

### Badge "🧠 Advanced AI"
- **Ubicación**: Superior izquierda (debajo de LevelHeader)
- **Color**: Morado (#9C27B0)
- **Significado**: Los enemigos usan IA avanzada

### Debug Mode (opcional)
```javascript
<EnemyAdvanced
  {...props}
  debugMode={true}  // ← Cambiar a true
/>
```

**Muestra**:
- Cono de visión (amarillo)
- Dirección actual (línea verde)
- Ruta de pathfinding (si aplica)
- Acción actual (texto)

---

## 🔧 Ajustar Dificultad

### Hacer MÁS FÁCIL (para testing)
```javascript
// En la parte superior de Level2_5.jsx (líneas 16-21)
AdvancedAIConfig.VISION_ANGLE = Math.PI * 0.5;  // 90° (menos visión)
AdvancedAIConfig.HEARING_RADIUS = 8;             // Menos audición
AdvancedAIConfig.COORDINATION_RADIUS = 10;       // Menos coordinación
AdvancedAIConfig.PLAYER_MEMORY_LENGTH = 15;      // Menos memoria
AdvancedAIConfig.PATTERN_DETECTION_THRESHOLD = 8; // Detecta patrones más lento
```

### Hacer MÁS DIFÍCIL (modo pesadilla)
```javascript
AdvancedAIConfig.VISION_ANGLE = Math.PI * 1.2;   // 216° (casi 360°)
AdvancedAIConfig.HEARING_RADIUS = 20;             // Audición extrema
AdvancedAIConfig.COORDINATION_RADIUS = 25;        // Coordinación perfecta
AdvancedAIConfig.PLAYER_MEMORY_LENGTH = 50;       // Memoria extendida
AdvancedAIConfig.PATTERN_DETECTION_THRESHOLD = 3; // Detecta patrones MUY rápido
AdvancedAIConfig.PATH_RECALC_INTERVAL = 0.2;     // Recalcula constantemente
```

---

## 📊 Métricas Esperadas

### Dificultad con IA Avanzada
- **Tiempo de supervivencia**: 30-60 segundos (vs 90-120s con IA básica)
- **Tasa de éxito**: 15-20% (vs 35% con IA básica)
- **Muertes promedio**: 4-6 (vs 2-3 con IA básica)
- **Rating**: ⭐⭐⭐⭐⭐ 10/10 dificultad

### Feedback Esperado
- ❌ "Es imposible" → Trabajando como diseñado
- ✅ "Los enemigos son inteligentes!" → Perfecto
- ✅ "Me rodearon perfectamente" → Coordinación funciona
- ✅ "Supieron que iba allí" → Predicción funciona
- ✅ "Me emboscaron en mi ruta" → Memoria funciona

---

## 🐛 Debugging

### Console Logs Automáticos
```
🧠 Level 2.5: Advanced AI Coordinator initialized
🎯 Enemy 1 (CHASER) spawned - Advanced AI
✂️ Enemy 2 (CUTTER) spawned - Advanced AI
🔄 Enemy 3 (TURNER) spawned - Advanced AI
🔀 Enemy 4 (FLANKER) spawned - Advanced AI
🎉 Level 2.5 completed with Advanced AI!
```

### Verificar que Funciona
1. Abre consola del navegador (F12)
2. Busca mensajes con emojis 🧠 🎯 ✂️ 🔄 🔀
3. Si aparecen → IA avanzada está activa
4. Si no aparecen → Revisar importaciones

---

## 💡 Estrategias para Ganar

Con IA avanzada necesitas:

### 1. **Variar Rutas** 🔀
- ❌ NO uses la misma ruta más de 3 veces
- ✅ Cambia de camino constantemente
- ✅ Alterna entre anillos del laberinto

### 2. **Romper Línea de Visión** 👁️
- ✅ Escóndete detrás de muros (¡funciona!)
- ✅ Usa las esquinas para perderlos
- ✅ Si te pierden, cambia dirección inmediatamente

### 3. **Dividir Enemigos** ✂️
- ✅ No permitas que los 4 se coordinen
- ✅ Sepáralos usando pasillos estrechos
- ✅ Trata con 1-2 a la vez máximo

### 4. **Cambios Impredecibles** 🎲
- ✅ Cambia dirección sin patrón
- ✅ Detente y arranca aleatoriamente
- ✅ Usa movimientos erráticos

### 5. **Conoce el Mapa** 🗺️
- ✅ Memoriza 3-4 rutas de escape
- ✅ Identifica callejones sin salida
- ✅ Usa el centro solo cuando sea necesario

---

## 🏆 Conclusión

**Level 2.5 con IA Avanzada** es el **nivel más difícil** hasta ahora:

✅ **Mapa pequeño** (24×28)
✅ **4 Enemigos coordinados**
✅ **IA que aprende y predice**
✅ **Pathfinding óptimo**
✅ **Memoria de 35 frames**
✅ **Detección de patrones**
✅ **Emboscadas coordinadas**
✅ **Visión realista con raycasting**

**Es el desafío perfecto para jugadores experimentados** 🔥

---

**¡Buena suerte, la necesitarás! 🧠🍺👾**

---

## 📞 Soporte Técnico

### Problema: "Los enemigos no se mueven"
**Solución**: Verifica que `Enemy_Advanced.jsx` existe y está importado correctamente

### Problema: "Error: coordinator is not defined"
**Solución**: Verifica línea 587-592, el coordinador debe inicializarse

### Problema: "Performance bajo"
**Solución**:
```javascript
AdvancedAIConfig.PATH_RECALC_INTERVAL = 0.8;  // Recalcula menos frecuente
AdvancedAIConfig.PLAYER_MEMORY_LENGTH = 20;   // Menos memoria
```

### Problema: "Demasiado difícil"
**Solución**: Ajusta configuración (ver sección "Hacer MÁS FÁCIL" arriba)

---

**Versión**: 1.0 con IA Avanzada
**Fecha**: 2026-01-12
**Status**: ✅ Completamente integrado y testeado
