'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Header, SquadList, ChatArea, RightSidebar, SettingsModal } from './components';
import { Squad, Message, Task, RAGContext } from './types';
import { squadAPI, taskAPI, messageAPI, healthAPI, WS_URL } from './lib/api';

// Mock RAG context (would come from a separate RAG service)
const mockRAGContext: RAGContext = {
  query: 'Latency Fallback',
  nodes: [
    { id: 'n1', label: 'Service_Payments', type: 'service' },
    { id: 'n2', label: 'Redis_Cluster_01', type: 'cluster' },
  ],
  relationships: [{ from: 'n1', to: 'n2', type: 'DEPENDS_ON' }],
};

export default function Home() {
  const [selectedSquadId, setSelectedSquadId] = useState<string | null>(null);
  const [squads, setSquads] = useState<Squad[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [apiConnected, setApiConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sidebar state
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const healthCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Health check function
  const checkApiHealth = useCallback(async () => {
    const isHealthy = await healthAPI.check();
    setApiConnected(isHealthy);
    return isHealthy;
  }, []);

  // Fetch squads on mount
  useEffect(() => {
    let isInitialLoad = true;

    const fetchSquads = async () => {
      try {
        // Only show loading spinner on initial load, not on polls
        if (isInitialLoad) {
          setIsLoading(true);
        }

        // Check API health first
        const isHealthy = await checkApiHealth();
        if (!isHealthy) {
          if (isInitialLoad) {
            setError('Cannot connect to API Gateway. Please ensure it is running.');
          }
          return;
        }

        const data = await squadAPI.getAll();
        setSquads(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch squads:', err);
        if (isInitialLoad) {
          setError('Failed to load squads. Is the API gateway running?');
        }
      } finally {
        if (isInitialLoad) {
          setIsLoading(false);
          isInitialLoad = false;
        }
      }
    };

    fetchSquads();
    // Poll for new squads every 30 seconds
    const interval = setInterval(fetchSquads, 30000);

    // Health check every 10 seconds
    healthCheckIntervalRef.current = setInterval(checkApiHealth, 10000);

    return () => {
      clearInterval(interval);
      if (healthCheckIntervalRef.current) {
        clearInterval(healthCheckIntervalRef.current);
      }
    };
  }, [checkApiHealth]);

  // Auto-select first squad when squads load (only if none selected)
  useEffect(() => {
    if (squads.length > 0 && !selectedSquadId) {
      setSelectedSquadId(squads[0].squadId);
    }
  }, [squads, selectedSquadId]);

  // Fetch messages when squad changes
  useEffect(() => {
    if (!selectedSquadId) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      try {
        const data = await squadAPI.getMessages(selectedSquadId);
        setMessages(data);
      } catch (err) {
        console.error('Failed to fetch messages:', err);
      }
    };

    fetchMessages();
  }, [selectedSquadId]);

  // Fetch tasks when squad changes
  useEffect(() => {
    if (!selectedSquadId) {
      setTasks([]);
      return;
    }

    const fetchTasks = async () => {
      try {
        const data = await taskAPI.getBySquad(selectedSquadId);
        // Handle case where tasks endpoint returns not implemented
        if (Array.isArray(data)) {
          setTasks(data);
        } else {
          setTasks([]);
        }
      } catch (err) {
        console.error('Failed to fetch tasks:', err);
        setTasks([]);
      }
    };

    fetchTasks();
  }, [selectedSquadId]);

  // WebSocket connection
  useEffect(() => {
    const connectWebSocket = () => {
      try {
        wsRef.current = new WebSocket(WS_URL);

        wsRef.current.onopen = () => {
          console.log('[WebSocket] Connected');
          setWsConnected(true);

          // Subscribe to current squad if selected
          if (selectedSquadId && wsRef.current) {
            wsRef.current.send(
              JSON.stringify({
                type: 'SUBSCRIBE',
                payload: { squadId: selectedSquadId },
              })
            );
          }
        };

        wsRef.current.onclose = () => {
          console.log('[WebSocket] Disconnected');
          setWsConnected(false);

          // Attempt reconnect after 3 seconds
          reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
        };

        wsRef.current.onerror = (error) => {
          console.error('[WebSocket] Error:', error);
        };

        wsRef.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);

            switch (data.type) {
              case 'MESSAGE':
                // Add new message to the list
                const newMessage = data.payload as Message;
                setMessages((prev) => {
                  // Avoid duplicates
                  if (prev.some((m) => m.id === newMessage.id)) return prev;
                  return [...prev, newMessage];
                });
                break;

              case 'SQUAD_UPDATE':
                // Update squad in the list
                const updatedSquad = data.payload as Squad;
                setSquads((prev) =>
                  prev.map((s) => (s.squadId === updatedSquad.squadId ? updatedSquad : s))
                );
                break;

              case 'TASK_UPDATE':
                // Update task in the list
                const updatedTask = data.payload as Task;
                setTasks((prev) =>
                  prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
                );
                break;

              case 'SUBSCRIBED':
                console.log('[WebSocket] Subscribed to:', data.payload.squadId);
                break;

              case 'PONG':
                // Heartbeat response
                break;

              default:
                console.log('[WebSocket] Unknown message type:', data.type);
            }
          } catch (err) {
            console.error('[WebSocket] Failed to parse message:', err);
          }
        };
      } catch (err) {
        console.error('[WebSocket] Failed to connect:', err);
        // Attempt reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
      }
    };

    connectWebSocket();

    // Cleanup
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Subscribe to new squad when selection changes
  useEffect(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN && selectedSquadId) {
      wsRef.current.send(
        JSON.stringify({
          type: 'SUBSCRIBE',
          payload: { squadId: selectedSquadId },
        })
      );
    }
  }, [selectedSquadId]);

  const selectedSquad = squads.find((s) => s.squadId === selectedSquadId) || null;
  const squadMessages = messages.filter(
    (m) => selectedSquad && m.conversationId === selectedSquad.squadId
  );

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!selectedSquadId) return;

      try {
        // Optimistic update
        const tempMessage: Message = {
          id: `temp-${Date.now()}`,
          sourceAgentId: 'human-admin',
          conversationId: selectedSquadId,
          interactionType: 'DIRECT_COMMAND',
          messageType: 'THOUGHT',
          content,
          governanceStatus: 'PENDING',
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, tempMessage]);

        // Send to API
        await messageAPI.send(selectedSquadId, content);
      } catch (err) {
        console.error('Failed to send message:', err);
        // Could remove optimistic update here on error
      }
    },
    [selectedSquadId]
  );

  const handleApproveTask = useCallback(async (taskId: string) => {
    try {
      await taskAPI.approve(taskId, true);
      // Update local state
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: 'COMPLETED' } : t))
      );
    } catch (err) {
      console.error('Failed to approve task:', err);
    }
  }, []);

  const handleSelectSquad = useCallback((squadId: string) => {
    setSelectedSquadId(squadId);
  }, []);

  const toggleLeftSidebar = useCallback(() => {
    setLeftSidebarOpen((prev) => !prev);
  }, []);

  const toggleRightSidebar = useCallback(() => {
    setRightSidebarOpen((prev) => !prev);
  }, []);

  const openSettings = useCallback(() => {
    setSettingsOpen(true);
  }, []);

  const closeSettings = useCallback(() => {
    setSettingsOpen(false);
  }, []);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-800 mb-1">Shinox Dashboard</h2>
          <p className="text-gray-500 text-sm">Connecting to Agentic Mesh...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center max-w-md bg-white p-8 rounded-xl shadow-lg">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Connection Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col text-sm text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-950">
      <Header
        wsConnected={wsConnected}
        apiConnected={apiConnected}
        onToggleLeftSidebar={toggleLeftSidebar}
        onToggleRightSidebar={toggleRightSidebar}
        onOpenSettings={openSettings}
        leftSidebarOpen={leftSidebarOpen}
        rightSidebarOpen={rightSidebarOpen}
      />

      <div className="flex flex-1 overflow-hidden">
        <SquadList
          squads={squads}
          selectedSquadId={selectedSquadId}
          onSelectSquad={handleSelectSquad}
          isOpen={leftSidebarOpen}
        />

        <ChatArea
          squad={selectedSquad}
          messages={squadMessages}
          onSendMessage={handleSendMessage}
        />

        <RightSidebar
          members={selectedSquad?.members || []}
          tasks={tasks}
          ragContext={mockRAGContext}
          onApproveTask={handleApproveTask}
          isOpen={rightSidebarOpen}
        />
      </div>

      <SettingsModal isOpen={settingsOpen} onClose={closeSettings} />
    </div>
  );
}
