# 📊 Métricas Avanzadas Disponibles - TikTok LIVE Analytics

## Eventos Disponibles en tiktok-live-connector

### ✅ Eventos Ya Implementados

1. **`chat`** - Mensajes del chat
2. **`gift`** - Regalos enviados
3. **`member`** - Usuarios entrando al LIVE
4. **`like`** - Likes recibidos
5. **`follow`** (vía `social`) - Nuevos seguidores
6. **`share`** (vía `social`) - Compartidos
7. **`roomUser`** - Conteo de viewers
8. **`question`** - Preguntas Q&A

### 🆕 Eventos Disponibles NO Implementados

#### 1. **`subscribe`** - Suscripciones
```javascript
tiktokConnection.on('subscribe', data => {
    console.log(`${data.user.uniqueId} se suscribió!`);
    // Métricas posibles:
    // - Total de suscriptores nuevos
    // - Revenue de suscripciones
    // - Tasa de conversión viewer -> suscriptor
});
```

**Métricas derivadas:**
- Total suscripciones durante el LIVE
- Subscriber conversion rate
- Revenue por suscripción
- Momento peak de suscripciones

#### 2. **`linkMicBattle`** - Batallas PK (Player vs Player)
```javascript
tiktokConnection.on('linkMicBattle', data => {
    console.log('Batalla iniciada:', data);
    // Métricas posibles:
    // - Batallas ganadas/perdidas
    // - Puntos obtenidos
    // - Duración de batallas
    // - Engagement durante batalla
});
```

**Métricas derivadas:**
- Win rate en batallas
- Promedio de puntos por batalla
- Engagement boost durante batalla
- Viewers ganados/perdidos en batalla

#### 3. **`emote`** - Emotes y stickers enviados
```javascript
tiktokConnection.on('emote', data => {
    console.log(`${data.user.uniqueId} envió emote:`, data.emoteId);
    // Métricas posibles:
    // - Emotes más usados
    // - Frecuencia de emotes
    // - Usuarios más expresivos
});
```

**Métricas derivadas:**
- Top emotes utilizados
- Emote usage rate
- Emotional engagement score

#### 4. **`envelope`** - Sobres rojos (eventos especiales)
```javascript
tiktokConnection.on('envelope', data => {
    console.log('Sobre rojo enviado:', data);
    // Eventos especiales de TikTok
});
```

#### 5. **`streamEnd`** - Fin de transmisión
```javascript
tiktokConnection.on('streamEnd', () => {
    console.log('El LIVE ha terminado');
    // Generar reporte final
});
```

## 🔧 Opciones de Configuración Importantes

### 1. **`enableExtendedGiftInfo: true`** ✅ IMPLEMENTADO
Obtiene información completa de regalos:
```javascript
{
    giftName: "Rosa",
    diamond_count: 1,
    giftImage: "url",
    giftDescription: "...",
    giftType: 1
}
```

### 2. **`processInitialData: true`**
Procesa mensajes iniciales (últimos segundos del chat):
- Útil para capturar contexto del chat
- Analizar sentiment antes de conectar
- Detectar bots activos previamente

### 3. **`fetchRoomInfoOnConnect: true`**
Obtiene información completa del room al conectar:
```javascript
{
    roomId: "123456",
    ownerUserId: "789",
    title: "My LIVE",
    status: 2, // 2 = live, 4 = offline
    startTime: timestamp,
    viewerCount: 1234,
    likeCount: 5678,
    stats: {
        totalUser: 1000,
        totalUserDesp: "1K"
    }
}
```

### 4. **`requestPollingIntervalMs: 1000`**
Intervalo de polling (cuando no hay WebSocket):
- Menor intervalo = más datos en tiempo real
- Mayor intervalo = menos carga al servidor

## 📈 Propiedades y Métodos Disponibles

### Propiedades Accesibles

