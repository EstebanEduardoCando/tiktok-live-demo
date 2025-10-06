const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { WebcastPushConnection } = require('tiktok-live-connector');
const Sentiment = require('sentiment');
const stringSimilarity = require('string-similarity');

const sentiment = new Sentiment();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

// Configuración - CAMBIA ESTO por tu usuario de TikTok
const TIKTOK_USERNAME = '@tuusuario'; // Sin el @, solo el nombre

let tiktokConnection = null;
let sessionStartTime = null;
let stats = {
    viewers: 0,
    likes: 0,
    totalGifts: 0,
    followers: 0,
    shares: 0,
    totalComments: 0,
    totalDiamonds: 0,
    peakViewers: 0,
    uniqueViewers: new Set(),
    uniqueCommenters: new Set()
};

// Tracking temporal para métricas por minuto
let timeSeriesData = {
    viewerHistory: [],
    commentsPerMinute: [],
    likesPerMinute: [],
    giftsPerMinute: [],
    timestamps: []
};

// Leaderboards
let leaderboards = {
    topCommenters: {}, // { username: count }
    topDonors: {}      // { username: totalDiamonds }
};

// Sentiment tracking
let sentimentStats = {
    positive: 0,
    neutral: 0,
    negative: 0,
    totalScore: 0,
    messagesAnalyzed: 0
};

// Bot detection tracking
let userBehavior = {}; // { username: { messages, timestamps, botScore, etc } }
let botStats = {
    totalUsers: 0,
    suspectedBots: 0,
    confirmedBots: 0,
    botList: []
};

// Contador temporal para cálculos por minuto
let currentMinuteStats = {
    comments: 0,
    likes: 0,
    gifts: 0,
    startTime: Date.now()
};

// Función para calcular métricas por minuto
function calculatePerMinuteMetrics() {
    const now = Date.now();
    const elapsed = (now - currentMinuteStats.startTime) / 1000; // segundos

    if (elapsed >= 60) {
        // Guardar datos del último minuto
        timeSeriesData.commentsPerMinute.push(currentMinuteStats.comments);
        timeSeriesData.likesPerMinute.push(currentMinuteStats.likes);
        timeSeriesData.giftsPerMinute.push(currentMinuteStats.gifts);
        timeSeriesData.viewerHistory.push(stats.viewers);
        timeSeriesData.timestamps.push(new Date().toISOString());

        // Limitar a últimos 60 minutos
        if (timeSeriesData.timestamps.length > 60) {
            timeSeriesData.commentsPerMinute.shift();
            timeSeriesData.likesPerMinute.shift();
            timeSeriesData.giftsPerMinute.shift();
            timeSeriesData.viewerHistory.shift();
            timeSeriesData.timestamps.shift();
        }

        // Emitir métricas calculadas
        io.emit('metrics-update', {
            commentsPerMinute: currentMinuteStats.comments,
            likesPerMinute: currentMinuteStats.likes,
            giftsPerMinute: currentMinuteStats.gifts,
            engagementRate: stats.viewers > 0 ?
                ((currentMinuteStats.comments + currentMinuteStats.likes) / stats.viewers * 100).toFixed(2) : 0
        });

        // Reset contador
        currentMinuteStats = {
            comments: 0,
            likes: 0,
            gifts: 0,
            startTime: now
        };
    }
}

// Interval para cálculos por minuto
setInterval(calculatePerMinuteMetrics, 10000); // Revisar cada 10 segundos

// Función para obtener top N de un objeto
function getTopN(obj, n = 10) {
    return Object.entries(obj)
        .sort(([, a], [, b]) => b - a)
        .slice(0, n)
        .map(([username, value]) => ({ username, value }));
}

// ========== BOT DETECTION FUNCTIONS ==========

// Detectar si username es genérico (patrón de bot)
function isGenericUsername(username) {
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

// Calcular varianza de intervalos
function calculateVariance(values) {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance); // Desviación estándar
}

// Calcular similitud promedio entre mensajes
function calculateAverageSimilarity(messages) {
    if (messages.length < 2) return 0;

    let totalSimilarity = 0;
    let comparisons = 0;

    for (let i = 0; i < messages.length; i++) {
        for (let j = i + 1; j < messages.length; j++) {
            totalSimilarity += stringSimilarity.compareTwoStrings(messages[i], messages[j]);
            comparisons++;
        }
    }

    return comparisons > 0 ? totalSimilarity / comparisons : 0;
}

