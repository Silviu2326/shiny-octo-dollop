# Mecánicas del Juego - Análisis por Nivel

Este documento detalla las velocidades, comportamientos y configuraciones de jugador y enemigos en cada nivel del juego.

---

## Level 1

### Jugador
- **Velocidad:** 4.5 unidades/segundo
- **Ubicación inicial:** (2, 2)

### Enemigos
- **Cantidad:** 0
- **Comportamiento:** No hay enemigos en este nivel (nivel tutorial)

### Notas
- Nivel introductorio sin enemigos
- 80 coleccionables
- Mapa: 24×28 unidades

---

## Level 2

### Jugador
- **Velocidad:** 4.5 unidades/segundo
- **Ubicación inicial:** (2, 2)

### Enemigos
- **Cantidad:** 2 enemigos
- **Velocidad:** 2.70 unidades/segundo
- **Spawn timing:**
  - Enemigo 1: 5 segundos
  - Enemigo 2: 10 segundos

#### Comportamiento
- **Modo Scatter (Dispersión):** 8-12 segundos (8 + random*4)
  - Movimiento aleatorio por el mapa

- **Modo Chase (Persecución):** 3-5 segundos (3 + random*2)
  - Persigue al jugador cuando está cerca (<8 unidades)
  - Usa pathfinding básico hacia el jugador

- **Distancia de activación:** 20 unidades
- **Pueden cambiar de dirección en intersecciones**

### Notas
- 110 coleccionables
- Mapa: 28×32 unidades
- Efectos visuales especiales (burbujas)

---

## Level 3

### Jugador
- **Velocidad:** 4.5 unidades/segundo
- **Ubicación inicial:** (2, 2)

### Enemigos
- **Cantidad:** 2 enemigos
- **Velocidad normal:** 3.60 unidades/segundo
- **Velocidad con poder activo:** 1.80 unidades/segundo (50% de velocidad)
- **Spawn timing:**
  - Enemigo 1: 5 segundos
  - Enemigo 2: 10 segundos

#### Comportamiento
- **Modo Scatter:** 5-8 segundos (5 + random*3)
  - Movimiento aleatorio

- **Modo Chase:** 5-8 segundos (5 + random*3)
  - Persecución del jugador

- **Distancia de activación:** 20 unidades
- **Sensibilidad al poder:** Se ralentizan al 50%

### Mecánicas Especiales
- **3 Barriles:** Dan tokens para activar poder
- **Poder:** Ralentiza enemigos al 50% durante 6 segundos
- **Bonus especiales:** Aparecen al 30% y 70% de completitud

### Notas
- 140 coleccionables
- Mapa: 28×32 unidades

---

## Level 4

### Jugador
- **Velocidad normal:** 4.5 unidades/segundo
- **Velocidad con poder activo:** 11.25 unidades/segundo (250% de velocidad)
- **Ubicación inicial:** (3, 3)

### Enemigos
- **Cantidad:** 3 enemigos con roles diferentes
- **Velocidad:** 4.28 unidades/segundo
- **Spawn timing y roles:**
  - Enemigo 1 (4s): **Straight** - Prefiere líneas rectas
  - Enemigo 2 (8s): **Turner** - Gira frecuentemente
  - Enemigo 3 (15s): **Frequent** - Cambia de modo rápidamente

#### Roles de Enemigos

##### Role: Straight (Recto)
- **Scatter:** 6-8 segundos
- **Chase:** 5-7 segundos
- **Straight Bias:** 0.7 (70% probabilidad de seguir recto)

##### Role: Turner (Girador)
- **Scatter:** 5-7 segundos
- **Chase:** 6-8 segundos
- **Straight Bias:** 0.2 (20% probabilidad de seguir recto, gira mucho)

##### Role: Frequent (Frecuente)
- **Scatter:** 3-5 segundos
- **Chase:** 3-5 segundos
- **Straight Bias:** 0.5 (50% probabilidad)

- **Distancia de activación:** 25 unidades

