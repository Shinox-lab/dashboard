'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message, AgentType } from '../types';

interface MessageBubbleProps {
  message: Message;
  agentName: string;
  agentType: AgentType;
  isLeader?: boolean;
  isBlocked?: boolean;
}

const agentTypeClasses: Record<AgentType, { class: string; icon: string; color: string }> = {
  PLANNER: { class: 'planner', icon: 'P', color: 'text-purple-600' },
  WORKER: { class: 'worker', icon: 'W', color: 'text-blue-600' },
  SAFETY: { class: 'safety', icon: 'S', color: 'text-red-600' },
  DIRECTOR: { class: 'director', icon: 'D', color: 'text-green-600' },
  SYSTEM: { class: 'system', icon: 'SYS', color: 'text-gray-600' },
};

export default function MessageBubble({
  message,
  agentName,
  agentType,
  isLeader = false,
  isBlocked = false,
}: MessageBubbleProps) {
  const typeInfo = agentTypeClasses[agentType] || agentTypeClasses.SYSTEM;
  const isIndented = agentType === 'WORKER' || agentType === 'SAFETY';

  return (
    <div
      className={`agent-msg ${typeInfo.class} p-4 rounded-lg max-w-3xl mx-auto w-full message-enter ${
        isIndented ? 'ml-8' : 'ml-0'
      } ${isBlocked ? 'opacity-75' : ''} ${isLeader ? 'shadow-lg border-purple-300' : ''}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
            agentType === 'PLANNER'
              ? 'bg-purple-500'
              : agentType === 'WORKER'
              ? 'bg-blue-500'
              : agentType === 'SAFETY'
              ? 'bg-red-500'
              : agentType === 'DIRECTOR'
              ? 'bg-green-500'
              : 'bg-gray-500'
          }`}
        >
          {typeInfo.icon}
        </div>
        <span className={`font-bold ${typeInfo.color}`}>{agentName}</span>
        {isLeader && (
          <span className="text-[10px] bg-purple-200 px-1.5 py-0.5 rounded text-purple-800">Squad Lead</span>
        )}
        {isBlocked && (
          <span className="text-[10px] border border-red-200 px-1.5 py-0.5 rounded uppercase text-red-600">
            Intervention
          </span>
        )}
        {message.governanceStatus === 'BLOCKED' && !isBlocked && (
          <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded">Blocked</span>
        )}
        {message.governanceStatus === 'PENDING' && (
          <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">Pending</span>
        )}
        {message.governanceStatus === 'VERIFIED' && (
          <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded flex items-center gap-0.5">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Verified
          </span>
        )}
        <span className="text-[10px] text-gray-400 ml-auto">
          {new Date(message.createdAt).toLocaleTimeString()}
        </span>
      </div>

      <div className="mt-1">
        {message.governanceStatus === 'BLOCKED' && message.governanceReason ? (
          <div className="bg-red-50 border border-red-200 rounded p-2">
            <p className="text-red-700 text-sm">
              <strong>BLOCKED:</strong> {message.governanceReason}
            </p>
          </div>
        ) : (
          <MessageContent message={message} />
        )}
      </div>

      {message.interactionType && (
        <div className="mt-2 flex items-center gap-2">
          <span className="text-[10px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
            {message.interactionType}
          </span>
          {message.messageType && message.messageType !== 'THOUGHT' && (
            <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
              {message.messageType}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function MessageContent({ message }: { message: Message }) {
  const { content, toolName, toolInput, toolOutput } = message;

  if (toolName) {
    return (
      <div className="space-y-2">
        <div className="markdown-content">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
        <div className="bg-white/50 border rounded p-2 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-mono">
              tool
            </span>
            <code className="text-xs font-mono text-indigo-800">{toolName}</code>
          </div>
          {toolInput && (
            <details className="text-xs">
              <summary className="cursor-pointer text-gray-500 hover:text-gray-700">Input</summary>
              <pre className="mt-1 p-2 bg-gray-50 rounded overflow-x-auto text-[11px]">
                {JSON.stringify(toolInput, null, 2)}
              </pre>
            </details>
          )}
          {toolOutput && (
            <details className="text-xs">
              <summary className="cursor-pointer text-gray-500 hover:text-gray-700">Output</summary>
              <pre className="mt-1 p-2 bg-gray-50 rounded overflow-x-auto text-[11px]">
                {JSON.stringify(toolOutput, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Custom rendering for code blocks
          code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match && !className;

            if (isInline) {
              return (
                <code className="bg-black/10 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                  {children}
                </code>
              );
            }

            return (
              <div className="relative my-2">
                {match && (
                  <span className="absolute top-0 right-0 text-[10px] bg-gray-200 px-2 py-0.5 rounded-bl text-gray-600">
                    {match[1]}
                  </span>
                )}
                <pre className="bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto text-sm">
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              </div>
            );
          },
          // Custom rendering for links
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:text-indigo-800 underline"
            >
              {children}
            </a>
          ),
          // Custom rendering for lists
          ul: ({ children }) => (
            <ul className="list-disc list-inside space-y-1 my-2">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside space-y-1 my-2">{children}</ol>
          ),
          // Custom rendering for blockquotes
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-gray-300 pl-3 my-2 italic text-gray-600">
              {children}
            </blockquote>
          ),
          // Custom rendering for tables
          table: ({ children }) => (
            <div className="overflow-x-auto my-2">
              <table className="min-w-full border-collapse border border-gray-300 text-sm">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-gray-300 bg-gray-100 px-3 py-1.5 text-left font-semibold">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-gray-300 px-3 py-1.5">{children}</td>
          ),
          // Custom rendering for headings
          h1: ({ children }) => (
            <h1 className="text-xl font-bold mt-3 mb-2">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-bold mt-3 mb-2">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-bold mt-2 mb-1">{children}</h3>
          ),
          // Paragraphs
          p: ({ children }) => (
            <p className="my-1.5 leading-relaxed">{children}</p>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
