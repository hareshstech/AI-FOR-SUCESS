import React from 'react';
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  FolderPlus,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import type {
  ActivityItem,
  AppView,
  Milestone,
  Project,
  Task,
} from '../../types/nexora';
import { Button, Card, EmptyState, ProgressBar } from '../ui/Primitives';

interface DashboardViewProps {
  projects: Project[];
  milestones: Milestone[];
  tasks: Task[];
  activities: ActivityItem[];
  onNavigate: (view: AppView) => void;
  onOpenProject: (projectId: string) => void;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function DashboardView({
  projects,
  milestones,
  tasks,
  activities,
  onNavigate,
  onOpenProject,
}: DashboardViewProps) {
  const { profile, user } = useAuth();
  const firstName =
    (profile?.displayName || user?.displayName || 'Builder').split(/\s+/)[0] || 'Builder';

  const activeProjects = projects.filter((p) => p.status === 'active' || p.status === 'planning');
  const completedTasks = tasks.filter((t) => t.status === 'done');
  const openTasks = tasks.filter((t) => t.status !== 'done');
  const completionRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;
  const pendingMilestones = milestones.filter((m) => m.status !== 'completed');

  const statusCounts = [
    { key: 'todo', label: 'To Do', count: tasks.filter((t) => t.status === 'todo').length, color: 'bg-[var(--nx-text-muted)]' },
    { key: 'in_progress', label: 'In Progress', count: tasks.filter((t) => t.status === 'in_progress').length, color: 'bg-[var(--nx-accent-primary)]' },
    { key: 'review', label: 'In Review', count: tasks.filter((t) => t.status === 'review').length, color: 'bg-[var(--nx-warning)]' },
    { key: 'done', label: 'Done', count: tasks.filter((t) => t.status === 'done').length, color: 'bg-[var(--nx-success)]' },
  ];

  const upcomingDeadlines = [
    ...milestones
      .filter((m) => m.status !== 'completed' && m.dueDate)
      .map((m) => ({
        id: m.id,
        kind: 'Milestone',
        title: m.title,
        dueDate: m.dueDate,
        projectId: m.projectId,
      })),
    ...tasks
      .filter((t) => t.status !== 'done' && t.dueDate)
      .map((t) => ({
        id: t.id,
        kind: 'Task',
        title: t.title,
        dueDate: t.dueDate,
        projectId: t.projectId,
      })),
  ]
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 6);