// Detectar bursts de mensajes
function detectMessageBursts(timestamps, windowMs = 10000, threshold = 5) {
    if (timestamps.length < threshold) return false;

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
            return true;
        }
    }

    return false;
}

// Calcular complejidad del texto
function calculateTextComplexity(message) {
    const words = message.trim().split(/\s+/);
    if (words.length === 0) return 0;

    const uniqueWords = new Set(words).size;
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;

    const complexityScore =
        (uniqueWords / words.length) * // Lexical diversity
        (avgWordLength / 5) *          // Word length
        (words.length / 3);            // Message length

    return complexityScore;
}

// Calcular bot score para un usuario
function calculateBotScore(userData) {
    if (!userData || userData.totalMessages < 3) return 0; // Necesita al menos 3 mensajes

    let botScore = 0;
    const weights = {
        messageFrequency: 0.25,
        contentRepetition: 0.20,
        textComplexity: 0.15,
        interactionPattern: 0.15,
        usernamePattern: 0.15,
        similarity: 0.10
    };

    // 1. Frecuencia de mensajes (intervalos uniformes)
    if (userData.intervals.length > 1) {
        const intervalVariance = calculateVariance(userData.intervals);

        if (intervalVariance < 2) { // Menos de 2 segundos de variación
            botScore += weights.messageFrequency * 100;
        } else if (intervalVariance < 5) {
            botScore += weights.messageFrequency * 70;
        } else if (intervalVariance < 10) {
            botScore += weights.messageFrequency * 40;
        } else {
            botScore += weights.messageFrequency * 10;
        }
    }

    // 2. Repetición de contenido
    const uniqueRatio = userData.uniqueMessages.size / userData.totalMessages;
    const repetitionScore = (1 - uniqueRatio) * 100;
    botScore += weights.contentRepetition * repetitionScore;

    // 3. Similitud de mensajes
    const avgSimilarity = calculateAverageSimilarity(userData.messages);
    if (avgSimilarity > 0.8) {
        botScore += weights.similarity * 100;
    } else if (avgSimilarity > 0.6) {
        botScore += weights.similarity * 70;
    } else if (avgSimilarity > 0.4) {
        botScore += weights.similarity * 40;
    }

    // 4. Patrón de username
    if (isGenericUsername(userData.username)) {
        botScore += weights.usernamePattern * 100;
    }

    // 5. Complejidad del texto
    const avgComplexity = userData.messages.reduce((sum, msg) =>
        sum + calculateTextComplexity(msg), 0) / userData.messages.length;

    if (avgComplexity < 1) {
        botScore += weights.textComplexity * 100;
    } else if (avgComplexity < 2) {
        botScore += weights.textComplexity * 60;
    } else if (avgComplexity < 3) {
        botScore += weights.textComplexity * 30;
    }

    // 6. Burst detection
    const hasBursts = detectMessageBursts(userData.timestamps);
    if (hasBursts) {
        botScore += weights.interactionPattern * 80;
    }

    return Math.min(100, Math.round(botScore));
}

// Clasificar usuario basado en bot score
function classifyUser(botScore) {
    if (botScore >= 80) return 'confirmed_bot';
    if (botScore >= 60) return 'likely_bot';
    if (botScore >= 30) return 'suspicious';
    return 'human';
}

// Actualizar estadísticas de bots
function updateBotStats() {
    const users = Object.values(userBehavior);

    botStats.totalUsers = users.length;
    botStats.suspectedBots = users.filter(u => u.botScore >= 30 && u.botScore < 80).length;
    botStats.confirmedBots = users.filter(u => u.botScore >= 80).length;

    // Lista de bots ordenada por score
    botStats.botList = users
        .filter(u => u.botScore >= 30)
        .sort((a, b) => b.botScore - a.botScore)
        .slice(0, 20)
        .map(u => ({
            username: u.username,
            botScore: u.botScore,
            classification: u.classification,
            messageCount: u.totalMessages,
            repetitionRate: ((1 - u.uniqueMessages.size / u.totalMessages) * 100).toFixed(1)
        }));
}

// Almacenamiento para roomInfo y availableGifts
let roomInfo = null;
let availableGifts = [];

// Constantes de conversión de revenue
const REVENUE_CONFIG = {
    diamondToUSD: 0.005,        // 1 diamante = $0.005 USD
    creatorCut: 0.50,           // Creador recibe 50%
    tiktokCut: 0.50             // TikTok se queda con 50%
};