#### `connection.roomInfo`
Información completa del room:
```javascript
{
    owner: {
        id: "123",
        uniqueId: "username",
        nickname: "Display Name",
        avatarThumb: "url",
        followerCount: 10000,
        followingCount: 500
    },
    stats: {
        totalUser: 1000,
        viewerCount: 234,
        totalUserDesp: "1K",
        likeCount: 5000
    },
    streamId: "123456",
    status: 2,
    title: "LIVE Title",
    createTime: timestamp,
    startTime: timestamp
}
```

**Métricas derivadas:**
- Ratio followers/viewers
- Engagement basado en follower count
- Stream duration
- Categoría/tags del stream

#### `connection.availableGifts`
Catálogo completo de regalos con precios:
```javascript
[
    {
        id: 5655,
        name: "Rosa",
        diamond_count: 1,
        image: {
            url_list: ["url1", "url2"]
        },
        icon: {...},
        describe: "Send a rose",
        type: 1
    },
    // ... más regalos
]
```

**Métricas derivadas:**
- Gift diversity (cuántos tipos diferentes)
- Most valuable gift sent
- Gift price distribution
- Revenue potential vs actual

#### `connection.isConnecting` / `connection.isConnected`
Estado de conexión en tiempo real

#### `connection.roomId`
ID único del room actual

### Métodos Disponibles

#### 1. **`fetchRoomInfo()`**
Obtener room info sin conectar:
```javascript
const roomInfo = await connection.fetchRoomInfo();
console.log('Room status:', roomInfo.status); // 2 = live, 4 = offline
```

**Uso:**
- Verificar si está LIVE antes de conectar
- Obtener stats históricas
- Monitorear múltiples streams

#### 2. **`fetchAvailableGifts()`**
Obtener catálogo de regalos:
```javascript
const gifts = await connection.fetchAvailableGifts();
console.log('Total gifts available:', gifts.length);
```

**Uso:**
- Crear diccionario de precios
- Calcular revenue potential
- Sugerir regalos a enviar

#### 3. **`fetchRoomId(uniqueId)`**
Obtener Room ID de cualquier usuario:
```javascript
const roomId = await connection.fetchRoomId('otrousuario');
```

#### 4. **`fetchIsLive()`**
Verificar si está en vivo:
```javascript
const isLive = await connection.fetchIsLive();
if (isLive) {
    await connection.connect();
}
```

#### 5. **`waitUntilLive()`**
Esperar hasta que inicie LIVE:
```javascript
await connection.waitUntilLive();
console.log('¡El usuario acaba de iniciar LIVE!');
await connection.connect();
```

**Uso:**
- Auto-connect cuando inicie stream
- Monitoreo de streamers favoritos
- Alertas de inicio de LIVE

#### 6. **`sendMessage(content)` ⚠️ Requiere API key**
Enviar mensajes al chat:
```javascript
await connection.sendMessage('¡Hola desde el bot!');
```

**Uso:**
- Auto-respuestas
- Moderación automática
- Comandos de bot

## 🎯 Nuevas Métricas Posibles

### 1. **Análisis de Streamer Profile**
```javascript
// Al obtener roomInfo
const followerRatio = roomInfo.stats.viewerCount / roomInfo.owner.followerCount;
const isViral = followerRatio > 0.1; // 10%+ de followers viendo

metrics = {
    followerCount: roomInfo.owner.followerCount,
    followerToViewerRatio: followerRatio,
    isViralStream: isViral,
    streamerNickname: roomInfo.owner.nickname,
    profilePicture: roomInfo.owner.avatarThumb
}
```

### 2. **Stream Performance Metrics**
```javascript
const streamDuration = (Date.now() - roomInfo.startTime) / 1000 / 60; // minutos

metrics = {
    streamDuration: streamDuration,
    viewersPerMinute: totalViewers / streamDuration,
    likesPerMinute: totalLikes / streamDuration,
    giftsPerMinute: totalGifts / streamDuration,
    revenuePerMinute: totalDiamonds * 0.005 / streamDuration // $0.005 por diamante
}
```

