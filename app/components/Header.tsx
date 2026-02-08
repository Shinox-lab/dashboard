'use client';

interface HeaderProps {
  wsConnected: boolean;
  apiConnected: boolean;
  onToggleLeftSidebar: () => void;
  onToggleRightSidebar: () => void;
  onOpenSettings: () => void;
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
}

export default function Header({
  wsConnected,
  apiConnected,
  onToggleLeftSidebar,
  onToggleRightSidebar,
  onOpenSettings,
  leftSidebarOpen,
  rightSidebarOpen,
}: HeaderProps) {
  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex justify-between items-center shadow-sm z-20">
      <div className="flex items-center gap-3">
        {/* Left sidebar toggle */}
        <button
          onClick={onToggleLeftSidebar}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          title={leftSidebarOpen ? 'Hide squads' : 'Show squads'}
        >
          <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <h1 className="font-bold text-lg text-gray-800 dark:text-gray-100 flex items-center gap-2">
              Shinox Dashboard
            </h1>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 -mt-0.5">Decentralized Agentic Mesh</p>
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

        {/* Settings & Right sidebar toggle */}
        <button
          onClick={onOpenSettings}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          title="Settings"
        >
          <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        {/* Right sidebar toggle */}
        <button
          onClick={onToggleRightSidebar}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          title={rightSidebarOpen ? 'Hide details' : 'Show details'}
        >
          <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400'
        : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'
    }`}>
      <div className={`w-2 h-2 rounded-full ${
        connected ? 'bg-green-500 pulse-dot' : 'bg-red-500'
      }`} />
      <span className="font-medium">{label}:</span>
      <span>{connected ? connectedText : disconnectedText}</span>
    </div>
  );
}
