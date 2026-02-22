'use client';

import { CSSProperties, useEffect, useRef } from 'react';
import {
  useSettings,
  ThemeMode,
  FontFamily,
  FontSize,
  MessageDensity,
} from '../context/SettingsContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FONT_OPTIONS: { value: FontFamily; label: string; preview: string }[] = [
  { value: 'geist', label: 'Geist Sans', preview: 'The quick brown fox jumps over the lazy dog' },
  { value: 'inter', label: 'Inter', preview: 'The quick brown fox jumps over the lazy dog' },
  { value: 'jetbrains-mono', label: 'JetBrains Mono', preview: 'The quick brown fox jumps over the lazy dog' },
  { value: 'fira-code', label: 'Fira Code', preview: 'const fn = () => {}' },
  { value: 'system', label: 'System Default', preview: 'The quick brown fox jumps over the lazy dog' },
];

const FONT_PREVIEW_STYLE: Record<FontFamily, CSSProperties> = {
  'geist': { fontFamily: 'var(--font-geist-sans)' },
  'inter': { fontFamily: 'var(--font-inter)' },
  'jetbrains-mono': { fontFamily: 'var(--font-jetbrains-mono)' },
  'fira-code': { fontFamily: 'var(--font-fira-code)' },
  'system': { fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
};

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { settings, updateSetting, resetSettings, resolvedTheme } = useSettings();
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col border border-gray-200 dark:border-gray-700"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Settings</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Customize your dashboard</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 scrollbar-thin">

          {/* ─── Appearance ─── */}
          <Section title="Appearance">
            {/* Theme */}
            <SettingRow label="Theme" description="Choose light, dark, or match your system">
              <div className="flex gap-2">
                {(['light', 'dark', 'system'] as ThemeMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => updateSetting('theme', mode)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      settings.theme === mode
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {mode === 'light' && '☀️ '}
                    {mode === 'dark' && '🌙 '}
                    {mode === 'system' && '💻 '}
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>
            </SettingRow>

            {/* Font Family */}
            <SettingRow label="Font" description="Select a font for the interface">
              <div className="space-y-1.5 w-full">
                {FONT_OPTIONS.map((font) => (
                  <button
                    key={font.value}
                    onClick={() => updateSetting('fontFamily', font.value)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all flex items-center justify-between ${
                      settings.fontFamily === font.value
                        ? 'bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-300 dark:border-indigo-600'
                        : 'bg-gray-50 dark:bg-gray-800 border border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div>
                      <span className="font-medium text-gray-800 dark:text-gray-200">{font.label}</span>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5" style={FONT_PREVIEW_STYLE[font.value]}>
                        {font.preview}
                      </p>
                    </div>
                    {settings.fontFamily === font.value && (
                      <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </SettingRow>

            {/* Font Size */}
            <SettingRow label="Font Size" description="Adjust text size across the dashboard">
              <div className="flex gap-2">
                {(['small', 'medium', 'large'] as FontSize[]).map((size) => (
                  <button
                    key={size}
                    onClick={() => updateSetting('fontSize', size)}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                      settings.fontSize === size
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    } ${size === 'small' ? 'text-[11px]' : size === 'medium' ? 'text-xs' : 'text-sm'}`}
                  >
                    {size.charAt(0).toUpperCase() + size.slice(1)}
                  </button>
                ))}
              </div>
            </SettingRow>
          </Section>

          {/* ─── Messages ─── */}
          <Section title="Messages">
            {/* Message Density */}
            <SettingRow label="Density" description="How tightly messages are spaced">
              <div className="flex gap-2">
                {(['compact', 'comfortable', 'spacious'] as MessageDensity[]).map((density) => (
                  <button
                    key={density}
                    onClick={() => updateSetting('messageDensity', density)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      settings.messageDensity === density
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {density.charAt(0).toUpperCase() + density.slice(1)}
                  </button>
                ))}
              </div>
            </SettingRow>

            {/* Timestamps */}
            <SettingRow label="Show Timestamps" description="Display time next to messages">
              <Toggle
                checked={settings.showTimestamps}
                onChange={(v) => updateSetting('showTimestamps', v)}
              />
            </SettingRow>

            {/* Agent Type Badges */}
            <SettingRow label="Agent Type Badges" description="Show role badges on messages">
              <Toggle
                checked={settings.showAgentTypes}
                onChange={(v) => updateSetting('showAgentTypes', v)}
              />
            </SettingRow>
          </Section>

          {/* ─── Behavior ─── */}
          <Section title="Behavior">
            <SettingRow label="Animations" description="Enable slide-in and transition effects">
              <Toggle
                checked={settings.enableAnimations}
                onChange={(v) => updateSetting('enableAnimations', v)}
              />
            </SettingRow>

            <SettingRow label="Sound Notifications" description="Play a sound on new messages">
              <Toggle
                checked={settings.enableSounds}
                onChange={(v) => updateSetting('enableSounds', v)}
              />
            </SettingRow>

            <SettingRow label="Auto-scroll" description="Scroll to bottom on new messages when near bottom">
              <Toggle
                checked={settings.autoScrollOnNewMessage}
                onChange={(v) => updateSetting('autoScrollOnNewMessage', v)}
              />
            </SettingRow>
          </Section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50">
          <button
            onClick={resetSettings}
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
          >
            Reset to Defaults
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Sub-components ─── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
        {title}
      </h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{label}</span>
        <p className="text-[11px] text-gray-400 dark:text-gray-500">{description}</p>
      </div>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-5 rounded-full transition-colors ${
        checked ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}
