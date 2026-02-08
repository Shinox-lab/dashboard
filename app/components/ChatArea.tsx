'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Squad, Message, AgentType } from '../types';
import MessageBubble from './MessageBubble';
import { squadAPI } from '../lib/api';

interface ChatAreaProps {
  squad: Squad | null;
  messages: Message[];
  onSendMessage: (content: string) => void;
}

export default function ChatArea({ squad, messages, onSendMessage }: ChatAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isHalting, setIsHalting] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const prevMessagesLengthRef = useRef(messages.length);

  const SCROLL_THRESHOLD = 150; // px from bottom to consider "near bottom"

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    const nearBottom = distanceFromBottom <= SCROLL_THRESHOLD;
    setIsNearBottom(nearBottom);
    if (nearBottom) {
      setHasNewMessages(false);
    }
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setHasNewMessages(false);
  }, []);

  // Only auto-scroll when near bottom; show indicator otherwise
  useEffect(() => {
    const hasNew = messages.length > prevMessagesLengthRef.current;
    prevMessagesLengthRef.current = messages.length;

    if (isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else if (hasNew) {
      setHasNewMessages(true);
    }
  }, [messages, isNearBottom]);

  const handleForceHalt = async () => {
    if (!squad || isHalting) return;
    if (!confirm(`Are you sure you want to halt squad "${squad.name || squad.squadId}"?`)) return;

    setIsHalting(true);
    try {
      await squadAPI.halt(squad.squadId);
    } catch (err) {
      console.error('Failed to halt squad:', err);
    } finally {
      setIsHalting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputRef.current?.value.trim()) {
      onSendMessage(inputRef.current.value);
      inputRef.current.value = '';
    }
  };

  if (!squad) {
    return (
      <main className="flex-1 flex flex-col bg-white dark:bg-gray-900 relative items-center justify-center">
        <div className="text-center text-gray-400 dark:text-gray-500">
          <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p className="text-lg font-medium">Select a squad to view messages</p>
          <p className="text-sm">Or wait for a new squad to be created</p>
        </div>
      </main>
    );
  }

  const getAgentInfo = (sourceAgentId: string) => {
    const member = squad.members.find((m) => m.agent.agentId === sourceAgentId);
    if (member) {
      return {
        name: member.agent.name,
        type: member.agent.agentType,
        isLeader: member.role === 'LEAD',
      };
    }
    // Fallback for system/unknown agents
    if (sourceAgentId.includes('director')) {
      return { name: 'Director Agent', type: 'DIRECTOR' as AgentType, isLeader: false };
    }
    if (sourceAgentId.includes('governance')) {
      return { name: 'Governance Agent', type: 'SAFETY' as AgentType, isLeader: false };
    }
    return { name: sourceAgentId, type: 'SYSTEM' as AgentType, isLeader: false };
  };

  return (
    <main className="flex-1 flex flex-col bg-white dark:bg-gray-900 relative">
      {/* Squad Header */}
      <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
        <div className="min-w-0 flex-1 mr-4">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-gray-800 dark:text-gray-100 truncate">
              {squad.name || `Squad #${squad.squadId.slice(0, 8)}`}
            </h2>
            <span className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ${
              squad.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
              squad.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-700' :
              'bg-gray-100 text-gray-600'
            }`}>
              {squad.status}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">Goal: {squad.goal}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition-colors">
            View Kafka Log
          </button>
          <button
            onClick={handleForceHalt}
            disabled={isHalting}
            className="px-3 py-1.5 bg-white dark:bg-gray-800 border rounded text-xs shadow-sm text-red-500 dark:text-red-400 border-red-200 dark:border-red-800 transition-colors hover:bg-red-50 dark:hover:bg-red-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isHalting ? 'Halting...' : 'Force Halt'}
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin relative"
      >
        {squad.triggerSource && (
          <div className="mx-auto max-w-2xl text-center my-4">
            <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-full text-xs">
              Trigger: {squad.triggerSource}
            </span>
          </div>
        )}

        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <p className="text-sm font-medium">No messages yet</p>
              <p className="text-xs mt-1">Agents are initializing...</p>
            </div>
          </div>
        ) : (
          messages.map((message) => {
            const agentInfo = getAgentInfo(message.sourceAgentId);
            return (
              <MessageBubble
                key={message.id}
                message={message}
                agentName={agentInfo.name}
                agentType={agentInfo.type}
                isLeader={agentInfo.isLeader}
                isBlocked={message.governanceStatus === 'BLOCKED'}
              />
            );
          })
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* New messages indicator */}
      {hasNewMessages && (
        <div className="flex justify-center -mt-2 mb-1 relative z-10">
          <button
            onClick={scrollToBottom}
            className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-full shadow-lg hover:bg-indigo-700 transition-colors flex items-center gap-1.5 animate-bounce"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
            New messages
          </button>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto relative">
          <input
            ref={inputRef}
            type="text"
            placeholder="Intervene as Human Admin..."
            className="w-full pl-4 pr-12 py-3 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
          />
          <button
            type="submit"
            className="absolute right-2 top-2 p-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>
    </main>
  );
}
