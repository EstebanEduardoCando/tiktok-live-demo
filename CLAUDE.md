# TikTok LIVE Demo

## Descripción del Proyecto

Aplicación web en tiempo real que se conecta a transmisiones en vivo de TikTok para monitorear y visualizar eventos de la audiencia como mensajes del chat, likes, regalos, nuevos seguidores y más. Utiliza WebSocket para comunicación bidireccional entre el servidor y el cliente.

## Estructura del Proyecto

```
tiktok-live-demo/
├── server.js              # Servidor backend con Express y Socket.IO
├── public/
│   └── index.html         # Frontend con interfaz de usuario
├── package.json           # Dependencias y configuración del proyecto
└── node_modules/          # Dependencias instaladas
```

## Tecnologías

### Backend
- **Node.js** - Runtime de JavaScript
- **Express 5.1.0** - Framework web
- **Socket.IO 4.8.1** - Comunicación en tiempo real vía WebSocket
- **tiktok-live-connector 2.0.8** - Librería para conectarse a TikTok LIVE API

### Frontend
- **HTML5/CSS3** - Estructura y estilos
- **Vanilla JavaScript** - Lógica del cliente
- **Socket.IO Client** - Comunicación con el servidor

### DevDependencies
- **nodemon 3.1.10** - Auto-recarga durante desarrollo

## Arquitectura

### Servidor ([server.js](server.js))

#### Configuración Principal
- Puerto: 3000 (configurable via `process.env.PORT`)
- Sirve archivos estáticos desde `/public`
- Gestiona conexiones WebSocket con Socket.IO

#### Funcionalidad Core

