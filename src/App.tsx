/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { AuthModal } from './components/auth/AuthModal';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { DashboardView } from './components/dashboard/DashboardView';
import { IdeaLabView } from './components/idealab/IdeaLabView';
import { LandingPage } from './components/landing/LandingPage';
import { AppShell } from './components/layout/AppShell';
import { ProjectsView } from './components/projects/ProjectsView';
import { ProjectWorkspaceView } from './components/projects/ProjectWorkspaceView';
import { ResourcesView } from './components/resources/ResourcesView';
import { SettingsView } from './components/settings/SettingsView';
import { TaskManagerView } from './components/tasks/TaskManagerView';
import { SkeletonRow } from './components/ui/Primitives';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import {
  subscribeActivities,
  subscribeMilestones,
  subscribeProjects,
  subscribeResources,
  subscribeTasks,
} from './lib/nexoraService';
import type {
  ActivityItem,
  AppView,
  Milestone,
  Project,
  Resource,
  Task,
} from './types/nexora';

function NexoraAppContent() {
  const { user, loading: authLoading } = useAuth();

  const [view, setView] = useState<AppView>('landing');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [pendingView, setPendingView] = useState<'dashboard' | 'idealab'>('dashboard');

  const [projects, setProjects] = useState<Project[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [dataReady, setDataReady] = useState(false);

  useEffect(() => {
    if (!user) {
      setProjects([]);
      setMilestones([]);
      setTasks([]);
      setResources([]);
      setActivities([]);
      setDataReady(false);
      if (view !== 'landing') {
        setView('landing');
      }
      return;
    }

    const unsubProjects = subscribeProjects(user.uid, (items) => {
      setProjects(items);
      setDataReady(true);
    });
    const unsubMilestones = subscribeMilestones(user.uid, setMilestones);
    const unsubTasks = subscribeTasks(user.uid, setTasks);
    const unsubResources = subscribeResources(user.uid, setResources);
    const unsubActivities = subscribeActivities(user.uid, setActivities);

    return () => {
      unsubProjects();
      unsubMilestones();
      unsubTasks();
      unsubResources();
      unsubActivities();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  const handleOpenWorkspace = (target: 'dashboard' | 'idealab' = 'dashboard') => {
    setView(target);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRequireAuth = (target: 'dashboard' | 'idealab') => {
    setPendingView(target);
    setAuthModalOpen(true);
  };

  const handleOpenProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setView('project-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[var(--nx-bg-primary)] flex items-center justify-center p-6">
        <div className="w-full max-w-md flex flex-col gap-3">
          <SkeletonRow className="h-10" />
          <SkeletonRow className="h-24" />
        </div>
      </div>
    );
  }

  if (view === 'landing' || !user) {
    return (
      <>
        <LandingPage
          onOpenWorkspace={handleOpenWorkspace}
          onRequireAuth={handleRequireAuth}
        />
        <AuthModal
          open={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onAuthenticated={() => handleOpenWorkspace(pendingView)}
        />
      </>
    );
  }

  const activeProject = projects.find((p) => p.id === selectedProjectId);

  const breadcrumbMap: Record<Exclude<AppView, 'landing'>, string> = {
    dashboard: 'Dashboard',
    idealab: 'AI Idea Lab',
    projects: 'Projects',
    'project-detail': activeProject?.title || 'Project Workspace',
    tasks: 'Tasks',
    resources: 'Resources',
    settings: 'Settings',
  };

  return (
    <AppShell
      currentView={view}
      onNavigate={(next) => {
        setView(next);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }}
      breadcrumb={breadcrumbMap[view]}
    >
      {!dataReady ? (
        <div className="flex flex-col gap-4">
          <SkeletonRow className="h-12" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <SkeletonRow className="h-28" />
            <SkeletonRow className="h-28" />
            <SkeletonRow className="h-28" />
            <SkeletonRow className="h-28" />
          </div>
          <SkeletonRow className="h-56" />
        </div>
      ) : (
        <>
          {view === 'dashboard' && (
            <DashboardView
              projects={projects}
              milestones={milestones}
              tasks={tasks}
              activities={activities}
              onNavigate={setView}
              onOpenProject={handleOpenProject}
            />
          )}
          {view === 'idealab' && (
            <IdeaLabView onProjectSaved={(id) => handleOpenProject(id)} />
          )}
          {view === 'projects' && (
            <ProjectsView
              projects={projects}
              tasks={tasks}
              onOpenProject={handleOpenProject}
              onNavigate={setView}
            />
          )}
          {view === 'project-detail' && (
            <ProjectWorkspaceView
              project={activeProject}
              milestones={milestones}
              tasks={tasks}
              resources={resources}
              onBack={() => setView('projects')}
            />
          )}
          {view === 'tasks' && (
            <TaskManagerView
              projects={projects}
              tasks={tasks}
              onNavigate={setView}
            />
          )}
          {view === 'resources' && (
            <ResourcesView projects={projects} resources={resources} />
          )}
          {view === 'settings' && (
            <SettingsView
              projects={projects}
              milestones={milestones}
              tasks={tasks}
              resources={resources}
            />
          )}
        </>
      )}
    </AppShell>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <NexoraAppContent />
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