  const projectNameMap = new Map(projects.map((p) => [p.id, p.title]));

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      {/* Greeting & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
            {getGreeting()}, {firstName}
          </h2>
          <p className="text-sm text-[var(--nx-text-secondary)] mt-1">
            {projects.length === 0
              ? 'Launch the AI Idea Lab to turn your first concept into an execution roadmap.'
              : `You have ${activeProjects.length} active ${activeProjects.length === 1 ? 'project' : 'projects'} and ${openTasks.length} open ${openTasks.length === 1 ? 'task' : 'tasks'}.`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="secondary"
            onClick={() => onNavigate('projects')}
            leftIcon={<FolderPlus className="w-4 h-4" />}
          >
            View Projects
          </Button>
          <Button
            onClick={() => onNavigate('idealab')}
            leftIcon={<Sparkles className="w-4 h-4" />}
          >
            AI Idea Lab
          </Button>
        </div>
      </div>

      {/* Real KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Active Projects',
            value: activeProjects.length,
            sub: `${projects.length} total in workspace`,
          },
          {
            label: 'Task Completion',
            value: `${completionRate}%`,
            sub: `${completedTasks.length} of ${tasks.length} tasks done`,
          },
          {
            label: 'Open Tasks',
            value: openTasks.length,
            sub: `${tasks.filter((t) => t.priority === 'urgent' && t.status !== 'done').length} urgent`,
          },
          {
            label: 'Pending Milestones',
            value: pendingMilestones.length,
            sub: `${milestones.filter((m) => m.status === 'completed').length} completed`,
          },
        ].map((kpi) => (
          <Card key={kpi.label} className="flex flex-col justify-between gap-2">
            <span className="text-xs font-medium text-[var(--nx-text-secondary)]">{kpi.label}</span>
            <span className="font-display font-mono-num text-2xl sm:text-3xl font-bold text-[var(--nx-text-primary)]">
              {kpi.value}
            </span>
            <span className="text-xs text-[var(--nx-text-muted)]">{kpi.sub}</span>
          </Card>
        ))}
      </div>

      {/* Main Analytics & Active Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Active Projects & Task Distribution */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Task Status Distribution Chart (100% Real Data) */}
          <Card>
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <h3 className="font-display text-base font-semibold">Execution Distribution</h3>
                <p className="text-xs text-[var(--nx-text-secondary)] mt-0.5">
                  Live breakdown across all workspace tasks
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('tasks')}>
                Task Board
              </Button>
            </div>

            {tasks.length === 0 ? (
              <p className="text-sm text-[var(--nx-text-muted)] py-6 text-center">
                No tasks recorded yet. Create a project or analyze an idea in the AI Idea Lab to populate execution analytics.
              </p>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="h-3 w-full rounded-full bg-[var(--nx-surface-elevated)] overflow-hidden flex">
                  {statusCounts.map((seg) => {
                    const pct = (seg.count / tasks.length) * 100;
                    if (pct === 0) return null;
                    return (
                      <div
                        key={seg.key}
                        title={`${seg.label}: ${seg.count}`}
                        style={{ width: `${pct}%` }}
                        className={`h-full ${seg.color} transition-all duration-300`}
                      />
                    );
                  })}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {statusCounts.map((seg) => (
                    <div
                      key={seg.key}
                      className="rounded-lg bg-[var(--nx-bg-primary)] px-3 py-2.5 flex items-center justify-between gap-2"
                    >
                      <span className="inline-flex items-center gap-2 text-xs text-[var(--nx-text-secondary)]">
                        <span className={`w-2 h-2 rounded-xs shrink-0 ${seg.color}`} aria-hidden="true" />
                        <span>{seg.label}</span>
                      </span>
                      <span className="font-mono-num text-sm font-semibold text-[var(--nx-text-primary)]">
                        {seg.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Project Previews */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-semibold">Recent Projects</h3>
              {projects.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => onNavigate('projects')}>
                  All projects
                </Button>
              )}
            </div>

            {projects.length === 0 ? (
              <EmptyState
                icon={<Sparkles className="w-5 h-5" />}
                title="Your workspace is ready"
                description="Start by entering a raw idea in the AI Idea Lab or creating a manual project roadmap."
                action={
                  <Button onClick={() => onNavigate('idealab')}>Launch AI Idea Lab</Button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {projects.slice(0, 4).map((project) => {
                  const pTasks = tasks.filter((t) => t.projectId === project.id);
                  const pDone = pTasks.filter((t) => t.status === 'done').length;
                  const pct = pTasks.length > 0 ? Math.round((pDone / pTasks.length) * 100) : 0;

                  return (
                    <Card
                      key={project.id}
                      interactive
                      onClick={() => onOpenProject(project.id)}
                      className="flex flex-col justify-between gap-4"
                    >
                      <div>
                        <div className="text-xs text-[var(--nx-text-muted)] flex items-center gap-1.5 mb-1.5">
                          <span>{project.category}</span>
                          <span aria-hidden="true">·</span>
                          <span className="capitalize">{project.status}</span>
                        </div>
                        <h4 className="font-display text-base font-semibold text-[var(--nx-text-primary)] line-clamp-1">
                          {project.title}
                        </h4>
                        <p className="text-xs text-[var(--nx-text-secondary)] mt-1.5 line-clamp-2 leading-relaxed">
                          {project.summary || 'No project summary added yet.'}
                        </p>
                      </div>

                      <div className="flex flex-col gap-3">
                        <ProgressBar
                          value={pct}
                          label={`${pDone}/${pTasks.length} tasks`}
                        />
                        <div className="flex items-center justify-between text-xs text-[var(--nx-text-muted)]">
                          <span>{project.estimatedTimeline || 'Flexible timeline'}</span>
                          <span className="inline-flex items-center gap-1 text-[var(--nx-accent-primary)] font-medium">
                            Open <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Upcoming Deadlines & Real Activity Feed */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-base font-semibold">Upcoming Deadlines</h3>
              <CalendarClock className="w-4 h-4 text-[var(--nx-text-muted)]" />
            </div>

            {upcomingDeadlines.length === 0 ? (
              <p className="text-xs text-[var(--nx-text-muted)] py-4">
                No scheduled due dates yet. Add due dates to milestones or tasks to track upcoming deadlines here.
              </p>
            ) : (
              <ul className="divide-y divide-[var(--nx-border-subtle)]">
                {upcomingDeadlines.map((item) => (
                  <li key={item.id} className="py-3 first:pt-0 last:pb-0">
                    <button
                      type="button"
                      onClick={() => onOpenProject(item.projectId)}
                      className="w-full text-left flex items-start justify-between gap-3 group cursor-pointer"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[var(--nx-text-primary)] truncate group-hover:text-[var(--nx-accent-primary)] transition-colors">
                          {item.title}
                        </p>
                        <p className="text-xs text-[var(--nx-text-muted)] truncate mt-0.5">
                          {item.kind} · {projectNameMap.get(item.projectId) || 'Project'}
                        </p>
                      </div>
                      <span className="font-mono-num text-xs text-[var(--nx-text-secondary)] shrink-0">
                        {item.dueDate}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-base font-semibold">Recent Activity</h3>
              <CheckCircle2 className="w-4 h-4 text-[var(--nx-text-muted)]" />
            </div>

            {activities.length === 0 ? (
              <p className="text-xs text-[var(--nx-text-muted)] py-4">
                Workspace activity will appear here as you analyze ideas, create projects, and complete tasks.
              </p>
            ) : (
              <ul className="space-y-3">
                {activities.slice(0, 7).map((act) => (
                  <li
                    key={act.id}
                    className="text-xs text-[var(--nx-text-secondary)] pb-3 border-b border-[var(--nx-border-subtle)] last:border-b-0 last:pb-0"
                  >
                    <p className="text-[var(--nx-text-primary)] leading-snug">{act.message}</p>
                    <p className="text-[11px] text-[var(--nx-text-muted)] mt-1">
                      {act.createdAt?.toDate
                        ? act.createdAt.toDate().toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Just now'}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