// Función para calcular revenue
function calculateRevenue(diamonds) {
    const totalUSD = diamonds * REVENUE_CONFIG.diamondToUSD;
    const creatorEarnings = totalUSD * REVENUE_CONFIG.creatorCut;
    const tiktokEarnings = totalUSD * REVENUE_CONFIG.tiktokCut;

    return {
        totalUSD: totalUSD.toFixed(2),
        creatorEarnings: creatorEarnings.toFixed(2),
        tiktokEarnings: tiktokEarnings.toFixed(2),
        diamonds: diamonds
    };
}

// Función para conectar a TikTok LIVE
function connectToTikTok(username) {
    tiktokConnection = new WebcastPushConnection(username, {
        enableExtendedGiftInfo: true,      // ← INFO EXTENDIDA DE REGALOS
        fetchRoomInfoOnConnect: true,      // ← OBTENER INFO DE LA SALA
        processInitialData: true           // ← PROCESAR DATOS INICIALES
    });
    sessionStartTime = new Date();

    // Reset stats al conectar
    stats = {
        viewers: 0,
        likes: 0,
        totalGifts: 0,
        followers: 0,
        shares: 0,
        totalComments: 0,
        totalDiamonds: 0,
        peakViewers: 0,
        uniqueViewers: new Set(),
        uniqueCommenters: new Set()
    };

    leaderboards = {
        topCommenters: {},
        topDonors: {}
    };

    // Cuando se conecta
    tiktokConnection.connect().then(state => {
        console.log(`✅ Conectado a @${state.roomId}`);

        // Capturar roomInfo si está disponible
        if (state.roomInfo) {
            roomInfo = state.roomInfo;
            console.log('📋 RoomInfo capturado:', {
                roomId: roomInfo.id || roomInfo.room_id,
                title: roomInfo.title,
                ownerUsername: roomInfo.owner?.uniqueId || roomInfo.owner?.unique_id,
                ownerNickname: roomInfo.owner?.nickname,
                viewerCount: roomInfo.stats?.viewerCount || roomInfo.user_count,
                likes: roomInfo.stats?.likeCount || roomInfo.like_count
            });

            // Emitir roomInfo al cliente
            io.emit('room-info', {
                roomId: roomInfo.id || roomInfo.room_id,
                title: roomInfo.title,
                owner: {
                    username: roomInfo.owner?.uniqueId || roomInfo.owner?.unique_id,
                    nickname: roomInfo.owner?.nickname,
                    avatarUrl: roomInfo.owner?.profilePictureUrl || roomInfo.owner?.avatar_thumb?.url_list?.[0],
                    verified: roomInfo.owner?.verified,
                    followerCount: roomInfo.owner?.followerCount || roomInfo.owner?.follower_count
                },
                stats: {
                    viewerCount: roomInfo.stats?.viewerCount || roomInfo.user_count,
                    likeCount: roomInfo.stats?.likeCount || roomInfo.like_count,
                    totalViews: roomInfo.stats?.totalViews || roomInfo.total_user
                },
                liveStatus: roomInfo.status,
                startTime: roomInfo.create_time || roomInfo.createTime
            });
        }

        // Capturar availableGifts si está disponible
        if (state.availableGifts) {
            availableGifts = state.availableGifts;
            console.log(`🎁 Catálogo de regalos capturado: ${availableGifts.length} regalos disponibles`);

            // Log primeros 5 regalos para debug
            availableGifts.slice(0, 5).forEach(gift => {
                console.log(`  - ${gift.name}: ${gift.diamond_count} diamantes (ID: ${gift.id})`);
            });

            // Emitir catálogo al cliente
            io.emit('available-gifts', {
                total: availableGifts.length,
                gifts: availableGifts.map(gift => ({
                    id: gift.id,
                    name: gift.name,
                    diamonds: gift.diamond_count,
                    imageUrl: gift.icon?.url_list?.[0] || gift.image?.url_list?.[0],
                    type: gift.type,
                    description: gift.describe
                }))
            });
        }

        io.emit('status', {
            connected: true,
            username: username,
            startTime: sessionStartTime,
            hasRoomInfo: !!roomInfo,
            giftsCount: availableGifts.length
        });
    }).catch(err => {
        console.error('❌ Error conectando:', err);
        io.emit('status', { connected: false, error: err.message });
    });

    // Evento: Conectado
    tiktokConnection.on('connected', () => {
        console.log('🔴 LIVE conectado!');
    });

    // Evento: Desconectado
    tiktokConnection.on('disconnected', () => {
        console.log('⚫ LIVE desconectado');
        io.emit('status', { connected: false });
    });

    // Evento: Mensajes del chat
    tiktokConnection.on('chat', data => {
        console.log(`💬 ${data.uniqueId}: ${data.comment}`);

        const username = data.uniqueId;
        const message = data.comment;
        const timestamp = Date.now();

        // Actualizar stats
        stats.totalComments++;
        stats.uniqueCommenters.add(username);
        currentMinuteStats.comments++;

        // Actualizar leaderboard
        leaderboards.topCommenters[username] = (leaderboards.topCommenters[username] || 0) + 1;

        // ===== BOT DETECTION =====
        // Inicializar tracking de usuario si es nuevo
        if (!userBehavior[username]) {
            userBehavior[username] = {
                username: username,
                messages: [],
                timestamps: [],
                intervals: [],
                uniqueMessages: new Set(),
                totalMessages: 0,
                botScore: 0,
                classification: 'human'
            };
        }

        const userData = userBehavior[username];

        // Agregar mensaje
        userData.messages.push(message);
        userData.timestamps.push(timestamp);
        userData.uniqueMessages.add(message.toLowerCase().trim());
        userData.totalMessages++;

        // Calcular intervalo si no es el primer mensaje
        if (userData.timestamps.length > 1) {
            const interval = (timestamp - userData.timestamps[userData.timestamps.length - 2]) / 1000; // segundos
            userData.intervals.push(interval);
        }

        // Recalcular bot score (solo cada 3 mensajes para optimizar)
        if (userData.totalMessages >= 3 && userData.totalMessages % 3 === 0) {
            userData.botScore = calculateBotScore(userData);
            userData.classification = classifyUser(userData.botScore);

            // Log si se detecta bot
            if (userData.botScore >= 60) {
                console.log(`🤖 Bot detectado: ${username} (Score: ${userData.botScore})`);
            }

            // Actualizar stats globales de bots
            updateBotStats();

            // Emitir actualización de bot stats
            io.emit('bot-stats-update', {
                totalUsers: botStats.totalUsers,
                suspectedBots: botStats.suspectedBots,
                confirmedBots: botStats.confirmedBots,
                botPercentage: botStats.totalUsers > 0 ?
                    ((botStats.confirmedBots + botStats.suspectedBots) / botStats.totalUsers * 100).toFixed(1) : 0,
                botList: botStats.botList.slice(0, 10)
            });
        }

        // Sentiment analysis
        const sentimentResult = sentiment.analyze(data.comment);
        let sentimentLabel = 'neutral';

        if (sentimentResult.score > 0) {
            sentimentStats.positive++;
            sentimentLabel = 'positive';
        } else if (sentimentResult.score < 0) {
            sentimentStats.negative++;
            sentimentLabel = 'negative';
        } else {
            sentimentStats.neutral++;
        }

        sentimentStats.totalScore += sentimentResult.score;
        sentimentStats.messagesAnalyzed++;

        // Emitir mensaje con sentiment y bot detection
        io.emit('chat-message', {
            username: data.uniqueId,
            message: data.comment,
            profilePicture: data.profilePictureUrl,
            timestamp: new Date(),
            sentiment: sentimentLabel,
            sentimentScore: sentimentResult.score,
            botScore: userData.botScore,
            isBot: userData.classification !== 'human'
        });

        // Emitir sentiment stats actualizados
        io.emit('sentiment-update', {
            positive: sentimentStats.positive,
            neutral: sentimentStats.neutral,
            negative: sentimentStats.negative,
            averageScore: sentimentStats.messagesAnalyzed > 0 ?
                (sentimentStats.totalScore / sentimentStats.messagesAnalyzed).toFixed(2) : 0,
            positivePercent: sentimentStats.messagesAnalyzed > 0 ?
                ((sentimentStats.positive / sentimentStats.messagesAnalyzed) * 100).toFixed(1) : 0,
            neutralPercent: sentimentStats.messagesAnalyzed > 0 ?
                ((sentimentStats.neutral / sentimentStats.messagesAnalyzed) * 100).toFixed(1) : 0,
            negativePercent: sentimentStats.messagesAnalyzed > 0 ?
                ((sentimentStats.negative / sentimentStats.messagesAnalyzed) * 100).toFixed(1) : 0
        });

        // Emitir leaderboards actualizados
        io.emit('leaderboards-update', {
            topCommenters: getTopN(leaderboards.topCommenters, 10),
            topDonors: getTopN(leaderboards.topDonors, 10)
        });
    });

    // Evento: Likes
    tiktokConnection.on('like', data => {
        const likeCount = data.likeCount || 1;
        stats.likes += likeCount;
        currentMinuteStats.likes += likeCount;

        console.log(`❤️ ${data.uniqueId} envió ${likeCount} likes (Total: ${stats.likes})`);

        io.emit('like', {
            username: data.uniqueId,
            count: likeCount,
            total: stats.likes
        });
    });

    // Evento: Regalos
    tiktokConnection.on('gift', data => {
        // Log del objeto COMPLETO del evento (incluyendo extendedGiftInfo)
        console.log('🎁 [DEBUG] Evento gift completo:', JSON.stringify({
            uniqueId: data.uniqueId,
            giftId: data.giftId,
            repeatCount: data.repeatCount,
            repeatEnd: data.repeatEnd,
            gift: data.gift,
            extendedGiftInfo: data.extendedGiftInfo,  // ← INFO EXTENDIDA
            giftName: data.giftName,
            diamondCount: data.diamondCount,
            giftType: data.giftType,
            giftPictureUrl: data.giftPictureUrl
        }, null, 2));

        // Contar regalos tanto en progreso como completados
        // Los datos pueden estar en data.gift O directamente en data
        const isStreakFinished = data.repeatEnd === 1 || data.gift?.repeat_end === 1;

        // CAMBIO: Ahora contamos todos los regalos, no solo los terminados
        if (true) {  // Siempre procesar
            console.log(`📌 Procesando regalo - Streak finished: ${isStreakFinished}`);
            const giftCount = data.repeatCount || data.gift?.repeat_count || 1;

            // TikTok puede usar diferentes campos para el valor
            const diamondCount = data.diamondCount ||
                                data.gift?.diamond_count ||
                                data.gift?.diamondCount ||
                                data.extendedGiftInfo?.diamond_count ||
                                0;

            const diamondValue = diamondCount * giftCount;

            stats.totalGifts += giftCount;
            stats.totalDiamonds += diamondValue;
            currentMinuteStats.gifts += giftCount;

            // Actualizar leaderboard de donadores
            leaderboards.topDonors[data.uniqueId] = (leaderboards.topDonors[data.uniqueId] || 0) + diamondValue;

            const giftName = data.giftName || data.gift?.name || 'Regalo';
            const giftImage = data.giftPictureUrl ||
                            data.gift?.image?.url_list?.[0] ||
                            data.gift?.icon?.url_list?.[0];

            console.log(`🎁 ${data.uniqueId} envió ${giftCount}x ${giftName} (${diamondCount} diamantes c/u) = ${diamondValue} total`);
            console.log(`📊 Stats actualizados: totalGifts=${stats.totalGifts}, totalDiamonds=${stats.totalDiamonds}`);

            // Calcular revenue
            const revenue = calculateRevenue(stats.totalDiamonds);
            console.log(`💰 Revenue actualizado: $${revenue.totalUSD} (Creador: $${revenue.creatorEarnings})`);

            io.emit('gift', {
                username: data.uniqueId,
                giftName: giftName,
                giftImage: giftImage,
                count: giftCount,
                diamonds: diamondCount,
                totalValue: diamondValue,
                profilePicture: data.profilePictureUrl,
                revenue: {
                    usd: (diamondValue * REVENUE_CONFIG.diamondToUSD).toFixed(2),
                    creatorEarnings: (diamondValue * REVENUE_CONFIG.diamondToUSD * REVENUE_CONFIG.creatorCut).toFixed(2)
                }
            });

            // Emitir stats actualizados inmediatamente después del regalo
            io.emit('stats-update', {
                ...stats,
                uniqueViewers: stats.uniqueViewers.size,
                uniqueCommenters: stats.uniqueCommenters.size,
                sessionDuration: sessionStartTime ? (new Date() - sessionStartTime) / 1000 / 60 : 0
            });

            // Emitir revenue analytics
            const sessionDurationMinutes = sessionStartTime ? (new Date() - sessionStartTime) / 1000 / 60 : 1;
            io.emit('revenue-update', {
                ...revenue,
                revenuePerMinute: (revenue.totalUSD / sessionDurationMinutes).toFixed(2),
                revenuePerViewer: stats.viewers > 0 ? (revenue.totalUSD / stats.viewers).toFixed(4) : 0,
                projectedHourly: (revenue.totalUSD / sessionDurationMinutes * 60).toFixed(2),
                projectedDaily: (revenue.totalUSD / sessionDurationMinutes * 60 * 24).toFixed(2)
            });

            // Emitir leaderboards actualizados
            io.emit('leaderboards-update', {
                topCommenters: getTopN(leaderboards.topCommenters, 10),
                topDonors: getTopN(leaderboards.topDonors, 10)
            });
        }
    });

    // Evento: Nuevos seguidores
    tiktokConnection.on('follow', data => {
        stats.followers++;
        console.log(`👤 ${data.uniqueId} está siguiendo!`);
        
        io.emit('follow', {
            username: data.uniqueId,
            profilePicture: data.profilePictureUrl
        });
    });

    // Evento: Share
    tiktokConnection.on('share', data => {
        stats.shares++;
        console.log(`📤 ${data.uniqueId} compartió el LIVE!`);

        io.emit('share', {
            username: data.uniqueId,
            total: stats.shares
        });
    });

    // Evento: Viewer count
    tiktokConnection.on('roomUser', data => {
        stats.viewers = data.viewerCount || 0;

        // Actualizar peak viewers
        if (stats.viewers > stats.peakViewers) {
            stats.peakViewers = stats.viewers;
        }

        io.emit('viewers', {
            count: stats.viewers,
            peak: stats.peakViewers
        });
    });

    // Evento: Join (alguien entra al LIVE)
    tiktokConnection.on('member', data => {
        console.log(`🚪 ${data.uniqueId} entró al LIVE`);

        // Rastrear viewers únicos
        stats.uniqueViewers.add(data.uniqueId);

        io.emit('member-join', {
            username: data.uniqueId,
            profilePicture: data.profilePictureUrl,
            uniqueViewers: stats.uniqueViewers.size
        });
    });

    // Evento: Preguntas Q&A (nuevo)
    tiktokConnection.on('question', data => {
        console.log(`❓ ${data.uniqueId} preguntó: ${data.questionText}`);

        io.emit('question', {
            username: data.uniqueId,
            question: data.questionText,
            timestamp: new Date()
        });
    });

    // Evento: Stream End (nuevo)
    tiktokConnection.on('streamEnd', () => {
        console.log('🔴 El LIVE ha terminado');

        const sessionDuration = sessionStartTime ? (new Date() - sessionStartTime) / 1000 / 60 : 0; // minutos

        io.emit('stream-end', {
            duration: sessionDuration,
            finalStats: {
                ...stats,
                uniqueViewers: stats.uniqueViewers.size,
                uniqueCommenters: stats.uniqueCommenters.size
            }
        });
    });

    // Evento: Errores
    tiktokConnection.on('error', err => {
        console.error('❌ Error:', err);
        io.emit('error', { message: err.message });
    });
}

