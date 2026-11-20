import React, { useMemo, useState } from 'react';
import { Check, CheckSquare, Edit3, LayoutGrid, List, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { createTask, deleteTask, updateTask } from '../../lib/nexoraService';
import type {
  AppView,
  Project,
  Task,
  TaskPriority,
  TaskStatus,
} from '../../types/nexora';
import {
  Button,
  Card,
  EmptyState,
  FieldWrapper,
  IconButton,
  Input,
  Modal,
  SearchInput,
  Select,
  Textarea,
} from '../ui/Primitives';

interface TaskManagerViewProps {
  projects: Project[];
  tasks: Task[];
  onNavigate: (view: AppView) => void;
}

const COLUMNS: Array<{ id: TaskStatus; label: string }> = [
  { id: 'todo', label: 'To Do' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'review', label: 'In Review' },
  { id: 'done', label: 'Done' },
];

const PRIORITY_RANK: Record<TaskPriority, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
};

const PRIORITY_TEXT_CLASS: Record<TaskPriority, string> = {
  urgent: 'text-[var(--nx-error)]',
  high: 'text-[var(--nx-warning)]',
  medium: 'text-[var(--nx-accent-primary)]',
  low: 'text-[var(--nx-text-muted)]',
};

export function TaskManagerView({ projects, tasks, onNavigate }: TaskManagerViewProps) {
  const { user } = useAuth();
  const { notify } = useToast();

  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | TaskPriority>('all');
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'order'>('order');

  // Create / Edit Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formProjectId, setFormProjectId] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formStatus, setFormStatus] = useState<TaskStatus>('todo');
  const [formPriority, setFormPriority] = useState<TaskPriority>('medium');
  const [formDueDate, setFormDueDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const projectMap = useMemo(() => new Map(projects.map((p) => [p.id, p.title])), [projects]);

  const filteredTasks = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = tasks.filter((t) => {
      if (projectFilter !== 'all' && t.projectId !== projectFilter) return false;
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
      if (
        q &&
        !t.title.toLowerCase().includes(q) &&
        !t.description.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });

    if (sortBy === 'priority') {
      return [...list].sort((a, b) => PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority]);
    }
    if (sortBy === 'dueDate') {
      return [...list].sort((a, b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999'));
    }
    return list;
  }, [tasks, projectFilter, priorityFilter, search, sortBy]);

  const openCreateModal = (defaultStatus: TaskStatus = 'todo') => {
    setEditingTask(null);
    setFormProjectId(projects[0]?.id || '');
    setFormTitle('');
    setFormDesc('');
    setFormStatus(defaultStatus);
    setFormPriority('medium');
    setFormDueDate('');
    setModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setFormProjectId(task.projectId);
    setFormTitle(task.title);
    setFormDesc(task.description);
    setFormStatus(task.status);
    setFormPriority(task.priority);
    setFormDueDate(task.dueDate);
    setModalOpen(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formTitle.trim() || !formProjectId) return;
    setSubmitting(true);
    try {
      if (editingTask) {
        await updateTask(
          user.uid,
          editingTask.id,
          {
            title: formTitle,
            description: formDesc,
            status: formStatus,
            priority: formPriority,
            dueDate: formDueDate,
          },
          {
            projectId: editingTask.projectId,
            taskTitle: formTitle,
            previousStatus: editingTask.status,
          }
        );
        notify('Task updated.', 'success');
      } else {
        await createTask(user.uid, {
          projectId: formProjectId,
          title: formTitle,
          description: formDesc,
          status: formStatus,
          priority: formPriority,
          dueDate: formDueDate,
          orderIndex: tasks.length,
        });
        notify('Task created.', 'success');
      }
      setModalOpen(false);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to save task.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (task: Task, nextStatus: TaskStatus) => {
    if (!user || task.status === nextStatus) return;
    try {
      await updateTask(
        user.uid,
        task.id,
        { status: nextStatus },
        {
          projectId: task.projectId,
          taskTitle: task.title,
          previousStatus: task.status,
        }
      );
      if (nextStatus === 'done') {
        notify(`Completed "${task.title}"`, 'success');
      }
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to update status.', 'error');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
            Task Manager
          </h2>
          <p className="text-sm text-[var(--nx-text-secondary)] mt-1">
            {tasks.filter((t) => t.status !== 'done').length} open ·{' '}
            {tasks.filter((t) => t.status === 'done').length} completed
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex items-center p-1 rounded-xl bg-[var(--nx-surface-base)] border border-[var(--nx-border-subtle)]">
            <button
              type="button"
              onClick={() => setViewMode('board')}
              aria-label="Kanban board view"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                viewMode === 'board'
                  ? 'bg-[var(--nx-accent-primary)] text-[var(--nx-text-on-accent)]'
                  : 'text-[var(--nx-text-secondary)]'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Board</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              aria-label="List view"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-[var(--nx-accent-primary)] text-[var(--nx-text-on-accent)]'
                  : 'text-[var(--nx-text-secondary)]'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
          </div>

          <Button
            onClick={() => openCreateModal('todo')}
            disabled={projects.length === 0}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            New Task
          </Button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search tasks..."
          ariaLabel="Search tasks"
        />
        <Select
          value={projectFilter}
          aria-label="Filter by project"
          onChange={(e) => setProjectFilter(e.target.value)}
        >
          <option value="all">All Projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </Select>
        <Select
          value={priorityFilter}
          aria-label="Filter by priority"
          onChange={(e) => setPriorityFilter(e.target.value as 'all' | TaskPriority)}
        >
          <option value="all">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </Select>
        <Select
          value={sortBy}
          aria-label="Sort tasks"
          onChange={(e) => setSortBy(e.target.value as 'dueDate' | 'priority' | 'order')}
        >
          <option value="order">Sort: Default Order</option>
          <option value="priority">Sort: Highest Priority</option>
          <option value="dueDate">Sort: Earliest Due Date</option>
        </Select>
      </div>

      {/* Empty States */}
      {projects.length === 0 ? (
        <EmptyState
          icon={<CheckSquare className="w-5 h-5" />}
          title="Create a project first"
          description="Tasks belong to a project roadmap. Start in the AI Idea Lab or create a project to begin managing tasks."
          action={<Button onClick={() => onNavigate('idealab')}>Launch AI Idea Lab</Button>}
        />
      ) : filteredTasks.length === 0 && tasks.length === 0 ? (
        <EmptyState
          icon={<CheckSquare className="w-5 h-5" />}
          title="No tasks yet"
          description="Add your first task to start tracking execution across your Kanban board."
          action={<Button onClick={() => openCreateModal('todo')}>Create First Task</Button>}
        />
      ) : viewMode === 'board' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 items-start">
          {COLUMNS.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col.id);
            return (
              <div key={col.id} className="flex flex-col gap-3">
                <div className="flex items-center justify-between pb-2.5 border-b border-[var(--nx-border-subtle)]">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-sm font-semibold">{col.label}</h3>
                    <span className="font-mono-num text-xs text-[var(--nx-text-muted)]">
                      {colTasks.length}
                    </span>
                  </div>
                  <IconButton
                    label={`Add task to ${col.label}`}
                    className="!w-8 !h-8"
                    onClick={() => openCreateModal(col.id)}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </IconButton>
                </div>

                {colTasks.length === 0 ? (
                  <p className="text-xs text-[var(--nx-text-muted)] text-center py-8 border border-dashed border-[var(--nx-border-subtle)] rounded-xl">
                    No tasks in {col.label}
                  </p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {colTasks.map((task) => (
                      <div
                        key={task.id}
                        className="rounded-xl bg-[var(--nx-surface-base)] border border-[var(--nx-border-subtle)] p-4 flex flex-col gap-3 hover:border-[var(--nx-border-strong)] transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`text-[11px] font-semibold capitalize ${PRIORITY_TEXT_CLASS[task.priority]}`}
                          >
                            {task.priority} priority
                          </span>
                          <div className="flex items-center gap-0.5">
                            <button
                              type="button"
                              aria-label={`Edit ${task.title}`}
                              onClick={() => openEditModal(task)}
                              className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-[var(--nx-text-muted)] hover:text-[var(--nx-text-primary)] hover:bg-[var(--nx-surface-elevated)] transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              aria-label={`Delete ${task.title}`}
                              onClick={() => void deleteTask(task.id)}
                              className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-[var(--nx-text-muted)] hover:text-[var(--nx-error)] hover:bg-[var(--nx-error-bg)] transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <p className="text-sm font-medium text-[var(--nx-text-primary)] leading-snug">
                          {task.title}
                        </p>

                        <div className="text-xs text-[var(--nx-text-muted)] truncate">
                          {projectMap.get(task.projectId) || 'Project'}
                          {task.dueDate ? ` · ${task.dueDate}` : ''}
                        </div>

                        <Select
                          value={task.status}
                          aria-label={`Move ${task.title} to column`}
                          className="!h-9 !py-1 !px-2.5 text-xs"
                          onChange={(e) =>
                            void handleStatusChange(task, e.target.value as TaskStatus)
                          }
                        >
                          {COLUMNS.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.label}
                            </option>
                          ))}
                        </Select>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <Card className="!p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--nx-border-subtle)] text-xs text-[var(--nx-text-muted)]">
                  <th className="py-3 px-4 font-medium">Task</th>
                  <th className="py-3 px-4 font-medium">Project</th>
                  <th className="py-3 px-4 font-medium">Priority</th>
                  <th className="py-3 px-4 font-medium">Due Date</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--nx-border-subtle)] text-sm">
                {filteredTasks.map((task) => {
                  const isDone = task.status === 'done';
                  return (
                    <tr key={task.id} className="hover:bg-[var(--nx-bg-primary)]/60">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            aria-label={`Toggle ${task.title}`}
                            onClick={() =>
                              void handleStatusChange(task, isDone ? 'todo' : 'done')
                            }
                            className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 cursor-pointer ${
                              isDone
                                ? 'bg-[var(--nx-accent-primary)] border-[var(--nx-accent-primary)] text-white'
                                : 'border-[var(--nx-border-strong)]'
                            }`}
                          >
                            {isDone && <Check className="w-3 h-3" />}
                          </button>
                          <span
                            className={
                              isDone ? 'line-through text-[var(--nx-text-muted)]' : 'font-medium'
                            }
                          >
                            {task.title}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs text-[var(--nx-text-secondary)]">
                        {projectMap.get(task.projectId) || 'Project'}
                      </td>
                      <td
                        className={`py-3 px-4 text-xs font-medium capitalize ${PRIORITY_TEXT_CLASS[task.priority]}`}
                      >
                        {task.priority}
                      </td>
                      <td className="py-3 px-4 font-mono-num text-xs text-[var(--nx-text-secondary)]">
                        {task.dueDate || '—'}
                      </td>
                      <td className="py-3 px-4">
                        <Select
                          value={task.status}
                          aria-label={`Status for ${task.title}`}
                          className="!h-8 !py-1 !px-2 text-xs !w-auto"
                          onChange={(e) =>
                            void handleStatusChange(task, e.target.value as TaskStatus)
                          }
                        >
                          {COLUMNS.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.label}
                            </option>
                          ))}
                        </Select>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          <IconButton label={`Edit ${task.title}`} onClick={() => openEditModal(task)}>
                            <Edit3 className="w-3.5 h-3.5" />
                          </IconButton>
                          <IconButton
                            label={`Delete ${task.title}`}
                            variant="destructive"
                            onClick={() => void deleteTask(task.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </IconButton>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Create / Edit Task Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingTask ? 'Edit Task' : 'Create Task'}
      >
        <form onSubmit={handleSaveTask} className="flex flex-col gap-4">
          {!editingTask && (
            <FieldWrapper label="Project" htmlFor="tm-proj">
              <Select
                id="tm-proj"
                value={formProjectId}
                onChange={(e) => setFormProjectId(e.target.value)}
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </Select>
            </FieldWrapper>
          )}

          <FieldWrapper label="Task Title" htmlFor="tm-title">
            <Input
              id="tm-title"
              required
              maxLength={200}
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="e.g., Ship landing page copy review"
            />
          </FieldWrapper>

          <FieldWrapper label="Description" htmlFor="tm-desc">
            <Textarea
              id="tm-desc"
              rows={3}
              maxLength={1000}
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
            />
          </FieldWrapper>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FieldWrapper label="Status" htmlFor="tm-status">
              <Select
                id="tm-status"
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as TaskStatus)}
              >
                {COLUMNS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </FieldWrapper>

            <FieldWrapper label="Priority" htmlFor="tm-prio">
              <Select
                id="tm-prio"
                value={formPriority}
                onChange={(e) => setFormPriority(e.target.value as TaskPriority)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </Select>
            </FieldWrapper>

            <FieldWrapper label="Due Date" htmlFor="tm-due">
              <Input
                id="tm-due"
                type="date"
                value={formDueDate}
                onChange={(e) => setFormDueDate(e.target.value)}
              />
            </FieldWrapper>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              {editingTask ? 'Save Changes' : 'Create Task'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
