'use client';

interface HeaderProps {
  wsConnected: boolean;
  apiConnected: boolean;
  onToggleLeftSidebar: () => void;
  onToggleRightSidebar: () => void;
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
}

export default function Header({
  wsConnected,
  apiConnected,
  onToggleLeftSidebar,
  onToggleRightSidebar,
  leftSidebarOpen,
  rightSidebarOpen,
}: HeaderProps) {
  return (
    <header className="bg-white border-b px-4 py-3 flex justify-between items-center shadow-sm z-20">
      <div className="flex items-center gap-3">
        {/* Left sidebar toggle */}
        <button
          onClick={onToggleLeftSidebar}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title={leftSidebarOpen ? 'Hide squads' : 'Show squads'}
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {leftSidebarOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        {/* Logo and title */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg text-white shadow-sm">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
          </div>
          <div>
            <h1 className="font-bold text-lg text-gray-800 flex items-center gap-2">
              Shinox Dashboard
            </h1>
            <p className="text-[10px] text-gray-500 -mt-0.5">Decentralized Agentic Mesh</p>
          </div>
        </div>
      </div>

      {/* Status indicators */}
      <div className="flex items-center gap-4">
        {/* Connection status */}
        <div className="flex items-center gap-3 text-xs">
          <StatusIndicator
            label="API"
            connected={apiConnected}
            connectedText="Online"
            disconnectedText="Offline"
          />
          <StatusIndicator
            label="WebSocket"
            connected={wsConnected}
            connectedText="Connected"
            disconnectedText="Disconnected"
          />
        </div>

        {/* Right sidebar toggle */}
        <button
          onClick={onToggleRightSidebar}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title={rightSidebarOpen ? 'Hide details' : 'Show details'}
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {rightSidebarOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" />
            )}
          </svg>
        </button>
      </div>
    </header>
  );
}

interface StatusIndicatorProps {
  label: string;
  connected: boolean;
  connectedText: string;
  disconnectedText: string;
}

function StatusIndicator({ label, connected, connectedText, disconnectedText }: StatusIndicatorProps) {
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full transition-colors ${
      connected
        ? 'bg-green-50 text-green-700'
        : 'bg-red-50 text-red-600'
    }`}>
      <div className={`w-2 h-2 rounded-full ${
        connected ? 'bg-green-500 pulse-dot' : 'bg-red-500'
      }`} />
      <span className="font-medium">{label}:</span>
      <span>{connected ? connectedText : disconnectedText}</span>
    </div>
  );
}