// Socket.IO
io.on('connection', (socket) => {
    console.log('🎮 Cliente conectado');

    // Enviar stats actuales al conectarse
    socket.emit('stats-update', {
        ...stats,
        uniqueViewers: stats.uniqueViewers.size,
        uniqueCommenters: stats.uniqueCommenters.size,
        sessionDuration: sessionStartTime ? (new Date() - sessionStartTime) / 1000 / 60 : 0
    });

    // Enviar time series data
    socket.emit('timeseries-update', timeSeriesData);

    // Enviar leaderboards
    socket.emit('leaderboards-update', {
        topCommenters: getTopN(leaderboards.topCommenters, 10),
        topDonors: getTopN(leaderboards.topDonors, 10)
    });

    // Permitir que el cliente inicie la conexión
    socket.on('start-connection', (username) => {
        console.log(`Intentando conectar a: ${username}`);
        connectToTikTok(username);
    });

    socket.on('disconnect', () => {
        console.log('👋 Cliente desconectado');
    });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📝 Abre el navegador y ingresa el usuario de TikTok LIVE`);
});

// Cleanup al cerrar
process.on('SIGINT', () => {
    console.log('\n🛑 Cerrando servidor...');
    if (tiktokConnection) {
        tiktokConnection.disconnect();
    }
    process.exit();
});