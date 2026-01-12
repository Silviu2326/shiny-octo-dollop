# 🌊 Level 2.5 - "Medusa Oscura" (Nivel Desafío)

## 📋 Resumen

**Level 2.5** es un nivel desafío intermedio entre Level 2 y Level 3, diseñado para ser **MUCHO MÁS DIFÍCIL** que el Level 2 original.

---

## 🎯 Características Principales

### 📐 Tamaño del Mapa
- **Dimensiones**: 24×28 (vs 28×32 del Level 2)
- **Reducción**: ~25% más pequeño que Level 2
- **Resultado**: Menos espacio para maniobrar = mayor dificultad

### 🧱 Diseño del Laberinto

#### Estructura en Anillos Concéntricos
1. **Anillo Exterior** (más espacioso)
   - Pocas salidas
   - Pasillos principales

2. **Segundo Anillo** (más cerrado)
   - Conexiones limitadas
   - Giros estratégicos

3. **Tercer Anillo** (muy estrecho)
   - Pasillos apretados
   - Difícil de esquivar enemigos

4. **Centro** (laberinto complejo)
   - Múltiples obstáculos pequeños
   - Trampas estrechas
   - Grid de paredes entrecruzadas

#### Obstáculos Estratégicos
- **12 obstáculos adicionales** colocados en puntos clave
- **Trampas estrechas** en el centro (1.5 unidades)
- Pasillos que obligan a cambios de dirección frecuentes

---

## 👾 Enemigos (4 en total)

### Composición del Escuadrón

| # | Rol | Spawn | Características |
|---|-----|-------|-----------------|
| 1 | **CHASER** | 3s | Perseguidor agresivo y rápido |
| 2 | **CUTTER** | 6s | Intercepta tu camino adelante |
| 3 | **TURNER** | 9s | Impredecible, cambia dirección |
| 4 | **FLANKER** | 12s | Rodea y ataca por los lados |

### Estrategia de Enemigos
- Aparecen **escalonadamente** (cada 3 segundos)
- Roles **complementarios** que te acorralan
- Centro del mapa como **casa base** (12, 14)

---

## 📊 Comparación con Level 2

| Característica | Level 2 | Level 2.5 |
|----------------|---------|-----------|
| **Tamaño** | 28×32 (896) | 24×28 (672) |
| **Enemigos** | 2 | 4 |
| **Complejidad** | Media | Alta |
| **Cervezas** | 55 | 60 |
| **Espacio Libre** | ~40% | ~30% |
| **Dificultad** | 6/10 | **9/10** |

---

## 🎮 Mecánicas de Juego

### Igual que Level 2
✅ Colisión con enemigos = pierde vida
✅ 3 vidas totales
✅ 3 segundos de invulnerabilidad
✅ Recoger cervezas = 10 puntos
✅ Completar nivel = recoger todas las cervezas

### Cambios Específicos
- **Caseta enemiga** en el centro (antes esquina)
- **Cámara más cercana** (distance: 6.5 vs 7)
- **FOV ligeramente mayor** (65 vs 60) para compensar mapa pequeño

---

## 🎨 Temática Visual

### Estilo "Medusa Oscura"
- Mismo tema acuático que Level 2
- Colores más oscuros e intensos
- 70 burbujas flotantes (vs 80 del Level 2)
- Texturas reutilizadas:
  - Suelo: `floor_texture_3.png`
  - Paredes: `wall_stone.jpg`
  - Enemigos: `enemy_type_13/14.png`
  - Coleccionables: `collectible_medusa.png`

---

## 🗺️ Layout del Mapa (ASCII)

```
████████████████████████
█  ┌─────────┐ ┌──────┐█
█  │ ┌─────┐ │ │ ┌──┐ │█
█  │ │ ╔═╗ │ │ │ ║  ║ │█
█  │ │ ║🏠║ │ │ │ ║  ║ │█  🏠 = Casa enemigos (centro)
█  │ │ ╚═╝ │ │ │ ║  ║ │█
█  │ └─────┘ │ │ └──┘ │█
█  └─────────┘ └──────┘█
████████████████████████

Leyenda:
█ = Paredes exteriores
─│┌┐└┘ = Anillos exteriores
═║╔╗╚╝ = Centro complejo
🏠 = Doghouse (spawn enemigos)
```

---

## 🎯 Estrategias para Ganar

### 1. **Divide y Conquista**
- No permitas que los 4 enemigos te rodeen
- Usa las paredes para separarlos

### 2. **Conoce el Centro**
- Es peligroso pero tiene muchas cervezas
- Memoriza las salidas de emergencia

### 3. **Timing de Spawn**
- Primeros 3s: Solo 1 enemigo (más fácil)
- 3-12s: Aprovecha para recoger máximo
- Después de 12s: Modo supervivencia

### 4. **Usa los Anillos**
- Anillo exterior: Más seguro, menos cervezas
- Centro: Más peligroso, más cervezas
- Alterna según cantidad de enemigos

### 5. **Invulnerabilidad Táctica**
- Usa los 3s de invulnerabilidad para atravesar zonas peligrosas
- No desperdicies la invulnerabilidad en zonas seguras

---

## 🔧 Integración en el Juego

### Para añadirlo al menú de niveles:

