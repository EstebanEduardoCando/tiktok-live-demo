# 🎵 TikTok LIVE Analytics Dashboard

Dashboard completo de analíticas en tiempo real para transmisiones de TikTok LIVE. Monitorea viewers, engagement, sentiment analysis, leaderboards y más.

## ✨ Características

### 📊 Métricas en Tiempo Real
- **Viewers**: Actuales, únicos y peak concurrent viewers
- **Engagement**: Likes, comentarios, regalos y shares
- **Monetización**: Tracking de diamantes y top donors
- **Crecimiento**: Nuevos seguidores durante el LIVE
- **Sentiment Analysis**: Análisis automático de sentimientos en comentarios

### 📈 Visualizaciones
- Gráficos de viewers en tiempo real (Chart.js)
- Timeline de engagement (comentarios, likes, regalos)
- Gráfico circular de sentiment analysis
- Métricas por minuto (CPM, LPM, GPM)

### 🏆 Leaderboards
- Top 10 Commenters (usuarios más activos)
- Top 10 Donors (mayores donadores por diamantes)
- Actualización en tiempo real

### 💬 Chat Feed
- Mensajes en vivo con sentiment indicators
- Notificaciones especiales para regalos
- Animaciones de likes flotantes
- **Badges de detección de bots** en tiempo real

### 🤖 Bot Detection (NUEVO)
- **Análisis automático de comportamiento** de usuarios
- Detección basada en 6 factores:
  - Frecuencia de mensajes (intervalos uniformes)
  - Repetición de contenido
  - Similitud entre mensajes (Levenshtein distance)
  - Patrones de username genéricos
  - Complejidad del texto (lexical diversity)
  - Detección de bursts
- **Bot Score** de 0-100 para cada usuario
- Clasificación en 3 niveles:
  - 🤖 Bot Confirmado (80-100)
  - ⚠️ Probable Bot (60-79)
  - 👀 Sospechoso (30-59)
- **Métricas de bots**: Total users, suspected bots, confirmed bots, bot rate
- **Top 10 lista** de usuarios más sospechosos ordenados por score
- **Badges visuales** en chat feed para identificar bots

## 🚀 Instalación

```bash
# Clonar el repositorio
git clone <tu-repo>
cd tiktok-live-demo

# Instalar dependencias
npm install

# Iniciar servidor
node server.js

# O con nodemon para desarrollo
nodemon server.js
```

## 📦 Dependencias

```json
{
  "express": "^5.1.0",
  "socket.io": "^4.8.1",
  "tiktok-live-connector": "^2.0.8",
  "sentiment": "^5.0.2",
  "string-similarity": "^4.0.4"
}
```

## 🎮 Uso

### Opción 1: Dashboard Básico
1. Abrir `http://localhost:3000`
2. Ingresar username de TikTok (sin @)
3. El usuario debe estar en LIVE activo

### Opción 2: Analytics Dashboard (Recomendado)
1. Abrir `http://localhost:3000/analytics.html`
2. Ingresar username de TikTok
3. Visualizar métricas avanzadas en tiempo real

## 📁 Estructura del Proyecto

```
tiktok-live-demo/
├── server.js                 # Servidor backend con todas las métricas
├── public/
│   ├── index.html           # Dashboard básico
│   └── analytics.html       # Dashboard avanzado con analíticas
├── package.json
├── CLAUDE.md               # Documentación técnica completa
└── README.md
```

## 🔧 Configuración del Servidor

### Métricas Implementadas

#### Stats Básicas
- Viewers actuales y peak
- Total likes, comentarios, regalos
- Nuevos seguidores y shares
- Viewers únicos y commenters únicos
- Total diamantes recibidos

#### Tracking Temporal
- Comentarios por minuto
- Likes por minuto
- Regalos por minuto
- Engagement rate calculado
- Historial de viewers (últimos 60 minutos)

#### Sentiment Analysis
- Clasificación automática (positivo/neutral/negativo)
- Porcentajes de distribución
- Score promedio de sentiment
- Indicadores visuales en tiempo real

#### Leaderboards
- Top commenters con contador
- Top donors con total de diamantes
- Actualización automática en cada evento

## 🎯 Eventos Capturados

### Implementados ✅
- `connected` - Conexión establecida
- `disconnected` - Desconexión
- `chat` - Mensajes del chat (con sentiment analysis)
- `like` - Likes recibidos
- `gift` - Regalos virtuales
- `follow` - Nuevos seguidores
- `share` - Compartidos
- `roomUser` - Conteo de viewers
- `member` - Usuario entra al LIVE
- `question` - Preguntas Q&A
- `streamEnd` - Fin de transmisión
- `error` - Manejo de errores

## 📡 Socket.IO Events

