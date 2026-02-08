'use client';

import { Squad, SquadPriority } from '../types';

interface SquadListProps {
  squads: Squad[];
  selectedSquadId: string | null;
  onSelectSquad: (squadId: string) => void;
  isOpen: boolean;
}

const priorityColors: Record<SquadPriority, { bg: string; text: string; border: string }> = {
  LOW: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' },
  NORMAL: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-200' },
  HIGH: { bg: 'bg-orange-100', text: 'text-orange-600', border: 'border-orange-200' },
  CRITICAL: { bg: 'bg-red-100', text: 'text-red-600', border: 'border-red-200' },
};

const statusColors: Record<string, { bg: string; text: string }> = {
  ACTIVE: { bg: 'bg-green-100', text: 'text-green-700' },
  PAUSED: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  COMPLETED: { bg: 'bg-gray-100', text: 'text-gray-600' },
  FAILED: { bg: 'bg-red-100', text: 'text-red-600' },
};

export default function SquadList({ squads, selectedSquadId, onSelectSquad, isOpen }: SquadListProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <aside className="w-72 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300 ease-in-out">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">Active Squads</h2>
          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
            {squads.length}
          </span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Select a squad to view messages</p>
      </div>

      {/* Squad list */}
      <div className="overflow-y-auto flex-1 scrollbar-thin">
        {squads.length === 0 ? (
          <div className="p-6 text-center">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm font-medium">No active squads</p>
            <p className="text-gray-400 text-xs mt-1">Squads will appear here when created</p>
          </div>
        ) : (
          squads.map((squad) => (
            <SquadCard
              key={squad.squadId}
              squad={squad}
              isSelected={selectedSquadId === squad.squadId}
              onSelect={() => onSelectSquad(squad.squadId)}
            />
          ))
        )}
      </div>
    </aside>
  );
}

interface SquadCardProps {
  squad: Squad;
  isSelected: boolean;
  onSelect: () => void;
}

function SquadCard({ squad, isSelected, onSelect }: SquadCardProps) {
  const priorityStyle = priorityColors[squad.priority] || priorityColors.NORMAL;
  const statusStyle = statusColors[squad.status] || statusColors.ACTIVE;

  return (
    <div
      onClick={onSelect}
      className={`p-3 border-b border-gray-200 dark:border-gray-700 cursor-pointer transition-all duration-200 hover:bg-white dark:hover:bg-gray-800 ${
        isSelected
          ? 'bg-white dark:bg-gray-800 border-l-4 border-l-indigo-500 shadow-sm'
          : 'border-l-4 border-l-transparent hover:border-l-gray-300 dark:hover:border-l-gray-600'
      }`}
    >
      {/* Header row */}
      <div className="flex justify-between items-start gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <span className={`font-semibold text-sm truncate ${isSelected ? 'text-indigo-700 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-200'}`}>
            {squad.name || squad.squadId}
          </span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {squad.priority !== 'NORMAL' && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${priorityStyle.bg} ${priorityStyle.text}`}>
              {squad.priority === 'CRITICAL' ? 'CRIT' : squad.priority}
            </span>
          )}
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${statusStyle.bg} ${statusStyle.text}`}>
            {squad.status}
          </span>
        </div>
      </div>

      {/* Goal */}
      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">{squad.goal}</p>

      {/* Footer row */}
      <div className="flex items-center justify-between">
        {/* Agent avatars */}
        {squad.members && squad.members.length > 0 ? (
          <div className="flex -space-x-1.5">
            {squad.members.slice(0, 5).map((member, idx) => (
              <div
                key={member.agent.agentId || idx}
                className={`w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-bold text-white shadow-sm ${
                  member.role === 'LEAD'
                    ? 'bg-purple-500 ring-2 ring-purple-200'
                    : member.agent.status === 'ONLINE'
                    ? 'bg-blue-500'
                    : 'bg-gray-400'
                }`}
                title={`${member.agent.name} (${member.role})`}
              >
                {member.agent.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
            ))}
            {squad.members.length > 5 && (
              <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-[9px] font-bold text-gray-600">
                +{squad.members.length - 5}
              </div>
            )}
          </div>
        ) : (
          <span className="text-[10px] text-gray-400">No agents</span>
        )}

        {/* Timestamp */}
        {squad.createdAt && (
          <span className="text-[10px] text-gray-400">
            {formatRelativeTime(squad.createdAt)}
          </span>
        )}
      </div>
    </div>
  );
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
