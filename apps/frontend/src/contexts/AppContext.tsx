'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';

// Types for application state
export interface EmotionDetection {
  emotion: string;
  confidence: number;
  timestamp: number;
  id: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  preferences: {
    autoDetection: boolean;
    notifications: boolean;
    theme: 'light' | 'dark' | 'auto';
    language: string;
  };
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  rating: number;
  emotionRecommendation?: string;
  confidence?: number;
}

export interface AppState {
  // User state
  user: User | null;
  isAuthenticated: boolean;
  
  // Emotion detection state
  currentEmotion: EmotionDetection | null;
  emotionHistory: EmotionDetection[];
  isDetecting: boolean;
  detectionError: string | null;
  
  // Product recommendations
  recommendations: Product[];
  loadingRecommendations: boolean;
  
  // System state
  isOnline: boolean;
  systemHealth: {
    emotionService: boolean;
    recommendationService: boolean;
    lastCheck: number;
  };
  
  // UI state
  sidebarCollapsed: boolean;
  activeView: 'dashboard' | 'history' | 'insights' | 'recommendations' | 'settings';
  
  // Settings
  settings: {
    detectionInterval: number;
    confidenceThreshold: number;
    maxHistoryItems: number;
    enableNotifications: boolean;
    autoRecommendations: boolean;
  };
}

// Action types
export type AppAction =
  | { type: 'SET_USER'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'SET_CURRENT_EMOTION'; payload: EmotionDetection }
  | { type: 'ADD_EMOTION_TO_HISTORY'; payload: EmotionDetection }
  | { type: 'CLEAR_EMOTION_HISTORY' }
  | { type: 'SET_DETECTING'; payload: boolean }
  | { type: 'SET_DETECTION_ERROR'; payload: string | null }
  | { type: 'SET_RECOMMENDATIONS'; payload: Product[] }
  | { type: 'SET_LOADING_RECOMMENDATIONS'; payload: boolean }
  | { type: 'SET_ONLINE_STATUS'; payload: boolean }
  | { type: 'UPDATE_SYSTEM_HEALTH'; payload: Partial<AppState['systemHealth']> }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_ACTIVE_VIEW'; payload: AppState['activeView'] }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AppState['settings']> }
  | { type: 'HYDRATE_STATE'; payload: Partial<AppState> };

// Initial state
const initialState: AppState = {
  user: null,
  isAuthenticated: false,
  currentEmotion: null,
  emotionHistory: [],
  isDetecting: false,
  detectionError: null,
  recommendations: [],
  loadingRecommendations: false,
  isOnline: true,
  systemHealth: {
    emotionService: true,
    recommendationService: true,
    lastCheck: Date.now(),
  },
  sidebarCollapsed: false,
  activeView: 'dashboard',
  settings: {
    detectionInterval: 5000,
    confidenceThreshold: 0.6,
    maxHistoryItems: 100,
    enableNotifications: true,
    autoRecommendations: true,
  },
};

// Reducer function
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
      };
    
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        emotionHistory: [],
        currentEmotion: null,
      };
    
    case 'SET_CURRENT_EMOTION':
      return {
        ...state,
        currentEmotion: action.payload,
        detectionError: null,
      };
    
    case 'ADD_EMOTION_TO_HISTORY':
      return {
        ...state,
        emotionHistory: [
          action.payload,
          ...state.emotionHistory.slice(0, state.settings.maxHistoryItems - 1),
        ],
      };
    
    case 'CLEAR_EMOTION_HISTORY':
      return {
        ...state,
        emotionHistory: [],
      };
    
    case 'SET_DETECTING':
      return {
        ...state,
        isDetecting: action.payload,
      };
    
    case 'SET_DETECTION_ERROR':
      return {
        ...state,
        detectionError: action.payload,
        isDetecting: false,
      };
    
    case 'SET_RECOMMENDATIONS':
      return {
        ...state,
        recommendations: action.payload,
        loadingRecommendations: false,
      };
    
    case 'SET_LOADING_RECOMMENDATIONS':
      return {
        ...state,
        loadingRecommendations: action.payload,
      };
    
    case 'SET_ONLINE_STATUS':
      return {
        ...state,
        isOnline: action.payload,
      };
    
    case 'UPDATE_SYSTEM_HEALTH':
      return {
        ...state,
        systemHealth: {
          ...state.systemHealth,
          ...action.payload,
          lastCheck: Date.now(),
        },
      };
    
    case 'TOGGLE_SIDEBAR':
      return {
        ...state,
        sidebarCollapsed: !state.sidebarCollapsed,
      };
    
    case 'SET_ACTIVE_VIEW':
      return {
        ...state,
        activeView: action.payload,
      };
    
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.payload,
        },
      };
    
    case 'HYDRATE_STATE':
      return {
        ...state,
        ...action.payload,
      };
    
    default:
      return state;
  }
}

