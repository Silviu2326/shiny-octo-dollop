# Sonidos por Nivel

Este documento detalla todos los archivos de audio utilizados en cada nivel del juego.

---

## Level 0 (Tutorial/Intro)

### 🎵 Música de Fondo
- **`music_background.mp3`**
  - Volumen: 0.3
  - Loop: Sí

### 🔊 Efectos de Sonido
- **`sfx_collect.mp3`**
  - Uso: Al recolectar cervezas/coleccionables
  - Volumen: 0.6

### 📝 Notas
- Nivel introductorio
- Sin enemigos, solo efectos de recolección

---

## Level 1

### 🎵 Música de Fondo
- **`music_background.mp3`**
  - Volumen: 0.3
  - Loop: Sí

### 🔊 Efectos de Sonido
- **`sfx_collect.mp3`**
  - Uso: Al recolectar cervezas
  - Volumen: 0.6

### 📝 Notas
- Mismo tema musical que Level 0
- Solo sonido de recolección (sin enemigos)

---

## Level 2

### 🎵 Música de Fondo
- **`music_medusa.wav`**
  - Volumen: 0.3
  - Loop: Sí
  - **Nota:** Tema exclusivo de este nivel

### 🔊 Efectos de Sonido
- **`sfx_collect.mp3`**
  - Uso: Al recolectar cervezas
  - Volumen: 0.6

- **`sfx_lose_life.mp3`**
  - Uso: Cuando el jugador pierde una vida
  - Volumen: 0.6

- **`sfx_game_over.mp3`**
  - Uso: Cuando se acaban todas las vidas
  - Volumen: 0.6

### 📝 Notas
- Primer nivel con enemigos
- Primer nivel con música única (Medusa)
- Introduce sonidos de daño y game over

---

## Level 3

### 🎵 Música de Fondo
- **`music_funky.wav`**
  - Volumen: 0.3
  - Loop: Sí

### 🔊 Efectos de Sonido
- **`sfx_collect.mp3`**
  - Uso: Al recolectar cervezas
  - Volumen: 0.6

- **`sfx_barrel.mp3`**
  - Uso: Al recolectar barriles (tokens de poder)
  - Volumen: 0.6
  - **Nota:** Efecto exclusivo para barriles

- **`sfx_lose_life.mp3`**
  - Uso: Cuando el jugador pierde una vida
  - Volumen: 0.6

- **`sfx_game_over.mp3`**
  - Uso: Cuando se acaban todas las vidas
  - Volumen: 0.6

### 📝 Notas
- Introduce música "funky" que se usa en niveles posteriores
- Primer nivel con sonido especial de barril
- Sistema completo de audio (música + 4 efectos)

---

## Level 4

### 🎵 Música de Fondo
- **SIN MÚSICA IMPLEMENTADA** ⚠️

### 🔊 Efectos de Sonido
- **SIN EFECTOS DE SONIDO IMPLEMENTADOS** ⚠️

### 📝 Notas
- Este nivel no tiene audio implementado
- Es el único nivel sin sonidos
- Posible pendiente de implementación

---

## Level 5

### 🎵 Música de Fondo
- **`music_funky.wav`**
  - Volumen: 0.3
  - Loop: Sí

### 🔊 Efectos de Sonido
- **`sfx_collect.mp3`**
  - Uso: Al recolectar cervezas y barriles
  - Volumen: 0.6

- **`sfx_lose_life.mp3`**
  - Uso: Cuando el jugador pierde una vida
  - Volumen: 0.6

### 📝 Notas
- Usa la misma música funky que Level 3
- Sistema de audio simplificado (sin game over dedicado)
- Nivel urbano/ciudad

---

## Level 6

### 🎵 Música de Fondo
- **`music_funky.wav`**
  - Volumen: 0.3
  - Loop: Sí

### 🔊 Efectos de Sonido
- **`sfx_collect.mp3`**
  - Uso: Al recolectar cervezas
  - Volumen: 0.6

- **`sfx_lose_life.mp3`**
  - Uso: Cuando el jugador pierde una vida
  - Volumen: 0.6

### 📝 Notas
- Continúa con tema funky
- Sistema de retorno de enemigos a caseta
- Audio simplificado

---

## Level 7

### 🎵 Música de Fondo
- **`music_funky.wav`**
  - Volumen: 0.3
  - Loop: Sí

### 🔊 Efectos de Sonido
- **`sfx_collect.mp3`**
  - Uso: Al recolectar cervezas
  - Volumen: 0.6

- **`sfx_lose_life.mp3`**
  - Uso: Cuando el jugador pierde una vida
  - Volumen: 0.6

### 📝 Notas
- Mismo esquema de audio que Level 6
- Diseño con rotondas
- Audio consistente

