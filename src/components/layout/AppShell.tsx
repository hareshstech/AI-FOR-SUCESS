import React, { useState } from 'react';
import {
  Bookmark,
  CheckSquare,
  FolderKanban,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Settings,
  Sparkles,
  Sun,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import type { AppView } from '../../types/nexora';
import { Button, IconButton, NexoraLogo } from '../ui/Primitives';

interface AppShellProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  breadcrumb: string;
  children: React.ReactNode;
}

const NAV_ITEMS: Array<{ id: Exclude<AppView, 'landing' | 'project-detail'>; label: string; icon: React.ReactNode }> = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4 shrink-0" /> },
  { id: 'idealab', label: 'AI Idea Lab', icon: <Sparkles className="w-4 h-4 shrink-0" /> },
  { id: 'projects', label: 'Projects', icon: <FolderKanban className="w-4 h-4 shrink-0" /> },
  { id: 'tasks', label: 'Tasks', icon: <CheckSquare className="w-4 h-4 shrink-0" /> },
  { id: 'resources', label: 'Resources', icon: <Bookmark className="w-4 h-4 shrink-0" /> },
  { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4 shrink-0" /> },
];

export function AppShell({ currentView, onNavigate, breadcrumb, children }: AppShellProps) {
  const { user, profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const displayName = profile?.displayName || user?.displayName || 'Builder';
  const email = profile?.email || user?.email || '';
  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('') || 'NX';

  const handleSelectNav = (view: AppView) => {
    onNavigate(view);
    setMobileNavOpen(false);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between p-4">
      <div>
        <div className="flex items-center justify-between px-2 pb-5 mb-4 border-b border-[var(--nx-border-subtle)]">
          <button
            type="button"
            onClick={() => handleSelectNav('dashboard')}
            className="text-left cursor-pointer"
          >
            <NexoraLogo />
          </button>
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close navigation menu"
            className="lg:hidden p-2 rounded-lg text-[var(--nx-text-secondary)] hover:text-[var(--nx-text-primary)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav aria-label="Workspace navigation" className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              currentView === item.id ||
              (item.id === 'projects' && currentView === 'project-detail');
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectNav(item.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-[var(--nx-accent-muted)] text-[var(--nx-accent-primary)]'
                    : 'text-[var(--nx-text-secondary)] hover:text-[var(--nx-text-primary)] hover:bg-[var(--nx-surface-elevated)]'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="mt-6 pt-4 border-t border-[var(--nx-border-subtle)]">
          <button
            type="button"
            onClick={() => handleSelectNav('landing')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--nx-text-muted)] hover:text-[var(--nx-text-primary)] hover:bg-[var(--nx-surface-elevated)] transition-colors cursor-pointer whitespace-nowrap"
          >
            <Home className="w-4 h-4 shrink-0" />
            <span>Back to Home</span>
          </button>
        </div>
      </div>

      {/* User Footer Card */}
      <div className="pt-4 border-t border-[var(--nx-border-subtle)] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-full bg-[var(--nx-accent-muted)] text-[var(--nx-accent-primary)] font-display text-xs font-bold flex items-center justify-center shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[var(--nx-text-primary)] truncate">
              {displayName}
            </p>
            <p className="text-[11px] text-[var(--nx-text-muted)] truncate">{email}</p>
          </div>
        </div>
        <IconButton label="Sign out" onClick={signOut}>
          <LogOut className="w-4 h-4" />
        </IconButton>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[var(--nx-bg-primary)] text-[var(--nx-text-primary)]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-[252px] lg:shrink-0 lg:flex-col border-r border-[var(--nx-border-subtle)] bg-[var(--nx-surface-base)] sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            onClick={() => setMobileNavOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-[2px]"
          />
          <aside className="relative z-10 w-[272px] max-w-[85vw] bg-[var(--nx-surface-base)] border-r border-[var(--nx-border-strong)] h-full">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 h-16 border-b border-[var(--nx-border-subtle)] bg-[var(--nx-bg-primary)]/90 backdrop-blur-md px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <IconButton
              label="Open navigation menu"
              className="lg:hidden"
              onClick={() => setMobileNavOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </IconButton>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="text-[var(--nx-text-muted)] hidden sm:inline">NEXORA</span>
              <span className="text-[var(--nx-text-muted)] hidden sm:inline" aria-hidden="true">
                /
              </span>
              <h1 className="font-display font-semibold text-[var(--nx-text-primary)] truncate">
                {breadcrumb}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <IconButton
              label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              onClick={toggleTheme}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </IconButton>
            {currentView !== 'idealab' && (
              <Button
                size="sm"
                onClick={() => onNavigate('idealab')}
                leftIcon={<Sparkles className="w-3.5 h-3.5" />}
              >
                New Idea
              </Button>
            )}
          </div>
        </header>

        <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
