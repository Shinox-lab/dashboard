export type AgentType = 'PLANNER' | 'WORKER' | 'SAFETY' | 'DIRECTOR' | 'SYSTEM';

export type MessageType = 'THOUGHT' | 'TOOL_USE' | 'FINAL_ANSWER' | 'SYSTEM_NOTIFICATION';

export type SquadPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';

export type SquadStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'FAILED';

export type GovernanceStatus = 'PENDING' | 'VERIFIED' | 'BLOCKED';

export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'HITL_REVIEW' | 'COMPLETED' | 'FAILED';

export interface Agent {
  id: string;
  agentId: string;
  name: string;
  agentType: AgentType;
  description?: string;
  skills: string[];
  status: 'ONLINE' | 'OFFLINE' | 'BUSY' | 'HIBERNATING';
  contextTokens?: number;
}

export interface Squad {
  id: string;
  squadId: string;
  name: string;
  goal: string;
  priority: SquadPriority;
  status: SquadStatus;
  kafkaTopic: string;
  triggerSource?: string;
  members: SquadMember[];
  createdAt: string;
}

export interface SquadMember {
  agent: Agent;
  role: 'LEAD' | 'MEMBER';
  joinedAt: string;
  contextTokens: number;
}

export interface Message {
  id: string;
  squadId?: string;
  sourceAgentId: string;
  sourceAgent?: Agent;
  targetAgentId?: string;
  conversationId: string;
  interactionType: string;
  messageType: MessageType;
  content: string;
  toolName?: string;
  toolInput?: Record<string, unknown>;
  toolOutput?: Record<string, unknown>;
  governanceStatus: GovernanceStatus;
  governanceReason?: string;
  createdAt: string;
}

export interface Task {
  id: string;
  squadId?: string;
  agentId: string;
  title: string;
  description?: string;
  taskType: 'PR' | 'DOC_UPDATE' | 'DEPLOYMENT' | 'ANALYSIS';
  status: TaskStatus;
  progress: number;
  requiresApproval: boolean;
  createdAt: string;
}

export interface RAGNode {
  id: string;
  label: string;
  type: 'service' | 'database' | 'cluster' | 'entity';
}

export interface RAGRelationship {
  from: string;
  to: string;
  type: string;
}

export interface RAGContext {
  query: string;
  nodes: RAGNode[];
  relationships: RAGRelationship[];
}

export interface WebSocketMessage {
  type: 'MESSAGE' | 'SQUAD_UPDATE' | 'AGENT_UPDATE' | 'TASK_UPDATE' | 'GOVERNANCE_ALERT';
  payload: unknown;
}
