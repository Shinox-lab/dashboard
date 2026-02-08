'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type FontFamily = 'geist' | 'inter' | 'jetbrains-mono' | 'fira-code' | 'system';
export type FontSize = 'small' | 'medium' | 'large';
export type MessageDensity = 'compact' | 'comfortable' | 'spacious';

export interface Settings {
  theme: ThemeMode;
  fontFamily: FontFamily;
  fontSize: FontSize;
  messageDensity: MessageDensity;
  showTimestamps: boolean;
  showAgentTypes: boolean;
  enableSounds: boolean;
  enableAnimations: boolean;
  autoScrollOnNewMessage: boolean;
  messagePollInterval: number; // seconds
}

const DEFAULT_SETTINGS: Settings = {
  theme: 'light',
  fontFamily: 'geist',
  fontSize: 'medium',
  messageDensity: 'comfortable',
  showTimestamps: true,
  showAgentTypes: true,
  enableSounds: false,
  enableAnimations: true,
  autoScrollOnNewMessage: true,
  messagePollInterval: 30,
};

interface SettingsContextType {
  settings: Settings;
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  resetSettings: () => void;
  resolvedTheme: 'light' | 'dark';
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const STORAGE_KEY = 'shinox-settings';

function getStoredSettings(): Settings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch {
    // ignore parse errors
  }
  return DEFAULT_SETTINGS;
}

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setSettings(getStoredSettings());
    setMounted(true);
  }, []);

  // Resolve theme (handle 'system' option)
  useEffect(() => {
    if (!mounted) return;

    const resolve = () => {
      if (settings.theme === 'system') {
        setResolvedTheme(getSystemTheme());
      } else {
        setResolvedTheme(settings.theme);
      }
    };

    resolve();

    // Listen for system theme changes
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (settings.theme === 'system') resolve();
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [settings.theme, mounted]);

  // Apply theme class to <html>
  useEffect(() => {
    if (!mounted) return;
    const html = document.documentElement;
    html.classList.toggle('dark', resolvedTheme === 'dark');
  }, [resolvedTheme, mounted]);

  // Apply font family as data attribute
  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute('data-font', settings.fontFamily);
  }, [settings.fontFamily, mounted]);

  // Apply font size as data attribute
  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute('data-font-size', settings.fontSize);
  }, [settings.fontSize, mounted]);

  // Persist settings
  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings, mounted]);

  const updateSetting = useCallback(<K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, updateSetting, resetSettings, resolvedTheme }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