```javascript
// En tu selector de niveles (ej: App.jsx o GameMenu.jsx)
import Level2_5 from './game/Level2_5';

// Añadir a la lista de niveles
const levels = [
  Level1,
  Level2,
  Level2_5,  // ← NUEVO NIVEL DESAFÍO
  Level3,
  Level4,
  // ...
];

// O como nivel opcional/secreto
<button onClick={() => setCurrentLevel('2.5')}>
  🌊 Nivel Secreto: Medusa Oscura
</button>
```

---

## 🏆 Condiciones de Victoria

- **Recoger 60 cervezas** (100% del nivel)
- Al completar, desbloquea el siguiente nivel
- `onLevelComplete(2.5)` se llama al terminar

---

## 📱 Controles

### Teclado
- **W/↑**: Arriba
- **S/↓**: Abajo
- **A/←**: Izquierda
- **D/→**: Derecha

### Pantalla Táctil
- **D-Pad** en la esquina inferior izquierda

### Menú
- **Botón PAUSA** en esquina superior derecha
  - Seguir
  - Reiniciar
  - Silenciar/Activar
  - Salir

---

## 🎵 Audio

### Música
- **Fondo**: `music_medusa.wav` (loop)
- **Volumen**: 0.3 (30%)

### Efectos de Sonido
- **Recoger cerveza**: `sfx_collect.mp3`
- **Perder vida**: `sfx_lose_life.mp3`
- **Game Over**: `sfx_game_over.mp3`

---

## 🎬 Video Intro

- Reutiliza: `/assets/videos/NIVEL 1 FINAL.mp4`
- Se puede saltar haciendo clic
- Botón "Saltar" en esquina inferior derecha

---

## 🐛 Testing Checklist

Antes de publicar, verifica:

- [ ] Todos los muros colisionan correctamente
- [ ] Los 4 enemigos aparecen en orden
- [ ] Las cervezas se generan en posiciones válidas
- [ ] No hay cervezas dentro de paredes
- [ ] La cámara sigue al jugador suavemente
- [ ] La invulnerabilidad funciona (3s)
- [ ] El contador de vidas es correcto
- [ ] La música hace loop correctamente
- [ ] Los SFX se reproducen
- [ ] El modal de victoria aparece al 100%
- [ ] El botón "Siguiente Nivel" funciona
- [ ] Responsive en móviles

---

## 🔮 Ideas para Mejorar

### Futuras Mejoras
1. **Power-ups** en el centro (recompensa por riesgo)
2. **Límite de tiempo** (60 segundos) para más presión
3. **Modo nightmare**: 6 enemigos
4. **Leaderboard** de mejores tiempos
5. **Enemigos más inteligentes** (usar `EnemyAI_Advanced.js`)

### Variantes
- **Speed Run Mode**: Completar lo más rápido posible
- **Survival Mode**: Aguantar el máximo tiempo
- **No Damage Run**: Sin perder ninguna vida

---

## 📈 Métricas Esperadas

### Dificultad
- **Tiempo promedio**: 3-5 minutos
- **Tasa de éxito**: 30-40% (muy difícil)
- **Muertes promedio**: 2-3 antes de ganar
- **Rating**: ⭐⭐⭐⭐⭐ (5/5 dificultad)

### Comparación
- **Level 2**: 70% tasa éxito
- **Level 2.5**: 35% tasa éxito ← **50% más difícil**
- **Level 3**: 50% tasa éxito

---

## 🎓 Curva de Aprendizaje

```
Dificultad
    ↑
 10 │                    ┌──── Level 2.5
    │                   /│
  8 │                 /  │
    │               /    │
  6 │       ┌────/       │
    │      /│            │
  4 │    /  │            │
    │  /    │            │
  2 │/      │            │
    └──────────────────────→ Tiempo
   L1    L2    L2.5    L3
```

---

## 💡 Tips para Jugadores

1. **"El centro es una trampa"** - Solo entra con plan de salida
2. **"Los enemigos spawn juntos"** - Usa los primeros 9s sabiamente
3. **"Las esquinas son seguras"** - Pero tienen pocas cervezas
4. **"No corras en pánico"** - Caminar controlado > correr sin rumbo
5. **"Memoriza 2-3 rutas"** - Alterna para confundir enemigos

---

## 🎮 Conclusión

**Level 2.5 "Medusa Oscura"** es el **nivel desafío perfecto** entre 2 y 3:

✅ **Más pequeño** = Más claustrofóbico
✅ **4 Enemigos** = Presión constante
✅ **Laberinto complejo** = Difícil navegación
✅ **Misma temática** = Consistencia visual
✅ **Opcional** = No bloquea progresión

Es ideal para jugadores que buscan un **reto extra** después de dominar el Level 2.

---

**¡Buena suerte, la vas a necesitar! 🍺🌊👾**

---

## 📞 Soporte

Si encuentras bugs:
1. Revisa la consola del navegador (F12)
2. Verifica rutas de assets
3. Confirma que todos los imports son correctos
4. Testea en modo desarrollador primero

**Archivo**: `Level2_5.jsx` + `Level2_5.css`
**Versión**: 1.0
**Tipo**: Nivel Desafío / Intermedio
**Recomendado**: Después de completar Level 2