---

## Level 8

### 🎵 Música de Fondo
- **`music_funky.wav`**
  - Volumen: 0.3
  - Loop: Sí

### 🔊 Efectos de Sonido
- **`sfx_collect.mp3`**
  - Uso: Al recolectar cervezas
  - Volumen: 0.6

- **`sfx_lose_life.mp3`**
  - Uso: Cuando el jugador pierde una vida
  - Volumen: 0.6

### 📝 Notas
- Nivel final con 4 enemigos
- Mantiene el tema funky
- Sistema de audio estándar

---

## Resumen de Archivos de Audio

### 🎵 Música

| Archivo | Niveles que lo usan | Descripción |
|---------|---------------------|-------------|
| `music_background.mp3` | 0, 1 | Música de introducción/tutorial |
| `music_medusa.wav` | 2 | Tema exclusivo de Level 2 |
| `music_funky.wav` | 3, 5, 6, 7, 8 | Tema principal del juego (mayoría de niveles) |

### 🔊 Efectos de Sonido

| Archivo | Niveles que lo usan | Descripción |
|---------|---------------------|-------------|
| `sfx_collect.mp3` | 0, 1, 2, 3, 5, 6, 7, 8 | Sonido al recolectar items (universal) |
| `sfx_barrel.mp3` | 3 | Sonido exclusivo al recolectar barriles |
| `sfx_lose_life.mp3` | 2, 3, 5, 6, 7, 8 | Sonido al perder una vida |
| `sfx_game_over.mp3` | 2, 3 | Sonido de game over (solo primeros niveles) |

---

## Configuración de Audio

### Volúmenes Estándar
- **Música de fondo:** 0.3 (30%)
- **Efectos de sonido:** 0.6 (60%)

### Controles
- ✅ Todos los niveles tienen botón de mute/unmute
- ✅ El audio se pausa cuando se pausa el juego
- ✅ Sistema de reproducción con manejo de errores (try-catch)

### Características Técnicas
- **Formato musical:** WAV y MP3
- **Formato SFX:** MP3
- **Loop automático:** Solo para música de fondo
- **Gestión de memoria:** Los sonidos se limpian al salir del nivel

---

## Estadísticas

### Por Tipo de Audio

| Categoría | Cantidad Total |
|-----------|----------------|
| Temas musicales únicos | 3 |
| Efectos de sonido únicos | 4 |
| Total archivos de audio | 7 |

### Por Nivel

| Nivel | Música | SFX | Total Archivos |
|-------|--------|-----|----------------|
| 0 | 1 | 1 | 2 |
| 1 | 1 | 1 | 2 |
| 2 | 1 | 3 | 4 |
| 3 | 1 | 4 | 5 ⭐ |
| 4 | 0 ⚠️ | 0 ⚠️ | 0 |
| 5 | 1 | 2 | 3 |
| 6 | 1 | 2 | 3 |
| 7 | 1 | 2 | 3 |
| 8 | 1 | 2 | 3 |

⭐ **Level 3 tiene la mayor cantidad de efectos de sonido**
⚠️ **Level 4 no tiene audio implementado**

---

## Progresión de Audio

### Fase Tutorial (Levels 0-1)
- Música tranquila de fondo
- Solo sonido de recolección
- Introducción suave

### Fase Inicial (Level 2)
- Cambio a música Medusa (más dinámica)
- Introduce sonidos de combate
- Sistema completo de feedback

### Fase Media (Level 3)
- Música Funky (más energética)
- Sonido especial de barriles
- Audio más rico y variado

### Fase Desafío (Level 4)
- ⚠️ Sin audio (anomalía)

### Fase Final (Levels 5-8)
- Música Funky consistente
- Sistema de audio estandarizado
- Enfoque en gameplay más que en variedad sonora

---

## Recomendaciones

### 🔧 Para Level 4
Se recomienda implementar audio en este nivel para mantener consistencia. Sugerencias:
- Música: `music_funky.wav` (mantener coherencia)
- SFX: `sfx_collect.mp3`, `sfx_lose_life.mp3`

### 🎵 Variedad Musical
Considerar agregar más temas musicales para evitar repetición en niveles 5-8

### 🔊 Efectos Adicionales
Posibles adiciones:
- Sonido de activación de poder
- Sonido de victoria/nivel completado
- Sonido de enemigo aturdido
- Sonido ambiente por nivel

---

## Ubicación de Archivos

Todos los archivos de audio se encuentran en:
```
/assets/audio/
├── music_background.mp3
├── music_medusa.wav
├── music_funky.wav
├── sfx_collect.mp3
├── sfx_barrel.mp3
├── sfx_lose_life.mp3
└── sfx_game_over.mp3
```