### Mecánicas Especiales
- **Poder:** Aumenta velocidad del jugador al 250% durante 6 segundos
- **Trail visual:** Estela dorada cuando el poder está activo
- **3 Barriles** para tokens

### Notas
- 150 coleccionables
- Mapa: 28×34 unidades
- Diseño en zig-zag

---

## Level 5

### Jugador
- **Velocidad:** 0.2 unidades por tick (aprox. 4.5 unidades/segundo a 60fps)
- **Ubicación inicial:** (3, 3)

### Enemigos
- **Cantidad:** 3 enemigos con roles
- **Velocidad:** 4.28 unidades/segundo
- **Spawn timing y roles:**
  - Enemigo 1 (4s): **Straight**
  - Enemigo 2 (8s): **Turner**
  - Enemigo 3 (15s): **Frequent**

#### Comportamiento
- Similar a Level 4 con los mismos roles
- **Efecto especial:** Se aturden cuando el poder está activo (no se mueven si están a <5 unidades del jugador)
- **Distancia de activación:** 25 unidades

### Mecánicas Especiales
- **Poder:** Aturde enemigos cercanos durante 6 segundos
- **3 Barriles** para tokens
- **Cambio de color:** Los enemigos se vuelven azules cuando el poder está activo

### Notas
- 145 coleccionables
- Mapa: 30×34 unidades
- Diseño complejo tipo ciudad

---

## Level 6

### Jugador
- **Velocidad:** 4.5 unidades/segundo
- **Ubicación inicial:** (5, 3)

### Enemigos
- **Cantidad:** 3-4 enemigos
- **Velocidad normal:** 4.95 unidades/segundo
- **Velocidad con poder:** 0.5 unidades/segundo (muy lentos)
- **Velocidad de retorno:** 3.5 unidades/segundo

#### Comportamiento
- **Modo Scatter:** 5-9 segundos (5 + random*4)
- **Modo Chase:** 5-9 segundos (5 + random*4)
- **Distancia de activación:** 30 unidades

### Mecánicas Especiales
- **Sistema de retorno:** Los enemigos vuelven a la caseta cuando son eliminados
- **Poder:** Ralentiza drásticamente a los enemigos
- **Behavior único:** Los enemigos cambian dirección constantemente cuando están aturdidos

### Notas
- 155 coleccionables
- Mapa: 30×36 unidades
- Diseño tipo "Aspa" (cruz)

---

## Level 7

### Jugador
- **Velocidad:** 4.5 unidades/segundo
- **Ubicación inicial:** (15, 5)

### Enemigos
- **Cantidad:** 3-4 enemigos
- **Velocidad normal:** 4.73 unidades/segundo
- **Velocidad con poder:** 2.37 unidades/segundo (50%)
- **Velocidad de retorno:** 3.5 unidades/segundo

#### Comportamiento
- **Modo Scatter:** 6-9 segundos (6 + random*3)
  - Los enemigos intentan alejarse del jugador

- **Modo Chase:** 6-9 segundos (6 + random*3)
  - Persecución activa

- **Distancia de activación:** 30 unidades
- **Sistema de retorno a caseta:** Similar a Level 6

### Mecánicas Especiales
- **Efecto visual de aturdimiento:** Los enemigos parpadean cuando están aturdidos
- **Scatter mejorado:** Los enemigos se alejan estratégicamente del jugador
- **3 Barriles** para tokens

### Notas
- 150 coleccionables
- Mapa: 30×36 unidades
- Diseño con rotondas (roundabouts)

---

## Level 8

### Jugador
- **Velocidad:** 4.5 unidades/segundo
- **Ubicación inicial:** (16, 2)

### Enemigos
- **Cantidad:** 4 enemigos con roles especializados
- **Velocidad:** 4.28 unidades/segundo
- **Spawn timing y roles:**
  - Enemigo 1: **Chaser** (Perseguidor)
  - Enemigo 2: **Cutter** (Cortador)
  - Enemigo 3: **Rotator** (Rotador)
  - Enemigo 4: **Lazy** (Perezoso)