**Función `connectToTikTok(username)`** ([server.js:24](server.js#L24))
- Establece conexión con el LIVE de TikTok usando `WebcastPushConnection`
- Gestiona eventos de conexión/desconexión
- Emite actualizaciones de estado al cliente

#### Event Handlers de TikTok

1. **Chat Messages** ([server.js:48](server.js#L48))
   - Captura mensajes del chat
   - Emite evento `chat-message` con username, mensaje, foto de perfil y timestamp

2. **Likes** ([server.js:60](server.js#L60))
   - Rastrea likes acumulados
   - Emite evento `like` con contador total

3. **Regalos** ([server.js:74](server.js#L74))
   - Detecta regalos completados (`repeat_end === 1`)
   - Calcula valor total en diamantes
   - Emite evento `gift` con detalles del regalo e imagen

4. **Nuevos Seguidores** ([server.js:95](server.js#L95))
   - Incrementa contador de seguidores
   - Emite evento `follow`

5. **Shares** ([server.js:106](server.js#L106))
   - Detecta cuando alguien comparte el LIVE

6. **Viewer Count** ([server.js:115](server.js#L115))
   - Actualiza conteo de espectadores en tiempo real

7. **Member Join** ([server.js:124](server.js#L24))
   - Notifica cuando alguien entra al LIVE

#### Estadísticas Globales ([server.js:16](server.js#L16))
```javascript
stats = {
    viewers: 0,
    likes: 0,
    totalGifts: 0,
    followers: 0
}
```

#### Socket.IO Events ([server.js:135](server.js#L135))
- `connection` - Cliente se conecta
- `start-connection` - Cliente inicia conexión a TikTok
- `disconnect` - Cliente se desconecta

### Frontend ([public/index.html](public/index.html))

#### UI Components

1. **Formulario de Conexión** ([public/index.html:212](public/index.html#L212))
   - Input para ingresar username de TikTok
   - Botón para iniciar conexión

2. **Dashboard** ([public/index.html:224](public/index.html#L224))
   - Panel de estadísticas en vivo
   - Eventos recientes
   - Feed del chat con mensajes y regalos

#### Funciones Principales

**`connectToLive()`** ([public/index.html:272](public/index.html#L272))
- Valida input del usuario
- Oculta formulario y muestra dashboard
- Emite evento `start-connection` al servidor

**`updateStatus(message, isError)`** ([public/index.html:290](public/index.html#L290))
- Actualiza mensaje de estado de conexión

**`addRecentEvent(emoji, text)`** ([public/index.html:296](public/index.html#L296))
- Agrega evento a la lista de eventos recientes
- Limita a 10 eventos máximo

**`createLikeAnimation()`** ([public/index.html:309](public/index.html#L309))
- Crea animación flotante de corazones

#### Socket Event Listeners

- `status` - Actualiza estado de conexión ([public/index.html:321](public/index.html#L321))
- `chat-message` - Muestra nuevo mensaje ([public/index.html:329](public/index.html#L329))
- `like` - Actualiza likes y anima corazones ([public/index.html:349](public/index.html#L349))
- `gift` - Muestra notificación especial de regalo ([public/index.html:361](public/index.html#L361))
- `follow` - Incrementa contador de seguidores ([public/index.html:381](public/index.html#L381))
- `share` - Muestra evento de compartir ([public/index.html:387](public/index.html#L387))
- `viewers` - Actualiza contador de viewers ([public/index.html:391](public/index.html#L391))
- `member-join` - Muestra cuando alguien entra ([public/index.html:396](public/index.html#L396))
- `stats-update` - Sincroniza estadísticas al conectar ([public/index.html:400](public/index.html#L400))

#### Estilos

- **Tema oscuro** con gradiente negro a rosa TikTok
- **Glassmorphism** - Paneles con backdrop-filter blur
- **Animaciones CSS**:
  - `slideIn` - Mensajes del chat
  - `giftPop` - Notificaciones de regalo
  - `likeFloat` - Corazones flotantes

## Flujo de Datos

1. Usuario ingresa username de TikTok en el frontend
2. Cliente emite `start-connection` via WebSocket
3. Servidor crea instancia de `WebcastPushConnection`
4. `tiktok-live-connector` se conecta al LIVE de TikTok
5. Eventos del LIVE se capturan en el servidor
6. Servidor emite eventos procesados al cliente
7. Cliente actualiza UI en tiempo real

## Configuración y Uso

### Instalación
```bash
npm install
```

### Desarrollo
```bash
nodemon server.js
```

### Producción
```bash
node server.js
```

### Uso
1. Abrir `http://localhost:3000`
2. Ingresar username de TikTok (sin @)
3. Usuario debe estar en LIVE activo
4. Ver estadísticas y eventos en tiempo real

## Notas Importantes

- El usuario de TikTok **debe estar en LIVE** al momento de conectar
- La conexión usa APIs no oficiales de TikTok vía `tiktok-live-connector`
- Los regalos solo se cuentan cuando `repeat_end === 1` para evitar duplicados
- El chat se limita a 20 mensajes para optimizar rendimiento
- Los eventos recientes se limitan a 10 items

## Manejo de Errores

- Validación de username vacío en frontend
- Catch de errores de conexión con TikTok
- Emisión de eventos `status` con errores al cliente
- Cleanup de conexión al cerrar servidor (SIGINT handler)

## Dashboard de Analíticas Avanzadas - Roadmap

### 1. Métricas de Audiencia en Tiempo Real

#### Visualizadores
- **Viewers Actuales**: Número de personas viendo en este momento (✅ Implementado)
- **Peak Concurrent Viewers (PCU)**: Máximo de viewers simultáneos durante la sesión
- **Viewers Únicos Totales**: Cantidad total de usuarios únicos que se conectaron
- **Tiempo Promedio de Visualización**: Duración promedio que cada viewer permanece
- **Historial de Viewers**: Gráfico de líneas mostrando evolución temporal

#### Crecimiento de Audiencia
- **Nuevos Seguidores**: Usuarios que siguieron durante el live (✅ Implementado)
- **Shares en Tiempo Real**: Cantidad de veces que se compartió (✅ Implementado)
- **Tasa de Retención**: Porcentaje de viewers que permanecen después de los primeros minutos
- **Viewer Join/Leave Rate**: Frecuencia de entrada/salida de usuarios
- **Conversion Rate**: Porcentaje de viewers que se convirtieron en followers

### 2. Métricas de Engagement Interactivo

#### Interacciones por Minuto (IPM)
- **Comentarios por Minuto**: Frecuencia de comentarios (requiere tracking temporal)
- **Likes por Minuto**: Rate de likes en tiempo real (requiere tracking temporal)
- **Rate de Engagement**: `(comentarios + likes + shares) / viewers actuales`
- **Engagement Score**: Métrica compuesta de todas las interacciones
- **Heatmap de Engagement**: Visualización de momentos peak durante la transmisión

#### Análisis de Comentarios (NLP)
- **Sentiment Analysis**: Clasificación automática (positivos/negativos/neutros)
  - Requiere: `sentiment` o `natural` npm package
- **Palabras Clave Trending**: Términos más mencionados
  - Requiere: Word frequency analysis
- **Idiomas Detectados**: Distribución geográfica basada en idiomas
  - Requiere: `franc` o `languagedetect` npm package
- **Emoji Analysis**: Emojis más usados y su frecuencia
- **Toxicity Detection**: Filtro de comentarios inapropiados
  - Requiere: `bad-words` npm package

### 3. Métricas de Monetización

#### Regalos Virtuales
- **Ingresos en Tiempo Real**: Valor monetario de regalos (diamantes × tasa de conversión)
- **Regalos por Tipo**: Desglose de types de gifts y frecuencia (✅ Parcialmente)
- **Top Donors**: Ranking de usuarios que más regalos enviaron
- **Earnings per Minute (EPM)**: Ingresos generados por minuto
- **Gift Velocity**: Velocidad de recepción de regalos
- **Revenue Forecast**: Proyección de ingresos basada en tendencias

#### Análisis de Donadores
- **First-time Donors**: Usuarios que dieron su primer regalo
- **Repeat Donors**: Usuarios que donan múltiples veces
- **Average Gift Value**: Valor promedio de regalos
- **Gift Streaks**: Regalos enviados en ráfaga por un usuario

### 4. Métricas de Rendimiento Técnico

#### Performance de la Sesión
- **Duración Total del Live**: Tiempo transcurrido (requiere tracking de inicio)
- **Uptime**: Porcentaje de tiempo sin desconexiones
- **Momentos Peak**: Identificación automática de momentos con mayor engagement
- **Eventos de Conexión/Desconexión**: Tracking de users join/leave (✅ Implementado)
- **Latency Monitoring**: Delay entre eventos TikTok y dashboard

#### Calidad de Datos
- **Event Processing Rate**: Eventos procesados por segundo
- **Error Rate**: Porcentaje de eventos que fallaron
- **Data Completeness**: Porcentaje de eventos con todos los datos

### 5. Visualizaciones Propuestas

#### Widgets en Tiempo Real
1. **Counters Dashboard**
   - Cards grandes con números actuales (viewers, likes, gifts, followers)
   - Indicadores de tendencia (↑↓) y porcentaje de cambio

2. **Timeline Charts**
   - Gráfico de líneas: Viewers vs Tiempo
   - Área chart: Engagement over time
   - Bar chart: Comentarios por minuto

3. **Leaderboards**
   - Top 10 Commenters (más activos)
   - Top 10 Donors (más generosos)
   - Top Keywords (trending words)

4. **Heatmaps**
   - Heatmap de actividad por minuto
   - Mapa de calor de engagement events

5. **Word Clouds**
   - Nube de palabras más mencionadas
   - Tag cloud de emojis

6. **Sentiment Gauge**
   - Indicador circular de sentiment score
   - Distribución positivo/neutral/negativo

#### Analytics Dashboard Sections

```
┌────────────────────────────────────────────────────────┐
│  LIVE Analytics - @username            [Export] [⚙️]  │
├────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────┬─────────────┬─────────────┬─────────┐│
│  │👁️ Viewers   │❤️ Likes     │🎁 Gifts     │👥 Foll. ││
│  │   1,234 ↑   │  45.6K ↑    │    89 ↑     │   56 ↑  ││
│  │  Peak: 1.5K │  +125/min   │  $234 💎    │  +2/min ││
│  └─────────────┴─────────────┴─────────────┴─────────┘│
│                                                         │
│  ┌──────────────────────────┬──────────────────────┐  │
│  │ 📊 Engagement Timeline   │ 🔥 Top Moments       │  │
│  │  [Line Chart]            │  • 12:34 - Peak      │  │
│  │                          │  • 12:45 - Big Gift  │  │
│  └──────────────────────────┴──────────────────────┘  │
│                                                         │
│  ┌──────────────────────────┬──────────────────────┐  │
│  │ 💬 Chat Sentiment        │ 🏆 Top Contributors  │  │
│  │  😊 Positive: 65%        │  1. @user1 - 45 msg │  │
│  │  😐 Neutral:  25%        │  2. @user2 - $120   │  │
│  │  😠 Negative: 10%        │  3. @user3 - 89 ♥️  │  │
│  └──────────────────────────┴──────────────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐ │
│  │ 💬 Live Chat Feed                                │ │
│  │  [Real-time messages with sentiment indicators]  │ │
│  └──────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

### 6. Eventos Disponibles en tiktok-live-connector

Según la librería, estos son todos los eventos capturables:

#### Eventos Actualmente Implementados ✅
- `connected` - Conexión establecida
- `disconnected` - Desconexión
- `chat` - Mensajes del chat (CommentEvent)
- `like` - Likes recibidos (LikeEvent)
- `gift` - Regalos virtuales (GiftEvent)
- `follow` - Nuevos seguidores (UserEvent)
- `share` - Compartidos (ShareEvent)
- `roomUser` - Conteo de viewers (ViewersEvent)
- `member` - Usuario entra al LIVE (UserEvent)

#### Eventos Disponibles No Implementados ⚠️
- `question` - Preguntas del Q&A (QuestionEvent)
- `emote` - Emotes/Stickers enviados
- `envelope` - Sobres rojos (eventos especiales)
- `subscribe` - Suscripciones
- `streamEnd` - Fin de la transmisión (ControlEvent)
- `websocketConnected` - WebSocket conectado
- `error` - Errores de conexión
- `rawData` - Datos sin procesar para debugging

### 7. Stack Tecnológico Recomendado para Mejoras

#### Backend
- **Database**: MongoDB o PostgreSQL para persistir analytics
- **Caching**: Redis para métricas en tiempo real
- **NLP**: `natural` o `sentiment` para análisis de texto
- **Language Detection**: `franc` para detectar idiomas
- **Task Queue**: Bull para procesamiento asíncrono de analytics

#### Frontend
- **Charting**: Chart.js, ApexCharts o D3.js para visualizaciones
- **UI Framework**: React o Vue para dashboard interactivo
- **State Management**: Redux/Vuex para manejo de estado complejo
- **Real-time Updates**: Socket.IO client (ya implementado)

#### Analytics Processing
- **Time Series**: InfluxDB para métricas temporales
- **Stream Processing**: Apache Kafka para procesar eventos en streaming
- **ML/AI**: TensorFlow.js para predicciones y sentiment analysis avanzado

### 8. Implementación por Fases

#### Fase 1: Foundation (Actual) ✅
- Conexión básica a TikTok LIVE
- Eventos core (chat, likes, gifts, followers)
- Dashboard simple con contadores

#### Fase 2: Advanced Metrics
- Tracking temporal (comentarios/minuto, likes/minuto)
- Peak viewers y viewers únicos
- Earnings calculator
- Top donors leaderboard

#### Fase 3: Analytics & Insights
- Sentiment analysis de comentarios
- Keyword extraction y trending words
- Heatmap de engagement
- Retention rate tracking

#### Fase 4: Data Persistence
- Base de datos para históricos
- Comparación entre sesiones
- Reportes descargables (PDF/CSV)
- Analytics dashboard histórico

#### Fase 5: Advanced Features
- Multi-stream monitoring
- Webhooks y alertas
- API REST para integraciones
- Machine learning predictions

### 9. Métricas Calculadas (Fórmulas)

```javascript
// Engagement Rate
engagementRate = (totalComments + totalLikes + totalShares) / currentViewers * 100

// Peak Concurrent Viewers
peakViewers = Math.max(...viewerHistory)

// Average Watch Time (requiere tracking de joins/leaves)
avgWatchTime = totalWatchTime / uniqueViewers

// Earnings Per Minute
earningsPerMinute = totalDiamonds * conversionRate / durationMinutes

// Follower Conversion Rate
followerConversionRate = newFollowers / uniqueViewers * 100

// Retention Rate
retentionRate = viewersAtMinute5 / viewersAtMinute1 * 100

// Engagement Score (compuesto)
engagementScore = (
  commentsWeight * commentsPerMinute +
  likesWeight * likesPerMinute +
  giftsWeight * giftsPerMinute +
  sharesWeight * sharesPerMinute
) / totalWeight
```

## Posibles Mejoras Inmediatas

### Backend
- Implementar tracking temporal para calcular métricas por minuto
- Agregar eventos no implementados (`question`, `emote`, `streamEnd`)
- Persistir datos en base de datos (MongoDB/PostgreSQL)
- Crear endpoints REST para exportar analytics
- Implementar rate limiting y autenticación

### Frontend
- Integrar Chart.js para gráficos de tendencias
- Agregar leaderboards de top commenters y donors
- Implementar sentiment indicators en mensajes
- Crear vista de export/download de datos
- Responsive design para mobile

### Analytics
- Sentiment analysis con `sentiment` npm package
- Keyword extraction con NLP
- Language detection para audiencia global
- Heatmap temporal de engagement
- Predicción de peak hours con ML

## Detección de Bots en el Chat

### Características de Comportamiento de Bots

Los bots en TikTok LIVE suelen exhibir patrones identificables:

#### 1. Patrones Temporales
- **Frecuencia de mensajes**: Bots envían mensajes a intervalos muy regulares (ej: cada 30s exactos)
- **Timestamps uniformes**: Distribución temporal no humana
- **No pausas naturales**: Humanos pausan, bots no
- **Actividad 24/7**: Comentan a horas inusuales sin parar

#### 2. Patrones de Contenido
- **Mensajes repetitivos**: Mismo texto o ligeras variaciones
- **Templates genéricos**: "Nice live!", "Love it!", "Amazing!"
- **Sin contexto**: No responden al contenido del LIVE
- **Spam de enlaces**: URLs, promociones, emojis en masa
- **Caracteres especiales**: Uso excesivo de emojis o símbolos

#### 3. Patrones de Cuenta
- **Usernames genéricos**: user123456, randomname_7890
- **Sin foto de perfil**: Avatar por defecto
- **Cuenta nueva**: Creada recientemente
- **Bajo engagement**: No da likes, no sigue, solo comenta
- **No interacción social**: No responde a otros usuarios

#### 4. Análisis de Texto (NLP)
- **Baja complejidad lingüística**: Frases muy cortas o simples
- **Falta de variación léxica**: Vocabulario limitado
- **Errores gramaticales consistentes**: Mismos typos repetidos
- **Estructura rígida**: Siempre el mismo patrón de palabras

### Implementación de Detección

#### Algoritmo de Scoring de Bot

```javascript
function calculateBotScore(userData) {
    let botScore = 0;
    const weights = {
        messageFrequency: 0.25,
        contentRepetition: 0.20,
        accountAge: 0.15,
        textComplexity: 0.15,
        interactionPattern: 0.15,
        usernamePattern: 0.10
    };

    // 1. Frecuencia de mensajes (0-100)
    const avgInterval = calculateAverageInterval(userData.timestamps);
    const intervalVariance = calculateVariance(userData.intervals);

    // Intervalos muy regulares = más bot-like
    if (intervalVariance < 5) { // Menos de 5 segundos de variación
        botScore += weights.messageFrequency * 100;
    } else if (intervalVariance < 15) {
        botScore += weights.messageFrequency * 60;
    } else {
        botScore += weights.messageFrequency * 20;
    }

    // 2. Repetición de contenido (0-100)
    const uniqueRatio = userData.uniqueMessages / userData.totalMessages;
    const repetitionScore = (1 - uniqueRatio) * 100;
    botScore += weights.contentRepetition * repetitionScore;

    // 3. Similitud de mensajes (Levenshtein distance)
    const avgSimilarity = calculateAverageSimilarity(userData.messages);
    if (avgSimilarity > 0.8) { // 80% similares
        botScore += weights.contentRepetition * 80;
    }

    // 4. Patrón de username
    if (isGenericUsername(userData.username)) {
        botScore += weights.usernamePattern * 100;
    }

    // 5. Complejidad del texto
    const avgComplexity = calculateTextComplexity(userData.messages);
    if (avgComplexity < 3) { // Muy simple
        botScore += weights.textComplexity * 70;
    }

    // 6. Burst detection
    const hasBursts = detectMessageBursts(userData.timestamps);
    if (hasBursts) {
        botScore += weights.interactionPattern * 80;
    }

    return Math.min(100, botScore); // Cap at 100
}
```

#### Métricas de Detección

```javascript
// Tracking por usuario
userBehavior = {
    'username123': {
        messages: ['hello', 'nice', 'hello', 'nice'],
        timestamps: [1000, 2000, 3000, 4000],
        intervals: [1000, 1000, 1000], // Muy regular = sospechoso
        uniqueMessages: 2,
        totalMessages: 4,
        repetitionRate: 0.5,
        avgMessageLength: 5,
        botScore: 85,
        classification: 'likely_bot'
    }
}
```

### Señales de Alerta (Red Flags)

#### Nivel 1: Sospechoso (Score 30-60)
- Más de 50% de mensajes repetidos
- Intervalos con varianza < 10 segundos
- Username con números al final
- Mensajes muy cortos (< 5 caracteres)

#### Nivel 2: Probable Bot (Score 60-80)
- Más de 70% de mensajes idénticos
- Intervalos casi perfectos (varianza < 5s)
- Sin engagement (no likes, no gifts)
- Spam de emojis

#### Nivel 3: Bot Confirmado (Score 80-100)
- 100% mensajes repetidos o templates
- Intervalos exactos (varianza < 2s)
- Username formato bot (user_123456)
- Burst patterns (10+ mensajes en 10s)

### Técnicas de Análisis

#### 1. Análisis de Frecuencia
```javascript
function detectUniformTiming(timestamps) {
    const intervals = [];
    for (let i = 1; i < timestamps.length; i++) {
        intervals.push(timestamps[i] - timestamps[i-1]);
    }

    const mean = intervals.reduce((a,b) => a+b, 0) / intervals.length;
    const variance = intervals.reduce((sum, val) =>
        sum + Math.pow(val - mean, 2), 0) / intervals.length;

    return variance < 1000; // Menos de 1 segundo de varianza
}
```

#### 2. Similitud de Texto (Levenshtein Distance)
```javascript
function levenshteinDistance(str1, str2) {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i-1) === str1.charAt(j-1)) {
                matrix[i][j] = matrix[i-1][j-1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i-1][j-1] + 1,
                    matrix[i][j-1] + 1,
                    matrix[i-1][j] + 1
                );
            }
        }
    }

    return matrix[str2.length][str1.length];
}

function calculateSimilarity(str1, str2) {
    const distance = levenshteinDistance(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);
    return 1 - (distance / maxLength);
}
```

#### 3. Detección de Patrones de Username
```javascript
function isGenericUsername(username) {
    // Patrones comunes de bots
    const botPatterns = [
        /^user\d+$/i,           // user123
        /^[a-z]+\d{4,}$/i,      // name12345
        /^[a-z]{4,}_\d+$/i,     // random_123
        /^bot[_-]?/i,           // bot_name
        /\d{6,}/,               // 6+ dígitos seguidos
        /^[a-z]{1,3}\d+$/i,     // ab123
        /^(test|fake|spam)/i    // test, fake, spam
    ];

    return botPatterns.some(pattern => pattern.test(username));
}
```

#### 4. Análisis de Complejidad Textual
```javascript
function calculateTextComplexity(message) {
    const words = message.split(/\s+/);
    const uniqueWords = new Set(words).size;
    const avgWordLength = words.reduce((sum, word) =>
        sum + word.length, 0) / words.length;

    const complexityScore =
        (uniqueWords / words.length) * // Lexical diversity
        (avgWordLength / 5) *          // Word length
        (words.length / 3);            // Message length

    return complexityScore;
}
```

#### 5. Detección de Bursts
```javascript
function detectMessageBursts(timestamps, windowMs = 10000, threshold = 5) {
    let burstCount = 0;

    for (let i = 0; i < timestamps.length; i++) {
        let messagesInWindow = 1;

        for (let j = i + 1; j < timestamps.length; j++) {
            if (timestamps[j] - timestamps[i] <= windowMs) {
                messagesInWindow++;
            } else {
                break;
            }
        }

        if (messagesInWindow >= threshold) {
            burstCount++;
        }
    }

    return burstCount > 0;
}
```

### Dashboard de Detección de Bots

#### Widget de Estadísticas
```
┌─────────────────────────────────────┐
│  🤖 Bot Detection Dashboard         │
├─────────────────────────────────────┤
│                                     │
│  Total Users: 156                   │
│  Suspected Bots: 23 (14.7%)         │
│  Confirmed Bots: 8 (5.1%)           │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ Top Suspected Bots            │ │
│  │ 1. user_12345  (Score: 94) 🔴 │ │
│  │ 2. bot_viewer  (Score: 87) 🔴 │ │
│  │ 3. random_789  (Score: 72) 🟡 │ │
│  └───────────────────────────────┘ │
│                                     │
│  Real Engagement Rate: 12.3%        │
│  (Excluding bots)                   │
└─────────────────────────────────────┘
```

### Métricas a Mostrar

1. **Bot Detection Rate**: Porcentaje de usuarios clasificados como bots
2. **Real vs Total Engagement**: Comparación con/sin bots
3. **Bot Score Distribution**: Histograma de scores
4. **Temporal Bot Activity**: Gráfico de actividad de bots vs humanos
5. **Bot List**: Tabla de usuarios sospechosos con scores

### Machine Learning Approach (Avanzado)

Para detección más precisa, entrenar un modelo con features:

```javascript
features = {
    // Temporales
    avgInterval: 30.5,
    intervalStdDev: 2.3,
    burstCount: 3,

    // Contenido
    repetitionRate: 0.75,
    avgSimilarity: 0.82,
    uniqueWordsRatio: 0.3,

    // Texto
    avgMessageLength: 12,
    emojiDensity: 0.2,
    urlCount: 0,

    // Usuario
    usernameScore: 80,
    hasProfilePic: false,
    accountAge: 2, // días

    // Comportamiento
    likesGiven: 0,
    giftsGiven: 0,
    repliesReceived: 0
}
```

Usar **Random Forest** o **Gradient Boosting** para clasificación binaria (bot/humano).

### Librerías Recomendadas

- **natural** - NLP y análisis de texto
- **string-similarity** - Cálculo de similitud
- **ml-random-forest** - Machine learning
- **brain.js** - Neural networks en Node.js

### Acciones Contra Bots

1. **Silenciar automáticamente**: No mostrar mensajes de bots confirmados
2. **Marcar visualmente**: Badge "⚠️ Bot sospechoso" en UI
3. **Filtrar de métricas**: Excluir bots de stats de engagement
4. **Reportar**: Log de actividad sospechosa
5. **Rate limiting**: Limitar mensajes por minuto por usuario
