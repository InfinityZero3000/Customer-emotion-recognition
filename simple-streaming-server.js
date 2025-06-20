const { WebSocketServer } = require('ws');
const { v4: uuidv4 } = require('uuid');
const http = require('http');
const url = require('url');

// Simple streaming server without complex dependencies
class SimpleStreamingServer {
  constructor(port = 8080) {
    this.port = port;
    this.clients = new Map();
    this.userSessions = new Map();
    this.server = null;
    this.wss = null;
  }

  start() {
    this.server = http.createServer();
    this.wss = new WebSocketServer({ server: this.server });

    this.wss.on('connection', (ws, request) => {
      const { query } = url.parse(request.url, true);
      const userId = query.userId;
      const sessionId = query.sessionId || uuidv4();

      if (!userId) {
        ws.close(1008, 'User ID is required');
        return;
      }

      const clientId = uuidv4();
      const client = {
        id: clientId,
        userId,
        ws,
        sessionId,
        connectedAt: Date.now(),
        lastActivity: Date.now()
      };

      this.clients.set(clientId, client);
      
      if (!this.userSessions.has(userId)) {
        this.userSessions.set(userId, new Set());
      }
      this.userSessions.get(userId).add(clientId);

      console.log(`Client connected: ${clientId} for user ${userId}`);

      // Send welcome message
      this.sendToClient(clientId, {
        type: 'system_message',
        data: { message: 'Connected to emotion streaming service', sessionId },
        timestamp: Date.now(),
        sessionId
      });

      ws.on('message', (data) => {
        this.handleClientMessage(clientId, data);
      });

      ws.on('close', () => {
        this.handleClientDisconnect(clientId);
      });

      ws.on('error', (error) => {
        console.error(`Client ${clientId} error:`, error);
        this.handleClientDisconnect(clientId);
      });
    });

    this.server.listen(this.port, () => {
      console.log(`Streaming server started on port ${this.port}`);
    });

    // Health check endpoint
    this.server.on('request', (req, res) => {
      if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          status: 'healthy', 
          clients: this.clients.size,
          users: this.userSessions.size 
        }));
      }
    });

    this.startHeartbeat();
  }

  handleClientMessage(clientId, data) {
    const client = this.clients.get(clientId);
    if (!client) return;

    client.lastActivity = Date.now();

    try {
      const message = JSON.parse(data.toString());
      
      switch (message.type) {
        case 'ping':
          this.sendToClient(clientId, {
            type: 'system_message',
            data: { message: 'pong' },
            timestamp: Date.now()
          });
          break;
          
        case 'detect_emotion':
          this.handleEmotionDetection(clientId, message.data);
          break;
          
        default:
          console.log(`Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error(`Error parsing message from ${clientId}:`, error);
    }
  }

  handleEmotionDetection(clientId, data) {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Generate mock emotion data
    const emotions = ['happy', 'sad', 'angry', 'surprise', 'neutral', 'fear', 'disgust'];
    const dominantEmotion = emotions[Math.floor(Math.random() * emotions.length)];
    
    const mockEmotion = {
      dominant_emotion: dominantEmotion,
      confidence: Math.random() * 0.4 + 0.6,
      emotions: emotions.reduce((acc, emotion) => {
        acc[emotion] = emotion === dominantEmotion ? 
          Math.random() * 0.4 + 0.6 : 
          Math.random() * 0.2;
        return acc;
      }, {}),
      timestamp: new Date().toISOString()
    };

    // Send emotion result
    this.sendToClient(clientId, {
      type: 'emotion_update',
      data: { emotion: mockEmotion },
      timestamp: Date.now()
    });

    // Generate recommendations
    const recommendations = this.generateRecommendations(mockEmotion);
    this.sendToClient(clientId, {
      type: 'recommendation_update',
      data: { recommendations },
      timestamp: Date.now()
    });
  }

  generateRecommendations(emotion) {
    const categoryMap = {
      happy: ['entertainment', 'food', 'toys'],
      sad: ['comfort', 'books', 'music'],
      angry: ['sports', 'fitness', 'games'],
      surprise: ['tech', 'gadgets', 'novelty'],
      neutral: ['general', 'popular', 'trending'],
      fear: ['security', 'comfort', 'health'],
      disgust: ['cleaning', 'health', 'hygiene']
    };

    const categories = categoryMap[emotion.dominant_emotion] || categoryMap.neutral;
    
    return categories.map(category => ({
      category,
      confidence: Math.random() * 0.3 + 0.7,
      products: Array.from({ length: 3 }, (_, i) => ({
        id: Math.floor(Math.random() * 1000),
        name: `${category} product ${i + 1}`,
        price: Math.floor(Math.random() * 100) + 10,
        category,
        rating: (Math.random() * 2 + 3).toFixed(1),
        image: `https://picsum.photos/200/200?random=${Math.floor(Math.random() * 1000)}`
      })),
      reasoning: `Recommended based on ${emotion.dominant_emotion} emotion`
    }));
  }

  handleClientDisconnect(clientId) {
    const client = this.clients.get(clientId);
    if (!client) return;

    console.log(`Client disconnected: ${clientId}`);

    const userSessions = this.userSessions.get(client.userId);
    if (userSessions) {
      userSessions.delete(clientId);
      if (userSessions.size === 0) {
        this.userSessions.delete(client.userId);
      }
    }

    this.clients.delete(clientId);
  }

  sendToClient(clientId, message) {
    const client = this.clients.get(clientId);
    if (!client || client.ws.readyState !== 1) { // WebSocket.OPEN = 1
      return;
    }

    try {
      client.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error(`Error sending to client ${clientId}:`, error);
      this.handleClientDisconnect(clientId);
    }
  }

  startHeartbeat() {
    setInterval(() => {
      const now = Date.now();
      const staleThreshold = 60000; // 1 minute

      this.clients.forEach((client, clientId) => {
        if (now - client.lastActivity > staleThreshold) {
          console.log(`Removing stale client: ${clientId}`);
          this.handleClientDisconnect(clientId);
        }
      });
    }, 30000); // Check every 30 seconds
  }

  stop() {
    if (this.server) {
      this.server.close();
    }
    console.log('Streaming server stopped');
  }
}

// Start server if this file is run directly
if (require.main === module) {
  const port = process.env.STREAMING_PORT || 8080;
  const server = new SimpleStreamingServer(port);
  
  server.start();
  
  process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    server.stop();
    process.exit(0);
  });
  
  process.on('SIGINT', () => {
    console.log('Received SIGINT, shutting down gracefully...');
    server.stop();
    process.exit(0);
  });
}

module.exports = SimpleStreamingServer;