### Del Servidor al Cliente
- `status` - Estado de conexión
- `stats-update` - Estadísticas generales
- `viewers` - Conteo de viewers
- `metrics-update` - Métricas por minuto
- `chat-message` - Mensajes con sentiment
- `sentiment-update` - Stats de sentiment
- `like` - Evento de like
- `gift` - Regalo recibido
- `follow` - Nuevo seguidor
- `share` - Compartido
- `member-join` - Usuario se une
- `leaderboards-update` - Actualización de rankings
- `timeseries-update` - Datos históricos
- `stream-end` - LIVE finalizado
- `error` - Errores

### Del Cliente al Servidor
- `start-connection` - Iniciar conexión a TikTok LIVE

## 💡 Ejemplos de Uso

### Conectar a un LIVE
```javascript
socket.emit('start-connection', 'nombreusuario');
```

### Escuchar métricas
```javascript
socket.on('metrics-update', (data) => {
    console.log('Comentarios/min:', data.commentsPerMinute);
    console.log('Engagement rate:', data.engagementRate);
});
```

### Sentiment analysis
```javascript
socket.on('sentiment-update', (data) => {
    console.log('Positivo:', data.positivePercent + '%');
    console.log('Neutral:', data.neutralPercent + '%');
    console.log('Negativo:', data.negativePercent + '%');
});
```

## 🎨 Características del Dashboard

### Analytics Dashboard
- **Diseño moderno** con glassmorphism
- **Tema oscuro** optimizado para streaming
- **Responsive design** para mobile
- **Animaciones suaves** en tiempo real
- **Gradientes TikTok** (#fe2c55, #ff6b9d)

### Widgets
1. **Stats Cards** - 8 métricas principales
2. **Sentiment Gauge** - Análisis de sentimientos
3. **Viewers Chart** - Gráfico de líneas temporal
4. **Engagement Chart** - Barras comparativas
5. **Sentiment Donut** - Distribución circular
6. **Leaderboards** - Top 10 rankings
7. **Live Chat** - Feed en tiempo real con badges

## ⚙️ Variables de Entorno

```bash
PORT=3000  # Puerto del servidor (opcional)
```

## 📊 Métricas Calculadas

### Engagement Rate
```javascript
engagementRate = (comentarios + likes + shares) / viewers * 100
```

### Peak Viewers
```javascript
peakViewers = Math.max(...viewerHistory)
```

### Earnings (Diamantes)
```javascript
totalEarnings = Σ(regalo.diamantes * regalo.cantidad)
```

## 🔒 Notas Importantes

- ⚠️ El usuario de TikTok **debe estar en LIVE** al momento de conectar
- 🔌 La conexión usa APIs no oficiales vía `tiktok-live-connector`
- 💎 Los regalos se cuentan cuando `repeat_end === 1` (completos)
- ⏱️ Las métricas por minuto se calculan cada 60 segundos
- 📦 El historial se limita a últimos 60 minutos para optimizar memoria

## 🛠️ Troubleshooting

### Error: "Failed to connect"
- Verificar que el usuario esté en LIVE activo
- Asegurar que el username sea correcto (sin @)
- Revisar conexión a internet

### No se muestran métricas
- Abrir consola del navegador (F12)
- Verificar que Socket.IO esté conectado
- Revisar logs del servidor

### Sentiment no funciona
- Verificar que `sentiment` esté instalado: `npm list sentiment`
- Reinstalar: `npm install sentiment`

## 📚 Documentación Adicional

Ver [CLAUDE.md](CLAUDE.md) para documentación técnica completa incluyendo:
- Arquitectura del sistema
- Roadmap de features avanzadas
- Stack tecnológico recomendado
- Implementación por fases
- Fórmulas de métricas calculadas

## 🚧 Roadmap

### Fase 2: Advanced Metrics
- [ ] Retention rate tracking
- [ ] Average watch time
- [ ] Conversion funnel analytics

### Fase 3: Data Persistence
- [ ] MongoDB integration
- [ ] Historical analytics
- [ ] Session comparison
- [ ] Export to CSV/PDF

### Fase 4: AI & ML
- [ ] Predictive analytics
- [ ] Trending keywords extraction
- [ ] Multi-language detection
- [ ] Toxicity filtering

### Fase 5: Enterprise Features
- [ ] Multi-stream monitoring
- [ ] Webhooks & alerts
- [ ] REST API
- [ ] User authentication

## 📄 Licencia

ISC

## 🤝 Contribuir

1. Fork el proyecto
2. Crear feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a branch (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📞 Soporte

Para bugs o feature requests, abrir un issue en el repositorio.

---

Hecho con ❤️ usando [tiktok-live-connector](https://github.com/zerodytrash/TikTok-Live-Connector)