// Context
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  // Helper functions
  addEmotionDetection: (emotion: string, confidence: number) => void;
  updateSystemHealth: () => Promise<void>;
  loadRecommendations: (emotion?: string) => Promise<void>;
  saveSettings: (settings: Partial<AppState['settings']>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider component
interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load persisted state on mount
  useEffect(() => {
    const savedState = localStorage.getItem('emotion-app-state');
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        dispatch({ type: 'HYDRATE_STATE', payload: parsedState });
      } catch (error) {
        console.error('Failed to load saved state:', error);
      }
    }
  }, []);

  // Persist state changes
  useEffect(() => {
    const stateToSave = {
      user: state.user,
      emotionHistory: state.emotionHistory.slice(0, 50), // Limit saved history
      settings: state.settings,
      sidebarCollapsed: state.sidebarCollapsed,
      activeView: state.activeView,
    };
    localStorage.setItem('emotion-app-state', JSON.stringify(stateToSave));
  }, [state]);

  // Monitor online status
  useEffect(() => {
    const updateOnlineStatus = () => {
      dispatch({ type: 'SET_ONLINE_STATUS', payload: navigator.onLine });
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  // Helper functions
  const addEmotionDetection = (emotion: string, confidence: number) => {
    const detection: EmotionDetection = {
      emotion,
      confidence,
      timestamp: Date.now(),
      id: Math.random().toString(36).substr(2, 9),
    };
    
    dispatch({ type: 'SET_CURRENT_EMOTION', payload: detection });
    dispatch({ type: 'ADD_EMOTION_TO_HISTORY', payload: detection });
    
    // Auto-load recommendations if enabled
    if (state.settings.autoRecommendations && confidence >= state.settings.confidenceThreshold) {
      loadRecommendations(emotion);
    }
  };

  const updateSystemHealth = async () => {
    try {
      // Check emotion service
      const emotionResponse = await fetch('/api/emotion/health').catch(() => ({ ok: false }));
      
      // Check recommendation service
      const recommendationResponse = await fetch('/api/recommendations/health').catch(() => ({ ok: false }));
      
      dispatch({
        type: 'UPDATE_SYSTEM_HEALTH',
        payload: {
          emotionService: emotionResponse.ok,
          recommendationService: recommendationResponse.ok,
        },
      });
    } catch (error) {
      console.error('System health check failed:', error);
      dispatch({
        type: 'UPDATE_SYSTEM_HEALTH',
        payload: {
          emotionService: false,
          recommendationService: false,
        },
      });
    }
  };

  const loadRecommendations = async (emotion?: string) => {
    dispatch({ type: 'SET_LOADING_RECOMMENDATIONS', payload: true });
    
    try {
      const params = new URLSearchParams();
      if (emotion) params.append('emotion', emotion);
      if (state.user?.id) params.append('userId', state.user.id);
      
      const response = await fetch(`/api/recommendations?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to load recommendations');
      }
      
      const recommendations = await response.json();
      dispatch({ type: 'SET_RECOMMENDATIONS', payload: recommendations });
    } catch (error) {
      console.error('Failed to load recommendations:', error);
      dispatch({ type: 'SET_LOADING_RECOMMENDATIONS', payload: false });
    }
  };

  const saveSettings = (newSettings: Partial<AppState['settings']>) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: newSettings });
  };

  const contextValue: AppContextType = {
    state,
    dispatch,
    addEmotionDetection,
    updateSystemHealth,
    loadRecommendations,
    saveSettings,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

// Hook to use the app context
export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

// Custom hooks for specific features
export const useEmotionDetection = () => {
  const { state, addEmotionDetection, dispatch } = useApp();
  
  return {
    currentEmotion: state.currentEmotion,
    emotionHistory: state.emotionHistory,
    isDetecting: state.isDetecting,
    detectionError: state.detectionError,
    addEmotionDetection,
    setDetecting: (detecting: boolean) => dispatch({ type: 'SET_DETECTING', payload: detecting }),
    setError: (error: string | null) => dispatch({ type: 'SET_DETECTION_ERROR', payload: error }),
    clearHistory: () => dispatch({ type: 'CLEAR_EMOTION_HISTORY' }),
  };
};

export const useRecommendations = () => {
  const { state, loadRecommendations } = useApp();
  
  return {
    recommendations: state.recommendations,
    loading: state.loadingRecommendations,
    loadRecommendations,
  };
};

export const useSystemHealth = () => {
  const { state, updateSystemHealth } = useApp();
  
  return {
    health: state.systemHealth,
    isOnline: state.isOnline,
    updateSystemHealth,
  };
};

export const useAppSettings = () => {
  const { state, saveSettings } = useApp();
  
  return {
    settings: state.settings,
    saveSettings,
  };
};
