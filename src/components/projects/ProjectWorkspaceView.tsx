import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Bookmark,
  Check,
  Edit3,
  ExternalLink,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  createMilestone,
  createResource,
  createTask,
  deleteMilestone,
  deleteProjectCascade,
  deleteResource,
  deleteTask,
  updateMilestone,
  updateProject,
  updateTask,
} from '../../lib/nexoraService';
import {
  IDEA_CATEGORIES,
  type Milestone,
  type MilestoneStatus,
  type Project,
  type ProjectPriority,
  type ProjectStatus,
  type Resource,
  type Task,
  type TaskPriority,
} from '../../types/nexora';
import {
  Button,
  Card,
  EmptyState,
  FieldWrapper,
  IconButton,
  Input,
  Modal,
  ProgressBar,
  Select,
  Textarea,
} from '../ui/Primitives';

interface ProjectWorkspaceViewProps {
  project: Project | undefined;
  milestones: Milestone[];
  tasks: Task[];
  resources: Resource[];
  onBack: () => void;
}

export function ProjectWorkspaceView({
  project,
  milestones,
  tasks,
  resources,
  onBack,
}: ProjectWorkspaceViewProps) {
  const { user } = useAuth();
  const { notify } = useToast();

  const [notes, setNotes] = useState(project?.notes || '');
  const [savingNotes, setSavingNotes] = useState(false);

  // Edit Project modal state
  const [editProjectOpen, setEditProjectOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editSummary, setEditSummary] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editStatus, setEditStatus] = useState<ProjectStatus>('active');
  const [editPriority, setEditPriority] = useState<ProjectPriority>('medium');
  const [editTargetDate, setEditTargetDate] = useState('');

  // Delete confirm modal
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Add Milestone modal
  const [msModalOpen, setMsModalOpen] = useState(false);
  const [msTitle, setMsTitle] = useState('');
  const [msDesc, setMsDesc] = useState('');
  const [msDueDate, setMsDueDate] = useState('');

  // Add Task modal
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('medium');
  const [taskMilestoneId, setTaskMilestoneId] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');

  // Add Resource modal
  const [resModalOpen, setResModalOpen] = useState(false);
  const [resTitle, setResTitle] = useState('');
  const [resUrl, setResUrl] = useState('');
  const [resCategory, setResCategory] = useState('Documentation');

  useEffect(() => {
    setNotes(project?.notes || '');
  }, [project?.id, project?.notes]);

  if (!project) {
    return (
      <EmptyState
        icon={<ArrowLeft className="w-5 h-5" />}
        title="Project not found"
        description="This project may have been deleted or does not exist."
        action={<Button onClick={onBack}>Back to Projects</Button>}
      />
    );
  }

  const pMilestones = milestones.filter((m) => m.projectId === project.id);
  const pTasks = tasks.filter((t) => t.projectId === project.id);
  const pResources = resources.filter((r) => r.projectId === project.id);

  const completedTasksCount = pTasks.filter((t) => t.status === 'done').length;
  const progressPct = pTasks.length > 0 ? Math.round((completedTasksCount / pTasks.length) * 100) : 0;

  const openEditProject = () => {
    setEditTitle(project.title);
    setEditSummary(project.summary);
    setEditCategory(project.category);
    setEditStatus(project.status);
    setEditPriority(project.priority);
    setEditTargetDate(project.targetDate || '');
    setEditProjectOpen(true);
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProject(project.id, {
        title: editTitle,
        summary: editSummary,
        category: editCategory,
        status: editStatus,
        priority: editPriority,
        targetDate: editTargetDate,
      });
      notify('Project updated.', 'success');
      setEditProjectOpen(false);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to update project.', 'error');
    }
  };

  const handleDeleteProject = async () => {
    try {
      await deleteProjectCascade(project.id, milestones, tasks, resources);
      notify('Project deleted.', 'info');
      setDeleteConfirmOpen(false);
      onBack();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to delete project.', 'error');
    }
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      await updateProject(project.id, { notes });
      notify('Project notes saved.', 'success');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to save notes.', 'error');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleCreateMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !msTitle.trim()) return;
    try {
      await createMilestone(user.uid, {
        projectId: project.id,
        title: msTitle,
        description: msDesc,
        dueDate: msDueDate,
        orderIndex: pMilestones.length,
      });
      notify('Milestone added.', 'success');
      setMsModalOpen(false);
      setMsTitle('');
      setMsDesc('');
      setMsDueDate('');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to add milestone.', 'error');
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !taskTitle.trim()) return;
    try {
      await createTask(user.uid, {
        projectId: project.id,
        milestoneId: taskMilestoneId,
        title: taskTitle,
        description: taskDesc,
        priority: taskPriority,
        dueDate: taskDueDate,
        orderIndex: pTasks.length,
      });
      notify('Task added.', 'success');
      setTaskModalOpen(false);
      setTaskTitle('');
      setTaskDesc('');
      setTaskDueDate('');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to add task.', 'error');
    }
  };

  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !resTitle.trim() || !resUrl.trim()) return;
    try {
      await createResource(user.uid, {
        projectId: project.id,
        title: resTitle,
        url: resUrl,
        category: resCategory,
        notes: '',
      });
      notify('Resource linked to project.', 'success');
      setResModalOpen(false);
      setResTitle('');
      setResUrl('');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Invalid URL or save error.', 'error');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Action & Back Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} leftIcon={<ArrowLeft className="w-4 h-4" />}>
          All Projects
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={openEditProject}
            leftIcon={<Edit3 className="w-3.5 h-3.5" />}
          >
            Edit Project
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteConfirmOpen(true)}
            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Project Overview Card */}
      <Card>
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--nx-text-muted)] mb-2">
              <span>{project.category}</span>
              <span aria-hidden="true">·</span>
              <span className="capitalize">{project.status}</span>
              <span aria-hidden="true">·</span>
              <span className="capitalize">Priority: {project.priority}</span>
              {project.targetDate && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono-num">Due {project.targetDate}</span>
                </>
              )}
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[var(--nx-text-primary)]">
              {project.title}
            </h2>
            <p className="mt-2.5 text-sm sm:text-base text-[var(--nx-text-secondary)] leading-relaxed max-w-3xl">
              {project.summary || 'No project summary provided.'}
            </p>
          </div>

          <div className="w-full lg:w-64 shrink-0 lg:pl-6 lg:border-l lg:border-[var(--nx-border-subtle)] flex flex-col justify-center">
            <ProgressBar
              value={progressPct}
              label={`${completedTasksCount} of ${pTasks.length} tasks done`}
            />
            <p className="text-xs text-[var(--nx-text-muted)] mt-2.5">
              Timeline: {project.estimatedTimeline || 'Flexible'}
            </p>
          </div>
        </div>

        {project.objectives && project.objectives.length > 0 && (
          <div className="mt-6 pt-5 border-t border-[var(--nx-border-subtle)]">
            <h3 className="text-xs font-semibold text-[var(--nx-text-secondary)] mb-3">
              Key Objectives
            </h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {project.objectives.map((obj, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 text-sm text-[var(--nx-text-primary)]"
                >
                  <span className="font-mono-num text-xs text-[var(--nx-accent-primary)] mt-0.5">
                    0{i + 1}
                  </span>
                  <span>{obj}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      {/* Main Grid: Milestones + Tasks | Notes + Resources */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Milestones */}
          <Card>
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="font-display text-base font-semibold">Milestone Timeline</h3>
                <p className="text-xs text-[var(--nx-text-muted)] mt-0.5">
                  {pMilestones.filter((m) => m.status === 'completed').length} of {pMilestones.length}{' '}
                  completed
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setMsModalOpen(true)}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Add Milestone
              </Button>
            </div>

            {pMilestones.length === 0 ? (
              <p className="text-sm text-[var(--nx-text-muted)] py-4">
                No milestones yet. Break this project into chronological checkpoints.
              </p>
            ) : (
              <div className="divide-y divide-[var(--nx-border-subtle)]">
                {pMilestones.map((ms) => (
                  <div
                    key={ms.id}
                    className="py-4 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-xs text-[var(--nx-text-muted)]">
                        <span className="font-mono-num">{ms.dueDate || 'No date'}</span>
                        <span aria-hidden="true">·</span>
                        <span className="capitalize">{ms.status.replace('_', ' ')}</span>
                      </div>
                      <h4 className="font-display text-sm font-semibold text-[var(--nx-text-primary)] mt-1">
                        {ms.title}
                      </h4>
                      {ms.description && (
                        <p className="text-xs text-[var(--nx-text-secondary)] mt-1 leading-relaxed">
                          {ms.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Select
                        value={ms.status}
                        aria-label={`Status for ${ms.title}`}
                        className="!h-8 !py-1 !px-2 text-xs !w-auto"
                        onChange={(e) => {
                          if (!user) return;
                          void updateMilestone(
                            user.uid,
                            ms.id,
                            { status: e.target.value as MilestoneStatus, title: ms.title },
                            project.id
                          );
                        }}
                      >
                        <option value="upcoming">Upcoming</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </Select>
                      <IconButton
                        label={`Delete milestone ${ms.title}`}
                        variant="destructive"
                        onClick={() => void deleteMilestone(ms.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </IconButton>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Project Tasks */}
          <Card>
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="font-display text-base font-semibold">Project Tasks</h3>
                <p className="text-xs text-[var(--nx-text-muted)] mt-0.5">
                  Task completions automatically update overall project progress
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => setTaskModalOpen(true)}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Add Task
              </Button>
            </div>

            {pTasks.length === 0 ? (
              <p className="text-sm text-[var(--nx-text-muted)] py-4">
                No tasks in this project yet. Add your first actionable step above.
              </p>
            ) : (
              <ul className="divide-y divide-[var(--nx-border-subtle)]">
                {pTasks.map((task) => {
                  const isDone = task.status === 'done';
                  return (
                    <li
                      key={task.id}
                      className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <button
                          type="button"
                          aria-label={isDone ? `Mark "${task.title}" incomplete` : `Mark "${task.title}" done`}
                          onClick={() => {
                            if (!user) return;
                            void updateTask(
                              user.uid,
                              task.id,
                              { status: isDone ? 'todo' : 'done' },
                              {
                                projectId: project.id,
                                taskTitle: task.title,
                                previousStatus: task.status,
                              }
                            );
                          }}
                          className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                            isDone
                              ? 'bg-[var(--nx-accent-primary)] border-[var(--nx-accent-primary)] text-white'
                              : 'border-[var(--nx-border-strong)] hover:border-[var(--nx-accent-primary)]'
                          }`}
                        >
                          {isDone && <Check className="w-3.5 h-3.5" />}
                        </button>
                        <div className="min-w-0">
                          <p
                            className={`text-sm font-medium truncate ${
                              isDone
                                ? 'line-through text-[var(--nx-text-muted)]'
                                : 'text-[var(--nx-text-primary)]'
                            }`}
                          >
                            {task.title}
                          </p>
                          <p className="text-xs text-[var(--nx-text-muted)] mt-0.5">
                            <span className="capitalize">{task.priority}</span>
                            {task.dueDate ? ` · Due ${task.dueDate}` : ''}
                          </p>
                        </div>
                      </div>

                      <IconButton
                        label={`Delete task ${task.title}`}
                        variant="destructive"
                        onClick={() => void deleteTask(task.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </IconButton>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>

        {/* Right Column: Notes & Linked Resources */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <Card>
            <div className="flex items-center justify-between gap-4 mb-3">
              <h3 className="font-display text-base font-semibold">Project Notes</h3>
              <Button
                variant="secondary"
                size="sm"
                loading={savingNotes}
                onClick={handleSaveNotes}
                leftIcon={<Save className="w-3.5 h-3.5" />}
              >
                Save Notes
              </Button>
            </div>
            <Textarea
              rows={8}
              maxLength={10000}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Capture architecture decisions, meeting notes, or launch checklists..."
            />
          </Card>

          <Card>
            <div className="flex items-center justify-between gap-4 mb-4">
              <h3 className="font-display text-base font-semibold">Linked Resources</h3>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setResModalOpen(true)}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Add Link
              </Button>
            </div>

            {pResources.length === 0 ? (
              <p className="text-xs text-[var(--nx-text-muted)] py-3">
                No resources linked to this project yet.
              </p>
            ) : (
              <ul className="divide-y divide-[var(--nx-border-subtle)]">
                {pResources.map((res) => (
                  <li key={res.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <a
                        href={res.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--nx-text-primary)] hover:text-[var(--nx-accent-primary)] transition-colors max-w-full"
                      >
                        <Bookmark className="w-3.5 h-3.5 text-[var(--nx-accent-primary)] shrink-0" />
                        <span className="truncate">{res.title}</span>
                        <ExternalLink className="w-3 h-3 shrink-0 text-[var(--nx-text-muted)]" />
                      </a>
                      <p className="text-xs text-[var(--nx-text-muted)] truncate mt-0.5">
                        {res.category}
                      </p>
                    </div>
                    <IconButton
                      label={`Remove resource ${res.title}`}
                      variant="destructive"
                      onClick={() => void deleteResource(res.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </IconButton>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      {/* Edit Project Modal */}
      <Modal
        open={editProjectOpen}
        onClose={() => setEditProjectOpen(false)}
        title="Edit Project Details"
      >
        <form onSubmit={handleSaveProject} className="flex flex-col gap-4">
          <FieldWrapper label="Title" htmlFor="ep-title">
            <Input
              id="ep-title"
              required
              maxLength={140}
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
            />
          </FieldWrapper>
          <FieldWrapper label="Summary" htmlFor="ep-summary">
            <Textarea
              id="ep-summary"
              rows={3}
              maxLength={1000}
              value={editSummary}
              onChange={(e) => setEditSummary(e.target.value)}
            />
          </FieldWrapper>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldWrapper label="Status" htmlFor="ep-status">
              <Select
                id="ep-status"
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as ProjectStatus)}
              >
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
              </Select>
            </FieldWrapper>
            <FieldWrapper label="Priority" htmlFor="ep-priority">
              <Select
                id="ep-priority"
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value as ProjectPriority)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </Select>
            </FieldWrapper>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldWrapper label="Category" htmlFor="ep-cat">
              <Select
                id="ep-cat"
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
              >
                {IDEA_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </FieldWrapper>
            <FieldWrapper label="Target Date" htmlFor="ep-date">
              <Input
                id="ep-date"
                type="date"
                value={editTargetDate}
                onChange={(e) => setEditTargetDate(e.target.value)}
              />
            </FieldWrapper>
          </div>
          <div className="flex justify-end gap-2.5 pt-2">
            <Button variant="ghost" onClick={() => setEditProjectOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title="Delete Project?"
        description="This permanently removes this project along with its milestones, tasks, and linked resources."
        maxWidth="max-w-md"
      >
        <div className="flex justify-end gap-2.5 pt-2">
          <Button variant="ghost" onClick={() => setDeleteConfirmOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDeleteProject}>
            Delete Permanently
          </Button>
        </div>
      </Modal>

      {/* Add Milestone Modal */}
      <Modal
        open={msModalOpen}
        onClose={() => setMsModalOpen(false)}
        title="Add Milestone"
      >
        <form onSubmit={handleCreateMilestone} className="flex flex-col gap-4">
          <FieldWrapper label="Milestone Title" htmlFor="ms-title">
            <Input
              id="ms-title"
              required
              maxLength={160}
              value={msTitle}
              onChange={(e) => setMsTitle(e.target.value)}
              placeholder="e.g., Beta release & user testing"
            />
          </FieldWrapper>
          <FieldWrapper label="Description" htmlFor="ms-desc">
            <Textarea
              id="ms-desc"
              rows={2}
              maxLength={600}
              value={msDesc}
              onChange={(e) => setMsDesc(e.target.value)}
            />
          </FieldWrapper>
          <FieldWrapper label="Target Due Date" htmlFor="ms-due">
            <Input
              id="ms-due"
              type="date"
              value={msDueDate}
              onChange={(e) => setMsDueDate(e.target.value)}
            />
          </FieldWrapper>
          <div className="flex justify-end gap-2.5 pt-2">
            <Button variant="ghost" onClick={() => setMsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Milestone</Button>
          </div>
        </form>
      </Modal>

      {/* Add Task Modal */}
      <Modal open={taskModalOpen} onClose={() => setTaskModalOpen(false)} title="Add Project Task">
        <form onSubmit={handleCreateTask} className="flex flex-col gap-4">
          <FieldWrapper label="Task Title" htmlFor="pt-title">
            <Input
              id="pt-title"
              required
              maxLength={200}
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="e.g., Implement onboarding checklist"
            />
          </FieldWrapper>
          <FieldWrapper label="Description" htmlFor="pt-desc">
            <Textarea
              id="pt-desc"
              rows={2}
              maxLength={1000}
              value={taskDesc}
              onChange={(e) => setTaskDesc(e.target.value)}
            />
          </FieldWrapper>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldWrapper label="Priority" htmlFor="pt-prio">
              <Select
                id="pt-prio"
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </Select>
            </FieldWrapper>
            <FieldWrapper label="Due Date" htmlFor="pt-due">
              <Input
                id="pt-due"
                type="date"
                value={taskDueDate}
                onChange={(e) => setTaskDueDate(e.target.value)}
              />
            </FieldWrapper>
          </div>
          {pMilestones.length > 0 && (
            <FieldWrapper label="Milestone (optional)" htmlFor="pt-ms">
              <Select
                id="pt-ms"
                value={taskMilestoneId}
                onChange={(e) => setTaskMilestoneId(e.target.value)}
              >
                <option value="">Unassigned</option>
                {pMilestones.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </Select>
            </FieldWrapper>
          )}
          <div className="flex justify-end gap-2.5 pt-2">
            <Button variant="ghost" onClick={() => setTaskModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Task</Button>
          </div>
        </form>
      </Modal>

      {/* Add Resource Modal */}
      <Modal
        open={resModalOpen}
        onClose={() => setResModalOpen(false)}
        title="Link External Resource"
      >
        <form onSubmit={handleCreateResource} className="flex flex-col gap-4">
          <FieldWrapper label="Title" htmlFor="pr-title">
            <Input
              id="pr-title"
              required
              maxLength={160}
              value={resTitle}
              onChange={(e) => setResTitle(e.target.value)}
              placeholder="e.g., Figma Design System"
            />
          </FieldWrapper>
          <FieldWrapper label="URL (https://)" htmlFor="pr-url">
            <Input
              id="pr-url"
              type="url"
              required
              maxLength={600}
              value={resUrl}
              onChange={(e) => setResUrl(e.target.value)}
              placeholder="https://..."
            />
          </FieldWrapper>
          <FieldWrapper label="Category" htmlFor="pr-cat">
            <Select
              id="pr-cat"
              value={resCategory}
              onChange={(e) => setResCategory(e.target.value)}
            >
              <option value="Documentation">Documentation</option>
              <option value="Design">Design</option>
              <option value="Research">Research</option>
              <option value="Tooling">Tooling</option>
            </Select>
          </FieldWrapper>
          <div className="flex justify-end gap-2.5 pt-2">
            <Button variant="ghost" onClick={() => setResModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Link</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
