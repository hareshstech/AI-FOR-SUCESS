import React, { useState } from 'react';
import { ArrowRight, FolderKanban, Plus, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { createManualProject } from '../../lib/nexoraService';
import {
  IDEA_CATEGORIES,
  type AppView,
  type Project,
  type ProjectPriority,
  type ProjectStatus,
  type Task,
} from '../../types/nexora';
import {
  Button,
  Card,
  EmptyState,
  FieldWrapper,
  Input,
  Modal,
  ProgressBar,
  SearchInput,
  Select,
  Textarea,
} from '../ui/Primitives';

interface ProjectsViewProps {
  projects: Project[];
  tasks: Task[];
  onOpenProject: (projectId: string) => void;
  onNavigate: (view: AppView) => void;
}

export function ProjectsView({
  projects,
  tasks,
  onOpenProject,
  onNavigate,
}: ProjectsViewProps) {
  const { user } = useAuth();
  const { notify } = useToast();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ProjectStatus>('all');
  const [modalOpen, setModalOpen] = useState(false);

  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [category, setCategory] = useState<string>(IDEA_CATEGORIES[0]);
  const [priority, setPriority] = useState<ProjectPriority>('medium');
  const [estimatedTimeline, setEstimatedTimeline] = useState('6 weeks');
  const [targetDate, setTargetDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const filtered = projects.filter((p) => {
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      p.title.toLowerCase().includes(q) ||
      p.summary.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim()) return;
    setSubmitting(true);
    try {
      const id = await createManualProject(user.uid, {
        title,
        summary,
        category,
        priority,
        estimatedTimeline,
        targetDate,
        objectives: [],
      });
      notify('Project created successfully.', 'success');
      setModalOpen(false);
      setTitle('');
      setSummary('');
      setTargetDate('');
      onOpenProject(id);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to create project.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">Projects</h2>
          <p className="text-sm text-[var(--nx-text-secondary)] mt-1">
            {projects.length} {projects.length === 1 ? 'project' : 'projects'} in your workspace
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="secondary"
            onClick={() => onNavigate('idealab')}
            leftIcon={<Sparkles className="w-4 h-4" />}
          >
            Generate with AI
          </Button>
          <Button onClick={() => setModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
            New Project
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search projects..."
          ariaLabel="Search projects"
          className="sm:max-w-sm w-full"
        />

        <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--nx-surface-base)] border border-[var(--nx-border-subtle)] overflow-x-auto">
          {(['all', 'planning', 'active', 'paused', 'completed'] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors whitespace-nowrap cursor-pointer ${
                statusFilter === status
                  ? 'bg-[var(--nx-accent-primary)] text-[var(--nx-text-on-accent)]'
                  : 'text-[var(--nx-text-secondary)] hover:text-[var(--nx-text-primary)]'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<FolderKanban className="w-5 h-5" />}
          title={projects.length === 0 ? 'No projects yet' : 'No matching projects'}
          description={
            projects.length === 0
              ? 'Turn an idea into a structured roadmap with the AI Idea Lab or create a project manually.'
              : 'Try clearing your search query or changing the status filter.'
          }
          action={
            projects.length === 0 ? (
              <Button onClick={() => onNavigate('idealab')}>Launch AI Idea Lab</Button>
            ) : (
              <Button
                variant="secondary"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('all');
                }}
              >
                Reset Filters
              </Button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((project) => {
            const pTasks = tasks.filter((t) => t.projectId === project.id);
            const pDone = pTasks.filter((t) => t.status === 'done').length;
            const pct = pTasks.length > 0 ? Math.round((pDone / pTasks.length) * 100) : 0;

            return (
              <Card
                key={project.id}
                interactive
                onClick={() => onOpenProject(project.id)}
                className="flex flex-col justify-between gap-5"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs text-[var(--nx-text-muted)] mb-2">
                    <span className="truncate">{project.category}</span>
                    <span className="capitalize shrink-0">{project.status}</span>
                  </div>
                  <h3 className="font-display text-base font-semibold text-[var(--nx-text-primary)] line-clamp-1">
                    {project.title}
                  </h3>
                  <p className="text-sm text-[var(--nx-text-secondary)] mt-2 line-clamp-2 leading-relaxed">
                    {project.summary || 'No project summary yet.'}
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <ProgressBar value={pct} label={`${pDone}/${pTasks.length} tasks`} />
                  <div className="flex items-center justify-between text-xs text-[var(--nx-text-muted)] pt-2 border-t border-[var(--nx-border-subtle)]">
                    <span className="capitalize">Priority: {project.priority}</span>
                    <span className="inline-flex items-center gap-1 text-[var(--nx-accent-primary)] font-medium">
                      Workspace <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Manual Create Project Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create New Project"
        description="Start a structured project workspace from scratch."
      >
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <FieldWrapper label="Project Title" htmlFor="new-proj-title">
            <Input
              id="new-proj-title"
              required
              maxLength={140}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Creator Analytics Portal"
            />
          </FieldWrapper>

          <FieldWrapper label="Summary" htmlFor="new-proj-summary">
            <Textarea
              id="new-proj-summary"
              rows={3}
              maxLength={1000}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="What problem does this project solve?"
            />
          </FieldWrapper>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldWrapper label="Category" htmlFor="new-proj-category">
              <Select
                id="new-proj-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {IDEA_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </FieldWrapper>
            <FieldWrapper label="Priority" htmlFor="new-proj-priority">
              <Select
                id="new-proj-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as ProjectPriority)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </Select>
            </FieldWrapper>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldWrapper label="Estimated Timeline" htmlFor="new-proj-timeline">
              <Input
                id="new-proj-timeline"
                maxLength={80}
                value={estimatedTimeline}
                onChange={(e) => setEstimatedTimeline(e.target.value)}
              />
            </FieldWrapper>
            <FieldWrapper label="Target Date" htmlFor="new-proj-date">
              <Input
                id="new-proj-date"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </FieldWrapper>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Create Project
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
