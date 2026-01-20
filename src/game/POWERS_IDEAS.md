# Documentación de Poderes y Mejoras

Este documento rastrea los poderes implementados actualmente en cada nivel y propone nuevas ideas para futuras actualizaciones.

## 🟢 Estado Actual de los Niveles

| Nivel | Poder / Mecánica | Efecto Principal | Notas Técnicas |
| :--- | :--- | :--- | :--- |
| **Nivel 0** | Ninguno | Movimiento básico | Tutorial. |
| **Nivel 1** | Ninguno | Movimiento básico | Introducción. |
| **Nivel 2** | Ninguno | - | Invulnerabilidad temporal al ser golpeado (mecánica base). |
| **Nivel 3** | **Enemigos Lentos / "Eat Mode"** | Permite eliminar enemigos al contacto (+200 pts) | Coste: 1 Token. Similar a Pac-Man. Visual: Estela del jugador. |
| **Nivel 4** | **Super Velocidad** | Velocidad x 2.5 | Coste: 1 Token. Visual: Estela dorada. |
| **Nivel 5** | **Invencibilidad + Velocidad** | Velocidad x 2.5 + Eliminar enemigos al contacto | Coste: 1 Token. Alert: "¡INVENCIBILIDAD!". Combo de L3 y L4. |
| **Nivel 6** | **Modo Estrella** | Velocidad x 2.5 + Invulnerabilidad | Similar a L5. |
| **Nivel 7** | **Onda Expansiva** | Empuja y aturde enemigos cercanos | Radio expansivo visual. |
| **Nivel 8** | **Super Velocidad (Nerfed)** | Velocidad x 1.5 | Coste: 1 Token. Visual: Estela Cyan/Gold, esfera geométrica. |

---

## 💡 Banco de Ideas (Nuevos Poderes)

### 1. Congelar Tiempo (Time Freeze)
*   **Concepto:** Detiene a todos los enemigos en su lugar durante 5 segundos.
*   **Visual:** Filtro de pantalla azulado/hielo. Los enemigos se tornan de color cian estático.
*   **Uso:** Ideal para escapar de situaciones de encierro ("Choke Points").
*   **Implementación:**
    *   Global flag `isTimeFrozen`.
    *   En `Enemy.jsx`, si `isTimeFrozen` es true, saltar la actualización de posición.

### 2. Imán de Cervezas (Beer Magnet)
*   **Concepto:** Las cervezas cercanas vuelan hacia el jugador automáticamente.
*   **Visual:** Partículas magnéticas o líneas de fuerza conectando el jugador con los ítems.
*   **Uso:** Recolección rápida (“Farmear”) sin arriesgarse a acercarse a las paredes o enemigos.
*   **Implementación:**
    *   En el loop de juego, verificar distancia a coleccionables.
    *   Si `dist < magnetRadius`, mover coleccionable hacia `playerPos` usando lerp.

### 3. Fase Fantasma (Ghost Walk)
*   **Concepto:** Permite atravesar paredes y enemigos sin recibir daño.
*   **Visual:** Jugador semitransparente (Opacidad 0.4).
*   **Uso:** Atajos extremos a través del laberinto.
*   **Implementación:**
    *   Desactivar colisión con paredes en `checkCollision`.
    *   Desactivar daño de enemigos.

### 4. Dash / Teletransporte (Blink)
*   **Concepto:** Un salto instantáneo de 3-4 casillas en la dirección del movimiento.
*   **Visual:** Efecto de distorsión o partículas en el punto de origen y destino.
*   **Uso:** Cruzar pasillos vigilados instantáneamente.
*   **Implementación:**
    *   Al activar, calcular `newPos = currentPos + direction * dashDistance`.
    *   Verificar si `newPos` es pared. Si es pared, detenerse justo antes.

### 5. Mina de Proximidad (Proximity Mine)
*   **Concepto:** El jugador deja caer una “trampa” (barril explosivo) que aturde o elimina al primer enemigo que la pise.
*   **Visual:** Barril rojo parpadeante. Explosión al detonar.
*   **Uso:** Tender emboscadas a los perseguidores (Pursuers).
*   **Implementación:**
    *   Array `mines` en el estado.
    *   Enemigos verifican colisión con minas.

### 6. Escudo de Rebote (Bounce Shield)
*   **Concepto:** Un escudo físico que orbita al jugador. Si un enemigo toca el escudo, sale repelido violentamente.
*   **Visual:** Esfera o escudo rotando alrededor del jugador.
*   **Uso:** Protección pasiva.
*   **Implementación:**
    *   Objeto 3D hijo del jugador.
    *   Calculo de colisión física simple.

### 7. Modo Borracho (Drunk Mode / High Risk)
*   **Concepto:** Controles invertidos, pero puntuación x2.
*   **Visual:** Pantalla con efecto de distorsión (shader) o balanceo de cámara.
*   **Uso:** Desafío para obtener puntuaciones altas (High Score).
*   **Implementación:**
    *   Invertir inputs en `handleDirectionInput`.
    *   Multiplicador de score activo.

### 8. Señuelo Holográfico (Decoy)
*   **Concepto:** Crea una copia estática del jugador que atrae a los enemigos cercanos.
*   **Visual:** Copia del sprite del jugador con efecto de "glitch".
*   **Uso:** Distracción para limpiar un área.
*   **Implementación:**
    *   Instanciar objeto `Decoy` en posición actual.
    *   Modificar IA de enemigos para que el objetivo sea el `Decoy` si está en rango, en lugar del jugador.

### 9. Rompemuros (Wall Breaker)
*   **Concepto:** Permite destruir ciertos bloques de pared "agrietados" para abrir nuevos caminos.
*   **Visual:** Paredes con textura de grietas. Efecto de escombros al romper.
*   **Uso:** Acceso a áreas secretas o bonos especiales.
*   **Implementación:**
    *   Marcar ciertas paredes en el array `walls` como `destructible: true`.
    *   Si el jugador tiene el poder y choca con ellas, se eliminan del array y se regenera la geometría del laberinto.
