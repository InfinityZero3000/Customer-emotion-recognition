import { WebSocket, WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { IncomingMessage } from 'http';
import { EventEmitter } from 'events';

// Local interfaces to avoid circular dependencies
export interface EmotionData {
  dominant_emotion: string;
  confidence: number;
  emotions?: Record<string, number>;
  timestamp?: string;
}

export interface EmotionEvent {
  type: 'EMOTION_DETECTED' | 'PREDICTION_GENERATED' | 'RECOMMENDATION_UPDATED' | 'USER_PATTERN_UPDATED';
  userId: string;
  data: any;
  timestamp: number;
  sessionId?: string;
}

export interface EmotionStreamData {
  emotion: EmotionData;
  recommendations?: any[];
  userPattern?: any;
  timestamp: number;
}

export interface StreamClient {
  id: string;
  userId: string;
  ws: WebSocket;
  sessionId: string;
  connectedAt: number;
  lastActivity: number;
}

export interface StreamMessage {
  type: 'emotion_update' | 'recommendation_update' | 'user_pattern_update' | 'system_message';
  data: any;
  timestamp: number;
  sessionId?: string;
}

// Simple event bus for local communication
class SimpleEventBus extends EventEmitter {
  async publishEmotionDetected(userId: string, emotion: EmotionData, sessionId?: string) {
    const event: EmotionEvent = {
      type: 'EMOTION_DETECTED',
      userId,
      data: emotion,
      timestamp: Date.now(),
      sessionId
    };

    this.emit('emotion:detected', event);
    return event;
  }

  async publishPredictionGenerated(userId: string, predictions: any[], sessionId?: string) {
    const event: EmotionEvent = {
      type: 'PREDICTION_GENERATED',
      userId,
      data: predictions,
      timestamp: Date.now(),
      sessionId
    };

    this.emit('prediction:generated', event);
    return event;
  }

  async getUserEmotionHistory(userId: string, limit: number = 20): Promise<EmotionData[]> {
    // Mock implementation
    return [];
  }

  async getUserEmotionPattern(userId: string): Promise<any> {
    // Mock implementation
    return {
      dominantEmotions: {},
      emotionFrequency: {},
      totalSessions: 0,
      lastUpdated: new Date()
    };
  }

  async disconnect(): Promise<void> {
    // Mock implementation
  }
}

export class EmotionStreamProcessor {
  private clients: Map<string, StreamClient> = new Map();
  private userSessions: Map<string, Set<string>> = new Map();
  private wss: WebSocketServer;
  private eventBus: SimpleEventBus;
  private heartbeatInterval?: NodeJS.Timeout;

  constructor(port: number = 8080, eventBus?: SimpleEventBus) {
    this.wss = new WebSocketServer({ port });
    this.eventBus = eventBus || new SimpleEventBus();
    
    this.setupWebSocketServer();
    this.setupEventListeners();
    this.startHeartbeat();
    
    console.log(`Emotion streaming server started on port ${port}`);
  }

  private setupWebSocketServer() {
    this.wss.on('connection', (ws: WebSocket, request: IncomingMessage) => {
      const url = new URL(request.url || '', `http://${request.headers.host}`);
      const userId = url.searchParams.get('userId');
      const sessionId = url.searchParams.get('sessionId') || uuidv4();

      if (!userId) {
        ws.close(1008, 'User ID is required');
        return;
      }

      const clientId = uuidv4();
      const client: StreamClient = {
        id: clientId,
        userId,
        ws,
        sessionId,
        connectedAt: Date.now(),
        lastActivity: Date.now()
      };

      this.clients.set(clientId, client);
      
      // Track user sessions
      if (!this.userSessions.has(userId)) {
        this.userSessions.set(userId, new Set());
      }
      this.userSessions.get(userId)!.add(clientId);

      console.log(`Client connected: ${clientId} for user ${userId}`);

      // Send welcome message
      this.sendToClient(clientId, {
        type: 'system_message',
        data: { message: 'Connected to emotion streaming service', sessionId },
        timestamp: Date.now(),
        sessionId
      });

      // Handle client messages
      ws.on('message', (data: any) => {
        this.handleClientMessage(clientId, data);
      });

      // Handle client disconnect
      ws.on('close', () => {
        this.handleClientDisconnect(clientId);
      });

      // Handle client errors
      ws.on('error', (error: Error) => {
        console.error(`Client ${clientId} error:`, error);
        this.handleClientDisconnect(clientId);
      });
    });
  }

  private setupEventListeners() {
    // Listen to emotion detection events
    this.eventBus.on('emotion:detected', (event: EmotionEvent) => {
      this.handleEmotionDetected(event);
    });

    // Listen to prediction events
    this.eventBus.on('prediction:generated', (event: EmotionEvent) => {
      this.handlePredictionGenerated(event);
    });
  }

  private handleClientMessage(clientId: string, data: any) {
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
      console.error(`Error parsing client message from ${clientId}:`, error);
    }
  }

  private async handleEmotionDetection(clientId: string, data: any) {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Mock emotion detection result
    const mockEmotion: EmotionData = {
      dominant_emotion: ['happy', 'sad', 'angry', 'surprise', 'neutral'][Math.floor(Math.random() * 5)],
      confidence: Math.random() * 0.4 + 0.6, // 0.6 to 1.0
      emotions: {
        happy: Math.random() * 0.3,
        sad: Math.random() * 0.3,
        angry: Math.random() * 0.3,
        surprise: Math.random() * 0.3,
        neutral: Math.random() * 0.3
      },
      timestamp: new Date().toISOString()
    };

    // Send back to client
    this.sendToClient(clientId, {
      type: 'emotion_update',
      data: { emotion: mockEmotion },
      timestamp: Date.now()
    });

    // Generate mock recommendations
    const mockRecommendations = this.generateMockRecommendations(mockEmotion);
    
    this.sendToClient(clientId, {
      type: 'recommendation_update',
      data: { recommendations: mockRecommendations },
      timestamp: Date.now()
    });
  }

  private generateMockRecommendations(emotion: EmotionData) {
    const categoryMap: Record<string, string[]> = {
      happy: ['entertainment', 'food', 'toys'],
      sad: ['comfort', 'books', 'music'],
      angry: ['sports', 'fitness', 'games'],
      surprise: ['tech', 'gadgets', 'novelty'],
      neutral: ['general', 'popular', 'trending']
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

  private handleClientDisconnect(clientId: string) {
    const client = this.clients.get(clientId);
    if (!client) return;

    console.log(`Client disconnected: ${clientId}`);

    // Remove from user sessions
    const userSessions = this.userSessions.get(client.userId);
    if (userSessions) {
      userSessions.delete(clientId);
      if (userSessions.size === 0) {
        this.userSessions.delete(client.userId);
      }
    }

    // Remove client
    this.clients.delete(clientId);
  }

  private handleEmotionDetected(event: EmotionEvent) {
    const message: StreamMessage = {
      type: 'emotion_update',
      data: {
        emotion: event.data,
        userId: event.userId,
        sessionId: event.sessionId
      },
      timestamp: event.timestamp,
      sessionId: event.sessionId
    };

    this.broadcastToUser(event.userId, message);
  }

  private handlePredictionGenerated(event: EmotionEvent) {
    const message: StreamMessage = {
      type: 'recommendation_update',
      data: {
        predictions: event.data,
        userId: event.userId,
        sessionId: event.sessionId
      },
      timestamp: event.timestamp,
      sessionId: event.sessionId
    };

    this.broadcastToUser(event.userId, message);
  }

  private sendToClient(clientId: string, message: StreamMessage) {
    const client = this.clients.get(clientId);
    if (!client || client.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      client.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error(`Error sending message to client ${clientId}:`, error);
      this.handleClientDisconnect(clientId);
    }
  }

  private broadcastToUser(userId: string, message: StreamMessage) {
    const userSessions = this.userSessions.get(userId);
    if (!userSessions) return;

    userSessions.forEach(clientId => {
      this.sendToClient(clientId, message);
    });
  }

  public async processEmotionStream(userId: string, emotionData: EmotionData, sessionId?: string) {
    // Publish emotion detected event
    await this.eventBus.publishEmotionDetected(userId, emotionData, sessionId);

    // Generate predictions
    const predictions = this.generateMockRecommendations(emotionData);
    await this.eventBus.publishPredictionGenerated(userId, predictions, sessionId);

    return {
      emotion: emotionData,
      predictions,
      timestamp: Date.now()
    };
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
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

  public getStats() {
    return {
      totalClients: this.clients.size,
      totalUsers: this.userSessions.size,
      connections: Array.from(this.clients.values()).map(client => ({
        id: client.id,
        userId: client.userId,
        sessionId: client.sessionId,
        connectedAt: client.connectedAt,
        lastActivity: client.lastActivity
      }))
    };
  }

  public async shutdown() {
    console.log('Shutting down emotion streaming server...');
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    // Close all client connections
    this.clients.forEach((client) => {
      client.ws.close(1001, 'Server shutting down');
    });
    
    // Close WebSocket server
    this.wss.close();
    
    // Disconnect event bus
    await this.eventBus.disconnect();
    
    console.log('Emotion streaming server shut down complete');
  }
}

export default EmotionStreamProcessor;
