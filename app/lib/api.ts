import { Squad, Message, Agent, Task } from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8002';
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8002/ws';

export { WS_URL, API_BASE_URL };

export interface APIError {
  message: string;
  status: number;
}

export interface HealthStatus {
  status: string;
  service: string;
}

// Health check endpoint
export const healthAPI = {
  check: async (): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) return false;
      const data: HealthStatus = await response.json();
      return data.status === 'healthy';
    } catch {
      return false;
    }
  },
};

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error: APIError = {
      message: `API Error: ${response.statusText}`,
      status: response.status,
    };
    throw error;
  }

  return response.json();
}

// Squad endpoints
export const squadAPI = {
  getAll: (status?: string) => {
    const params = status ? `?status=${status}` : '';
    return fetchAPI<Squad[]>(`/api/squads${params}`);
  },
  getById: (squadId: string) => fetchAPI<Squad>(`/api/squads/${squadId}`),
  getMessages: (squadId: string, limit = 100) =>
    fetchAPI<Message[]>(`/api/squads/${squadId}/messages?limit=${limit}`),
  halt: async (squadId: string) => {
    const response = await fetchAPI<{ status: string; signalId: string | null; implemented?: boolean }>(
      `/api/governance/halt/${squadId}`,
      { method: 'POST' }
    );
    if (response.implemented === false) {
      console.warn('[Governance] Halt squad not implemented yet');
    }
    return response;
  },
};

// Agent endpoints
export const agentAPI = {
  getAll: (status?: string, agentType?: string) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (agentType) params.append('agent_type', agentType);
    const query = params.toString() ? `?${params}` : '';
    return fetchAPI<Agent[]>(`/api/agents${query}`);
  },
};

// Task endpoints
export const taskAPI = {
  getBySquad: (squadId: string) => fetchAPI<Task[]>(`/api/squads/${squadId}/tasks`),
  approve: (taskId: string, approved: boolean, reason?: string) =>
    fetchAPI<{ status: string; taskId: string; newStatus: string }>(
      `/api/tasks/${taskId}/approve`,
      {
        method: 'POST',
        body: JSON.stringify({ approved, reason }),
      }
    ),
};

// Message endpoints
export const messageAPI = {
  send: (squadId: string, content: string) =>
    fetchAPI<{ id: string; status: string; timestamp: string }>(
      `/api/squads/${squadId}/messages`,
      {
        method: 'POST',
        body: JSON.stringify({ content }),
      }
    ),
};

// Governance endpoints
export const governanceAPI = {
  getAlerts: async (limit = 50): Promise<GovernanceAlertsResponse> => {
    try {
      const response = await fetchAPI<GovernanceAlertsResponse>(`/api/governance/alerts?limit=${limit}`);
      if (response.implemented === false) {
        console.warn('[Governance] Alerts not implemented yet');
      }
      return response;
    } catch (err) {
      console.warn('[Governance] Failed to fetch alerts:', err);
      return { implemented: false, message: 'Governance service unavailable', alerts: [] };
    }
  },
};

// Events endpoints
export const eventsAPI = {
  getAll: async (eventType?: string, limit = 100): Promise<GlobalEventsResponse> => {
    const params = new URLSearchParams();
    if (eventType) params.append('event_type', eventType);
    params.append('limit', limit.toString());
    
    try {
      const response = await fetchAPI<GlobalEventsResponse>(`/api/events?${params}`);
      if (response.implemented === false) {
        console.warn('[Events] Logic not implemented yet');
      }
      return response;
    } catch (err) {
      console.warn('[Events] Failed to fetch events:', err);
      return { implemented: false, message: 'Events service unavailable', events: [] };
    }
  },
};

// RAG endpoints
export const ragAPI = {
  getContext: async (squadId?: string, query?: string): Promise<RAGContextResponse> => {
    try {
      const params = new URLSearchParams();
      if (squadId) params.append('squad_id', squadId);
      if (query) params.append('query', query);
      const response = await fetchAPI<RAGContextResponse>(`/api/rag/context?${params}`);
      if (!response.implemented) {
        console.warn('[RAG] Context retrieval not implemented yet');
      }
      return response;
    } catch (err) {
      console.warn('[RAG] Failed to fetch context:', err);
      return { implemented: false, message: 'RAG service unavailable', nodes: [], relationships: [] };
    }
  },
};

// HITL endpoints
export const hitlAPI = {
  getPending: async (): Promise<HITLPendingResponse> => {
    try {
      const response = await fetchAPI<HITLPendingResponse>('/api/hitl/pending');
      if (!response.implemented) {
        console.warn('[HITL] Pending requests endpoint not implemented yet');
      }
      return response;
    } catch (err) {
      console.warn('[HITL] Failed to fetch pending requests:', err);
      return { implemented: false, message: 'HITL service unavailable', requests: [] };
    }
  },
};

// Kafka log endpoints
export const kafkaLogAPI = {
  getLog: async (squadId: string, limit = 100): Promise<KafkaLogResponse> => {
    try {
      const response = await fetchAPI<KafkaLogResponse>(`/api/squads/${squadId}/kafka-log?limit=${limit}`);
      if (!response.implemented) {
        console.warn('[Kafka] Log viewing not implemented yet');
      }
      return response;
    } catch (err) {
      console.warn('[Kafka] Failed to fetch log:', err);
      return { implemented: false, message: 'Kafka log unavailable', squadId, events: [] };
    }
  },
};

export interface RAGContextResponse {
  implemented: boolean;
  message?: string;
  query?: string;
  nodes: Array<{ id: string; label: string; type: string }>;
  relationships: Array<{ from: string; to: string; type: string }>;
}

export interface HITLPendingResponse {
  implemented: boolean;
  message?: string;
  requests: Array<unknown>;
}

export interface KafkaLogResponse {
  implemented: boolean;
  message?: string;
  squadId: string;
  events: Array<unknown>;
}

export interface DispatchEvent {
  type: string;
  source: string;
  payload: Record<string, unknown>;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
}

export interface GovernanceAlert {
  id: string;
  alertId: string;
  agentId: string;
  conversationId?: string;
  action: string;
  reason: string;
  originalMessageId?: string;
  originalContent?: string;
  createdAt: string;
}

export interface GlobalEvent {
  id: string;
  eventId: string;
  eventType: string;
  sourceTopic: string;
  sourceAgentId?: string;
  conversationId?: string;
  payload: Record<string, unknown>;
  archivedAt: string;
}

export interface GovernanceAlertsResponse {
  implemented: boolean;
  message?: string;
  alerts: GovernanceAlert[];
}

export interface GlobalEventsResponse {
  implemented: boolean;
  message?: string;
  events: GlobalEvent[];
}