#### Roles de Enemigos

##### Role: Chaser (Perseguidor Agresivo)
- **Scatter:** 4-6 segundos
- **Chase:** 8-10 segundos (¡muy largo!)
- **Straight Bias:** 0.8 (muy directo)
- **Especialidad:** Persigue implacablemente

##### Role: Cutter (Cortador de Caminos)
- **Scatter:** 6-8 segundos
- **Chase:** 4-6 segundos
- **Straight Bias:** 0.3 (gira mucho)
- **Especialidad:** Intenta interceptar

##### Role: Rotator (Rotador Impredecible)
- **Scatter:** 3-5 segundos
- **Chase:** 3-5 segundos
- **Straight Bias:** 0.5
- **Especialidad:** Cambia constantemente de modo

##### Role: Lazy (Perezoso Estratégico)
- **Scatter:** 7-9 segundos (¡muy largo!)
- **Chase:** 3-5 segundos
- **Straight Bias:** 0.6
- **Especialidad:** Patrulla lentamente pero persigue brevemente

- **Distancia de activación:** 25 unidades

### Mecánicas Especiales
- **4 enemigos con IA diferente:** Máxima dificultad
- **Mapa con 6 texturas diferentes:** Complejidad visual
- **3 Barriles** para tokens

### Notas
- 160 coleccionables (máximo del juego)
- Mapa: 32×38 unidades (el más grande)
- Diseño tipo "Grid of Crosses" (rejilla de cruces)

---

## Resumen Comparativo

| Nivel | Vel. Jugador | Vel. Enemigos | Cant. Enemigos | Coleccionables | Tamaño Mapa |
|-------|--------------|---------------|----------------|----------------|-------------|
| 1     | 4.5          | -             | 0              | 80             | 24×28       |
| 2     | 4.5          | 2.70          | 2              | 110            | 28×32       |
| 3     | 4.5          | 3.60          | 2              | 140            | 28×32       |
| 4     | 4.5-11.25*   | 4.28          | 3              | 150            | 28×34       |
| 5     | 4.5          | 4.28          | 3              | 145            | 30×34       |
| 6     | 4.5          | 4.95          | 3-4            | 155            | 30×36       |
| 7     | 4.5          | 4.73          | 3-4            | 150            | 30×36       |
| 8     | 4.5          | 4.28          | 4              | 160            | 32×38       |

*Con poder activo

## Progresión de Dificultad

### Fase 1: Tutorial (Level 1)
- Sin enemigos
- Aprendizaje de controles

### Fase 2: Introducción (Levels 2-3)
- Enemigos lentos (2.70 - 3.60)
- Comportamiento simple
- 2 enemigos

### Fase 3: Desafío (Levels 4-5)
- Enemigos rápidos (4.28)
- Roles diferenciados
- 3 enemigos con IA variada
- Poderes especiales

### Fase 4: Maestría (Levels 6-8)
- Enemigos muy rápidos (4.73 - 4.95)
- Sistemas complejos (retorno, aturdimiento)
- 4 enemigos con IA especializada
- Mapas grandes y complejos

## Notas Técnicas

### Sistema de Física
- **Radio del jugador:** 0.3 unidades
- **Distancia de recolección:** 0.5-0.8 unidades
- **FPS objetivo:** 60 fps
- **Delta time:** Utilizado para movimiento frame-independent

### Modos de IA
- **Scatter:** Los enemigos se dispersan aleatoriamente
- **Chase:** Los enemigos persiguen al jugador
- **Return:** Los enemigos regresan a la caseta (Levels 6-7)
- **Stunned:** Los enemigos están aturdidos (Levels 5-6)

### Pathfinding
- Basado en intersecciones
- Sistema de grid espacial para optimización
- Prevención de reversión (no pueden dar vuelta de 180°)
- Detección de intersecciones con umbral de 1.5 unidades