### 3. **Engagement Quality Score**
```javascript
const engagementScore =
    (commentsWeight * commentsPerMinute) +
    (likesWeight * likesPerMinute) +
    (giftsWeight * giftsPerMinute) +
    (sharesWeight * sharesPerMinute) +
    (followersWeight * followersPerMinute);

// Normalizar a 0-100
const normalizedScore = Math.min(100, engagementScore / maxPossibleScore * 100);
```

### 4. **Revenue Analytics**
```javascript
const diamondValue = 0.005; // $0.005 USD por diamante
const tikTokCut = 0.5; // TikTok se queda con 50%

const revenueMetrics = {
    totalRevenue: totalDiamonds * diamondValue,
    creatorEarnings: totalDiamonds * diamondValue * tikTokCut,
    revenuePerViewer: (totalDiamonds * diamondValue) / uniqueViewers,
    revenuePerMinute: (totalDiamonds * diamondValue) / streamDuration,
    topDonor: topDonors[0],
    avgGiftValue: totalDiamonds / totalGifts,

    // Proyecciones
    projectedHourlyRevenue: (totalDiamonds * diamondValue / streamDuration) * 60,
    projectedDailyRevenue: (totalDiamonds * diamondValue / streamDuration) * 60 * 8 // 8h streaming
}
```

### 5. **Audience Growth Metrics**
```javascript
const growthMetrics = {
    followerGrowthRate: (newFollowers / roomInfo.owner.followerCount) * 100,
    viewerRetentionRate: (currentViewers / peakViewers) * 100,
    conversionRate: (newFollowers / uniqueViewers) * 100,
    shareViralityScore: shares / uniqueViewers * 100,

    // Predicciones
    predictedFollowerCount: roomInfo.owner.followerCount + (newFollowers * estimatedFutureLives),
    predictedMonthlyGrowth: newFollowers * averageLivesPerMonth
}
```

### 6. **Gift Analytics Avanzado**
```javascript
// Usando availableGifts para enriquecer datos
const giftAnalytics = {
    giftDiversity: uniqueGiftTypes.length / connection.availableGifts.length,
    mostExpensiveGiftSent: maxBy(giftsReceived, 'diamond_count'),
    avgGiftPrice: totalDiamonds / totalGifts,
    giftPriceDistribution: {
        budget: giftsUnder10Diamonds,
        mid: gifts10to100Diamonds,
        premium: giftsOver100Diamonds
    },
    topGiftByCount: mostCommonGift,
    topGiftByValue: highestValueGift
}
```

### 7. **Temporal Pattern Analytics**
```javascript
const patterns = {
    peakHour: hourWithMostViewers,
    peakEngagementTime: timeWithMostComments,
    quietPeriods: periodsWithLowActivity,
    giftSpikes: momentosWithGiftBursts,
    viralMoments: momentosWithViewerSpikes,

    // Heatmap data para visualización
    engagementByMinute: [...],
    viewersByMinute: [...],
    revenueByMinute: [...]
}
```

### 8. **Comparative Analytics**
```javascript
// Comparar con streams anteriores
const comparison = {
    viewersVsAverage: currentViewers / avgViewersPastStreams,
    revenueVsAverage: currentRevenue / avgRevenuePastStreams,
    engagementVsAverage: currentEngagement / avgEngagementPastStreams,
    isPerformingBetter: currentScore > avgScore,
    improvementAreas: [...] // Áreas donde mejorar
}
```

### 9. **Social Network Effect**
```javascript
const networkMetrics = {
    shareReach: shares * avgFollowersPerViewer,
    potentialNewViewers: shareReach * shareConversionRate,
    viralCoefficient: (shares * shareConversionRate) / uniqueViewers,
    isGoingViral: viralCoefficient > 1
}
```

### 10. **Quality of Audience**
```javascript
const audienceQuality = {
    payingViewerRatio: uniqueDonors / uniqueViewers,
    avgRevenuePerPayingViewer: totalRevenue / uniqueDonors,
    commentingRatio: uniqueCommenters / uniqueViewers,
    followConversionRate: newFollowers / uniqueViewers,
    qualityScore: weighted(payingRatio, commentingRatio, followRate)
}
```

