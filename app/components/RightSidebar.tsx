'use client';

import { SquadMember, Task, RAGContext } from '../types';

interface RightSidebarProps {
  members: SquadMember[];
  tasks: Task[];
  ragContext: RAGContext | null;
  onApproveTask: (taskId: string) => void;
  isOpen: boolean;
}

export default function RightSidebar({
  members,
  tasks,
  ragContext,
  onApproveTask,
  isOpen,
}: RightSidebarProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <aside className="w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden transition-all duration-300 ease-in-out">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100">Squad Details</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Members, tasks, and context</p>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-6">
        {/* Squad Roster */}
        <CollapsibleSection title="Squad Roster" defaultOpen={true} count={members.length}>
          <div className="space-y-2">
            {members.length > 0 ? (
              members.map((member) => (
                <MemberCard key={member.agent.agentId} member={member} />
              ))
            ) : (
              <div className="p-3 text-center text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800 rounded border border-dashed dark:border-gray-700">
                No agents in squad
              </div>
            )}
            <div className="p-2 border border-dashed border-gray-300 dark:border-gray-600 rounded text-center text-xs text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              + Waiting for agents...
            </div>
          </div>
        </CollapsibleSection>

        {/* RAG Context */}
        {ragContext && (
          <CollapsibleSection title="RAG Context" defaultOpen={true}>
            <div className="bg-indigo-50 p-3 rounded border border-indigo-100">
              <p className="text-xs text-indigo-800 font-mono mb-2">
                Query: "{ragContext.query}"
              </p>
              <div className="space-y-1.5">
                {ragContext.nodes.map((node, i) => (
                  <div key={node.id} className="text-xs text-gray-600">
                    {i > 0 && (
                      <div className="flex items-center gap-1 ml-2 text-gray-400 mb-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                        <span className="text-[10px]">
                          {ragContext.relationships[i - 1]?.type || 'RELATES_TO'}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 bg-white p-1.5 rounded border">
                      <span className={`w-2 h-2 rounded-full ${
                        node.type === 'service' ? 'bg-blue-500' :
                        node.type === 'cluster' ? 'bg-green-500' : 'bg-gray-500'
                      }`} />
                      <span className="font-medium">{node.label}</span>
                      <span className="text-[10px] text-gray-400 ml-auto">{node.type}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CollapsibleSection>
        )}

        {/* Async Tasks */}
        <CollapsibleSection title="Async Tasks" defaultOpen={true} count={tasks.length}>
          <div className="space-y-2">
            {tasks.length > 0 ? (
              tasks.map((task) => (
                <TaskCard key={task.id} task={task} onApprove={onApproveTask} />
              ))
            ) : (
              <div className="p-3 text-center text-xs text-gray-400 bg-gray-50 rounded border border-dashed">
                No active tasks
              </div>
            )}
          </div>
        </CollapsibleSection>
      </div>
    </aside>
  );
}

interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  count?: number;
  children: React.ReactNode;
}

function CollapsibleSection({ title, defaultOpen = false, count, children }: CollapsibleSectionProps) {
  return (
    <details open={defaultOpen} className="group">
      <summary className="flex items-center justify-between cursor-pointer list-none mb-2">
        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
          <svg
            className="w-3 h-3 text-gray-400 transition-transform group-open:rotate-90"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          {title}
        </h3>
        {count !== undefined && (
          <span className="text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded-full">
            {count}
          </span>
        )}
      </summary>
      <div className="pl-5">{children}</div>
    </details>
  );
}

interface MemberCardProps {
  member: SquadMember;
}

function MemberCard({ member }: MemberCardProps) {
  const statusColors = {
    ONLINE: 'bg-green-500',
    BUSY: 'bg-yellow-500',
    OFFLINE: 'bg-gray-400',
  };

  return (
    <div className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-750 transition-colors">
      <div className="flex items-center gap-2 min-w-0">
        <div className="relative">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${
            member.role === 'LEAD' ? 'bg-purple-500' : 'bg-blue-500'
          }`}>
            {member.agent.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
            statusColors[member.agent.status as keyof typeof statusColors] || 'bg-gray-400'
          }`} />
        </div>
        <div className="min-w-0">
          <span className="text-sm font-medium block truncate">{member.agent.name}</span>
          <span className="text-[10px] text-gray-400">
            {member.role === 'LEAD' ? 'Squad Lead' : 'Member'}
          </span>
        </div>
      </div>
      <div className="text-right">
        {member.agent.skills && member.agent.skills.length > 0 ? (
          <div className="flex flex-wrap gap-1 justify-end max-w-[100px]">
            {member.agent.skills.slice(0, 2).map((skill, i) => (
              <span key={i} className="text-[9px] bg-indigo-100 text-indigo-700 px-1 rounded">
                {skill}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-[10px] text-gray-400">
            {member.contextTokens || 0} tokens
          </span>
        )}
      </div>
    </div>
  );
}

interface TaskCardProps {
  task: Task;
  onApprove: (taskId: string) => void;
}

function TaskCard({ task, onApprove }: TaskCardProps) {
  const statusConfig = {
    PENDING: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Pending', barColor: 'bg-gray-400' },
    IN_PROGRESS: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'In Progress', barColor: 'bg-yellow-500' },
    HITL_REVIEW: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Needs Review', barColor: 'bg-blue-500' },
    COMPLETED: { bg: 'bg-green-100', text: 'text-green-700', label: 'Completed', barColor: 'bg-green-500' },
    FAILED: { bg: 'bg-red-100', text: 'text-red-700', label: 'Failed', barColor: 'bg-red-500' },
  };

  const config = statusConfig[task.status] || statusConfig.PENDING;

  return (
    <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm hover:shadow transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <span className="text-sm font-medium truncate max-w-[180px]">{task.title}</span>
        <span className={`text-[10px] ${config.bg} ${config.text} px-1.5 py-0.5 rounded flex-shrink-0`}>
          {config.label}
        </span>
      </div>

      {task.status !== 'COMPLETED' && task.status !== 'FAILED' && (
        <div className="mb-2">
          <div className="flex justify-between text-[10px] text-gray-500 mb-1">
            <span>Progress</span>
            <span>{task.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all duration-300 ${config.barColor}`}
              style={{ width: `${task.progress}%` }}
            />
          </div>
        </div>
      )}

      {task.status === 'HITL_REVIEW' && (
        <button
          onClick={() => onApprove(task.id)}
          className="w-full text-xs bg-blue-600 text-white py-1.5 rounded hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Approve
        </button>
      )}
    </div>
  );
}
