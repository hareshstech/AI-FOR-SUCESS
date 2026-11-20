import React, { useEffect, useState } from 'react';
import { LogOut, Moon, Save, Sun } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { updateUserProfile } from '../../lib/nexoraService';
import type { Milestone, Project, Resource, Task } from '../../types/nexora';
import { Button, Card, FieldWrapper, Input } from '../ui/Primitives';

interface SettingsViewProps {
  projects: Project[];
  milestones: Milestone[];
  tasks: Task[];
  resources: Resource[];
}

export function SettingsView({ projects, milestones, tasks, resources }: SettingsViewProps) {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { notify } = useToast();

  const [displayName, setDisplayName] = useState(profile?.displayName || user?.displayName || '');
  const [roleTitle, setRoleTitle] = useState(profile?.roleTitle || 'Product Builder');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName);
      setRoleTitle(profile.roleTitle || 'Product Builder');
    }
  }, [profile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !displayName.trim()) return;
    setSaving(true);
    try {
      await updateUserProfile(user.uid, {
        displayName: displayName.trim(),
        roleTitle: roleTitle.trim(),
        themePreference: theme,
      });
      if (profile) {
        refreshProfile({
          ...profile,
          displayName: displayName.trim(),
          roleTitle: roleTitle.trim(),
          themePreference: theme,
        });
      }
      notify('Workspace preferences updated.', 'success');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to update preferences.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleThemeSwitch = async (next: 'dark' | 'light') => {
    setTheme(next);
    if (user) {
      try {
        await updateUserProfile(user.uid, { themePreference: next });
      } catch {
        // local preference already applied
      }
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-sm text-[var(--nx-text-secondary)] mt-1">
          Manage your NEXORA profile, appearance, and workspace session
        </p>
      </div>

      {/* Profile Form */}
      <Card>
        <h3 className="font-display text-base font-semibold mb-4">Profile Information</h3>
        <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldWrapper label="Display Name" htmlFor="set-name">
              <Input
                id="set-name"
                required
                maxLength={100}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </FieldWrapper>
            <FieldWrapper label="Role / Focus" htmlFor="set-role">
              <Input
                id="set-role"
                maxLength={80}
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                placeholder="e.g., Founder, Student, Designer"
              />
            </FieldWrapper>
          </div>

          <FieldWrapper label="Account Email" htmlFor="set-email">
            <Input id="set-email" value={profile?.email || user?.email || ''} disabled />
          </FieldWrapper>

          <div className="flex justify-end pt-2">
            <Button type="submit" loading={saving} leftIcon={<Save className="w-4 h-4" />}>
              Save Profile
            </Button>
          </div>
        </form>
      </Card>

      {/* Appearance */}
      <Card>
        <h3 className="font-display text-base font-semibold mb-1">Appearance</h3>
        <p className="text-xs text-[var(--nx-text-secondary)] mb-4">
          Choose between NEXORA Dark (#10101D) and Light (#F7F6FC) themes.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => void handleThemeSwitch('dark')}
            className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-colors cursor-pointer ${
              theme === 'dark'
                ? 'border-[var(--nx-accent-primary)] bg-[var(--nx-accent-muted)]'
                : 'border-[var(--nx-border-subtle)] bg-[var(--nx-bg-primary)] hover:border-[var(--nx-border-strong)]'
            }`}
          >
            <Moon className="w-5 h-5 text-[var(--nx-accent-primary)] shrink-0" />
            <div>
              <div className="text-sm font-semibold">Dark Mode</div>
              <div className="text-xs text-[var(--nx-text-muted)]">Deep obsidian workspace</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => void handleThemeSwitch('light')}
            className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-colors cursor-pointer ${
              theme === 'light'
                ? 'border-[var(--nx-accent-primary)] bg-[var(--nx-accent-muted)]'
                : 'border-[var(--nx-border-subtle)] bg-[var(--nx-bg-primary)] hover:border-[var(--nx-border-strong)]'
            }`}
          >
            <Sun className="w-5 h-5 text-[var(--nx-accent-primary)] shrink-0" />
            <div>
              <div className="text-sm font-semibold">Light Mode</div>
              <div className="text-xs text-[var(--nx-text-muted)]">High-contrast daylight surface</div>
            </div>
          </button>
        </div>
      </Card>

      {/* Workspace Data Summary */}
      <Card>
        <h3 className="font-display text-base font-semibold mb-4">Workspace Summary</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <div className="font-mono-num text-xl font-bold">{projects.length}</div>
            <div className="text-xs text-[var(--nx-text-muted)]">Projects</div>
          </div>
          <div>
            <div className="font-mono-num text-xl font-bold">{milestones.length}</div>
            <div className="text-xs text-[var(--nx-text-muted)]">Milestones</div>
          </div>
          <div>
            <div className="font-mono-num text-xl font-bold">{tasks.length}</div>
            <div className="text-xs text-[var(--nx-text-muted)]">Tasks</div>
          </div>
          <div>
            <div className="font-mono-num text-xl font-bold">{resources.length}</div>
            <div className="text-xs text-[var(--nx-text-muted)]">Resources</div>
          </div>
        </div>
      </Card>

      {/* Session */}
      <Card className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-display text-base font-semibold">Account Session</h3>
          <p className="text-xs text-[var(--nx-text-secondary)] mt-0.5">
            Signed in with Google Authentication
          </p>
        </div>
        <Button variant="secondary" onClick={signOut} leftIcon={<LogOut className="w-4 h-4" />}>
          Sign Out
        </Button>
      </Card>
    </div>
  );
}