## 🚀 Implementación Recomendada

### Fase 1: Datos Base Extendidos
```javascript
// Ya implementado:
✅ Chat, Gifts, Likes, Follows, Shares, Members, Questions

// Agregar:
- roomInfo completo al conectar
- availableGifts catalog
- Gift extended info habilitado
```

### Fase 2: Métricas Calculadas
```javascript
- Revenue metrics
- Engagement score
- Growth metrics
- Performance indicators
```

### Fase 3: Analytics Avanzados
```javascript
- Temporal patterns
- Predictive analytics
- Comparative analysis
- Heatmaps y visualizaciones
```

### Fase 4: Características Premium
```javascript
- Multi-stream monitoring
- Historical data persistence
- AI predictions
- Auto-responder bot
- Moderación automática
```

## 📊 Dashboard Widgets Sugeridos

### Widget: Stream Health
```
┌─────────────────────────────┐
│ 🏥 Stream Health            │
├─────────────────────────────┤
│ Overall Score: 87/100 🟢    │
│                             │
│ Engagement:    ████████░ 85%│
│ Revenue:       ██████░░░ 72%│
│ Growth:        █████████ 94%│
│ Retention:     ███████░░ 78%│
└─────────────────────────────┘
```

### Widget: Revenue Dashboard
```
┌─────────────────────────────┐
│ 💰 Revenue Analytics        │
├─────────────────────────────┤
│ Current: $45.67             │
│ Per Hour: $68.50            │
│ Top Donor: @user ($12.34)   │
│ Avg Gift: 156 💎            │
└─────────────────────────────┘
```

### Widget: Growth Tracker
```
┌─────────────────────────────┐
│ 📈 Audience Growth          │
├─────────────────────────────┤
│ +234 New Followers          │
│ 12.5% Conversion Rate       │
│ 156 Shares (Viral! 🔥)      │
│ Projected: +1.2K this week  │
└─────────────────────────────┘
```

### Widget: Gift Catalog Explorer
```
┌─────────────────────────────┐
│ 🎁 Available Gifts (125)    │
├─────────────────────────────┤
│ 🌹 Rosa         1 💎        │
│ 🎪 Universe  44,999 💎      │
│ 🚀 Rocket       200 💎      │
│                             │
│ Suggest: "Solicita Rosas!"  │
└─────────────────────────────┘
```

## 🔮 Machine Learning Opportunities

### 1. Predicción de Revenue
```javascript
// Entrenar modelo con:
- Historical revenue per stream
- Time of day
- Day of week
- Current engagement rate
- Follower count

// Predecir:
- Expected revenue for current stream
- Best time to stream
- Optimal stream duration
```

### 2. Detección de Momentos Virales
```javascript
// Features:
- Sudden viewer spike
- Share rate increase
- Comment velocity
- Gift burst patterns

// Predict:
- When to promote content
- When to engage more
- When to call-to-action
```

### 3. Churn Prediction
```javascript
// Detectar cuando viewers están por irse:
- Decreasing comment rate
- Viewer count dropping
- Engagement declining

// Actions:
- Trigger interactive content
- Start Q&A session
- Announce giveaway
```

## 🛠️ Herramientas de Análisis Sugeridas

### Backend
- **InfluxDB** - Time series data para métricas temporales
- **Redis** - Cache de métricas en tiempo real
- **PostgreSQL** - Datos históricos y agregados
- **TensorFlow** - ML predictions

### Frontend
- **Chart.js / D3.js** - Visualizaciones avanzadas
- **Plotly** - Gráficos interactivos 3D
- **Heatmap.js** - Mapas de calor temporales
- **React-vis** - Dashboards interactivos

### Analytics
- **Apache Kafka** - Stream processing
- **Apache Spark** - Big data analytics
- **Elasticsearch** - Búsqueda y analytics
- **Grafana** - Monitoring dashboards
