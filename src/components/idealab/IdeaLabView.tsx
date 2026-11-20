import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { saveIdeaBlueprintAsProject } from '../../lib/nexoraService';
import {
  IDEA_CATEGORIES,
  type IdeaAnalysisResult,
  type TaskPriority,
} from '../../types/nexora';
import {
  Button,
  Card,
  EmptyState,
  FieldWrapper,
  IconButton,
  Input,
  Select,
  Textarea,
} from '../ui/Primitives';

interface IdeaLabViewProps {
  onProjectSaved: (projectId: string) => void;
}

const STARTER_IDEAS = [
  {
    label: 'Campus Study Match',
    category: 'Student Research',
    text: 'A peer-to-peer study partner and micro-tutoring web app for university students preparing for STEM midterms, with 30-minute focus rooms and shared flashcard decks.',
  },
  {
    label: 'Indie Creator CRM',
    category: 'Software & SaaS',
    text: 'A lightweight sponsorship & brand-deal pipeline manager for YouTube and newsletter creators to track deliverables, invoice dates, and renewal follow-ups.',
  },
  {
    label: 'Neighborhood Tool Library',
    category: 'Community & Impact',
    text: 'A community lending platform where neighbors can share power tools, camping gear, and repair equipment with deposit holds and weekend pickup scheduling.',
  },
];

const PROCESSING_STEPS = [
  'Analyzing idea scope & core problem',
  'Structuring measurable objectives',
  'Building chronological milestones & tasks',
];

export function IdeaLabView({ onProjectSaved }: IdeaLabViewProps) {
  const { user } = useAuth();
  const { notify } = useToast();

  const [ideaText, setIdeaText] = useState('');
  const [category, setCategory] = useState<string>('');
  const [timeframe, setTimeframe] = useState<string>('');
  const [analyzing, setAnalyzing] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [blueprint, setBlueprint] = useState<IdeaAnalysisResult | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!analyzing) {
      setStepIdx(0);
      return;
    }
    const timer = setInterval(() => {
      setStepIdx((prev) => (prev + 1) % PROCESSING_STEPS.length);
    }, 1800);
    return () => clearInterval(timer);
  }, [analyzing]);

  const handleAnalyze = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = ideaText.trim();
    if (trimmed.length < 10) {
      setErrorMsg('Please describe your idea in at least 10 characters.');
      return;
    }

    setAnalyzing(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/ideas/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea: trimmed,
          category: category || undefined,
          timeframe: timeframe || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to analyze idea.');
      }

      const normalized: IdeaAnalysisResult = {
        title: String(data.title || 'Untitled Project'),
        summary: String(data.summary || ''),
        category: String(data.category || category || 'Software & SaaS'),
        estimatedTimeline: String(data.estimatedTimeline || '6 weeks'),
        objectives: Array.isArray(data.objectives) ? data.objectives.map(String) : [],
        milestones: Array.isArray(data.milestones)
          ? data.milestones.map((m: Record<string, unknown>, idx: number) => ({
              id: `draft_ms_${idx}`,
              title: String(m.title || `Milestone ${idx + 1}`),
              description: String(m.description || ''),
              offsetWeeks: Number(m.offsetWeeks) || idx + 1,
            }))
          : [],
        tasks: Array.isArray(data.tasks)
          ? data.tasks.map((t: Record<string, unknown>, idx: number) => ({
              id: `draft_tsk_${idx}`,
              title: String(t.title || `Task ${idx + 1}`),
              description: String(t.description || ''),
              priority: (['low', 'medium', 'high', 'urgent'].includes(String(t.priority))
                ? String(t.priority)
                : 'medium') as TaskPriority,
              milestoneIndex: Number.isInteger(Number(t.milestoneIndex)) ? Number(t.milestoneIndex) : 0,
            }))
          : [],
      };

      setBlueprint(normalized);
      notify('AI blueprint generated. Review and customize before saving.', 'info');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to analyze idea.';
      setErrorMsg(msg);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSaveProject = async () => {
    if (!user || !blueprint) return;
    if (!blueprint.title.trim()) {
      notify('Project title cannot be empty.', 'error');
      return;
    }
    setSaving(true);
    try {
      const projectId = await saveIdeaBlueprintAsProject(user.uid, ideaText, blueprint);
      notify('Project, milestones, and tasks saved to your workspace!', 'success');
      onProjectSaved(projectId);
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to save project.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-[var(--nx-accent-primary)] mb-1">
            Signature Workspace
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
            AI Idea Lab
          </h2>
          <p className="text-sm text-[var(--nx-text-secondary)] mt-1 max-w-2xl">
            Enter a raw idea to synthesize objectives, chronological milestones, and prioritized tasks—then refine inline before launching your project.
          </p>
        </div>
      </div>

      {/* Prompt Composer Card */}
      <Card>
        <form onSubmit={handleAnalyze} className="flex flex-col gap-5">
          <FieldWrapper
            label="What do you want to build?"
            htmlFor="idea-prompt-input"
            hint={`${ideaText.length} / 2000 characters`}
          >
            <Textarea
              id="idea-prompt-input"
              rows={4}
              maxLength={2000}
              value={ideaText}
              onChange={(e) => setIdeaText(e.target.value)}
              placeholder="Describe your idea, target audience, or problem you want to solve..."
            />
          </FieldWrapper>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldWrapper label="Category (optional)" htmlFor="idea-category-select">
              <Select
                id="idea-category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">Auto-detect best category</option>
                {IDEA_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </Select>
            </FieldWrapper>

            <FieldWrapper label="Target Horizon (optional)" htmlFor="idea-timeframe-select">
              <Select
                id="idea-timeframe-select"
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
              >
                <option value="">AI-estimated timeline</option>
                <option value="2 weeks">2-week sprint</option>
                <option value="4 weeks">4 weeks (1 month)</option>
                <option value="8 weeks">8 weeks (2 months)</option>
                <option value="12 weeks">12 weeks (1 quarter)</option>
              </Select>
            </FieldWrapper>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-[var(--nx-border-subtle)]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-[var(--nx-text-muted)]">Try an example:</span>
              {STARTER_IDEAS.map((sample) => (
                <button
                  key={sample.label}
                  type="button"
                  onClick={() => {
                    setIdeaText(sample.text);
                    setCategory(sample.category);
                    setErrorMsg(null);
                  }}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[var(--nx-bg-primary)] border border-[var(--nx-border-subtle)] text-[var(--nx-text-secondary)] hover:text-[var(--nx-text-primary)] hover:border-[var(--nx-border-strong)] transition-colors cursor-pointer whitespace-nowrap"
                >
                  {sample.label}
                </button>
              ))}
            </div>

            <Button
              type="submit"
              loading={analyzing}
              disabled={analyzing || ideaText.trim().length < 10}
              leftIcon={<Sparkles className="w-4 h-4" />}
            >
              {blueprint ? 'Regenerate Blueprint' : 'Analyze Idea'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Processing State */}
      {analyzing && (
        <Card className="py-10 flex flex-col items-center text-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[var(--nx-accent-muted)] text-[var(--nx-accent-primary)] flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
          <div>
            <h3 className="font-display text-base font-semibold">
              {PROCESSING_STEPS[stepIdx]}
            </h3>
            <p className="text-xs text-[var(--nx-text-secondary)] mt-1">
              Synthesizing structured roadmap with Gemini AI...
            </p>
          </div>
        </Card>
      )}

      {/* Error State */}
      {!analyzing && errorMsg && (
        <Card className="border-[var(--nx-error)]/40 bg-[var(--nx-error-bg)]/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[var(--nx-error)] shrink-0 mt-0.5" />
              <div>
                <h3 className="font-display text-sm font-semibold text-[var(--nx-text-primary)]">
                  Analysis could not complete
                </h3>
                <p className="text-xs text-[var(--nx-text-secondary)] mt-1">{errorMsg}</p>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleAnalyze()}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Retry
            </Button>
          </div>
        </Card>
      )}

      {/* Empty Initial State */}
      {!analyzing && !errorMsg && !blueprint && (
        <EmptyState
          icon={<Sparkles className="w-5 h-5" />}
          title="Your structured blueprint will appear here"
          description="Submit an idea above to inspect editable project details, measurable objectives, milestone timelines, and prioritized tasks."
        />
      )}

      {/* Editable AI Blueprint Output */}
      {!analyzing && blueprint && (
        <div className="flex flex-col gap-6">
          {/* Save Banner */}
          <Card className="border-[var(--nx-accent-primary)]/40">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[var(--nx-success)] shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-display text-base font-semibold">
                    Blueprint Ready — Edit & Launch
                  </h3>
                  <p className="text-xs text-[var(--nx-text-secondary)] mt-0.5">
                    Customize any title, objective, milestone, or task below before saving as an active NEXORA project.
                  </p>
                </div>
              </div>
              <Button
                onClick={handleSaveProject}
                loading={saving}
                leftIcon={<Save className="w-4 h-4" />}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Save as Project
              </Button>
            </div>
          </Card>

          {/* Project Metadata Editor */}
          <Card>
            <h3 className="font-display text-base font-semibold mb-4">Project Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="md:col-span-2">
                <FieldWrapper label="Project Title" htmlFor="bp-title">
                  <Input
                    id="bp-title"
                    value={blueprint.title}
                    maxLength={140}
                    onChange={(e) => setBlueprint({ ...blueprint, title: e.target.value })}
                  />
                </FieldWrapper>
              </div>
              <FieldWrapper label="Estimated Timeline" htmlFor="bp-timeline">
                <Input
                  id="bp-timeline"
                  value={blueprint.estimatedTimeline}
                  maxLength={80}
                  onChange={(e) =>
                    setBlueprint({ ...blueprint, estimatedTimeline: e.target.value })
                  }
                />
              </FieldWrapper>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <FieldWrapper label="Executive Summary" htmlFor="bp-summary">
                  <Textarea
                    id="bp-summary"
                    rows={3}
                    maxLength={1000}
                    value={blueprint.summary}
                    onChange={(e) => setBlueprint({ ...blueprint, summary: e.target.value })}
                  />
                </FieldWrapper>
              </div>
              <FieldWrapper label="Category" htmlFor="bp-category">
                <Select
                  id="bp-category"
                  value={blueprint.category}
                  onChange={(e) => setBlueprint({ ...blueprint, category: e.target.value })}
                >
                  {IDEA_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </FieldWrapper>
            </div>
          </Card>

          {/* Objectives Editor */}
          <Card>
            <div className="flex items-center justify-between gap-4 mb-4">
              <h3 className="font-display text-base font-semibold">Core Objectives</h3>
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  setBlueprint({
                    ...blueprint,
                    objectives: [...blueprint.objectives, 'New measurable objective'],
                  })
                }
                disabled={blueprint.objectives.length >= 10}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Add Objective
              </Button>
            </div>

            <div className="flex flex-col gap-2.5">
              {blueprint.objectives.map((obj, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="font-mono-num text-xs text-[var(--nx-text-muted)] w-6 shrink-0">
                    0{idx + 1}
                  </span>
                  <Input
                    value={obj}
                    maxLength={240}
                    aria-label={`Objective ${idx + 1}`}
                    onChange={(e) => {
                      const next = [...blueprint.objectives];
                      next[idx] = e.target.value;
                      setBlueprint({ ...blueprint, objectives: next });
                    }}
                  />
                  <IconButton
                    label={`Remove objective ${idx + 1}`}
                    variant="destructive"
                    onClick={() => {
                      setBlueprint({
                        ...blueprint,
                        objectives: blueprint.objectives.filter((_, i) => i !== idx),
                      });
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </IconButton>
                </div>
              ))}
            </div>
          </Card>

          {/* Milestones & Tasks Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Milestones */}
            <Card>
              <div className="flex items-center justify-between gap-4 mb-4">
                <h3 className="font-display text-base font-semibold">
                  Suggested Milestones ({blueprint.milestones.length})
                </h3>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    setBlueprint({
                      ...blueprint,
                      milestones: [
                        ...blueprint.milestones,
                        {
                          id: `draft_ms_${Date.now()}`,
                          title: `Phase ${blueprint.milestones.length + 1}`,
                          description: '',
                          offsetWeeks: blueprint.milestones.length + 2,
                        },
                      ],
                    })
                  }
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  Add Milestone
                </Button>
              </div>

              <div className="divide-y divide-[var(--nx-border-subtle)]">
                {blueprint.milestones.map((ms, idx) => (
                  <div
                    key={ms.id}
                    className="py-4 first:pt-1 last:pb-1 flex flex-col gap-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono-num text-xs font-medium text-[var(--nx-accent-primary)]">
                        Milestone {idx + 1} · Week {ms.offsetWeeks}
                      </span>
                      <IconButton
                        label={`Remove milestone ${idx + 1}`}
                        variant="destructive"
                        onClick={() =>
                          setBlueprint({
                            ...blueprint,
                            milestones: blueprint.milestones.filter((_, i) => i !== idx),
                          })
                        }
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </IconButton>
                    </div>
                    <Input
                      value={ms.title}
                      maxLength={160}
                      aria-label={`Milestone ${idx + 1} title`}
                      onChange={(e) => {
                        const next = [...blueprint.milestones];
                        next[idx] = { ...ms, title: e.target.value };
                        setBlueprint({ ...blueprint, milestones: next });
                      }}
                    />
                    <Textarea
                      rows={2}
                      value={ms.description}
                      maxLength={600}
                      aria-label={`Milestone ${idx + 1} description`}
                      onChange={(e) => {
                        const next = [...blueprint.milestones];
                        next[idx] = { ...ms, description: e.target.value };
                        setBlueprint({ ...blueprint, milestones: next });
                      }}
                    />
                  </div>
                ))}
              </div>
            </Card>

            {/* Tasks */}
            <Card>
              <div className="flex items-center justify-between gap-4 mb-4">
                <h3 className="font-display text-base font-semibold">
                  Actionable Tasks ({blueprint.tasks.length})
                </h3>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    setBlueprint({
                      ...blueprint,
                      tasks: [
                        ...blueprint.tasks,
                        {
                          id: `draft_tsk_${Date.now()}`,
                          title: 'New execution task',
                          description: '',
                          priority: 'medium',
                          milestoneIndex: 0,
                        },
                      ],
                    })
                  }
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  Add Task
                </Button>
              </div>

              <div className="divide-y divide-[var(--nx-border-subtle)]">
                {blueprint.tasks.map((task, idx) => (
                  <div
                    key={task.id}
                    className="py-4 first:pt-1 last:pb-1 flex flex-col gap-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono-num text-xs text-[var(--nx-text-muted)]">
                        Task {idx + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        <Select
                          value={task.priority}
                          aria-label={`Task ${idx + 1} priority`}
                          className="!h-8 !py-1 !px-2 text-xs !w-auto"
                          onChange={(e) => {
                            const next = [...blueprint.tasks];
                            next[idx] = { ...task, priority: e.target.value as TaskPriority };
                            setBlueprint({ ...blueprint, tasks: next });
                          }}
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="urgent">Urgent</option>
                        </Select>
                        <IconButton
                          label={`Remove task ${idx + 1}`}
                          variant="destructive"
                          onClick={() =>
                            setBlueprint({
                              ...blueprint,
                              tasks: blueprint.tasks.filter((_, i) => i !== idx),
                            })
                          }
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </IconButton>
                      </div>
                    </div>
                    <Input
                      value={task.title}
                      maxLength={200}
                      aria-label={`Task ${idx + 1} title`}
                      onChange={(e) => {
                        const next = [...blueprint.tasks];
                        next[idx] = { ...task, title: e.target.value };
                        setBlueprint({ ...blueprint, tasks: next });
                      }}
                    />
                    {blueprint.milestones.length > 0 && (
                      <Select
                        value={task.milestoneIndex}
                        aria-label={`Task ${idx + 1} milestone`}
                        className="!h-8 !py-1 text-xs"
                        onChange={(e) => {
                          const next = [...blueprint.tasks];
                          next[idx] = { ...task, milestoneIndex: Number(e.target.value) };
                          setBlueprint({ ...blueprint, tasks: next });
                        }}
                      >
                        {blueprint.milestones.map((ms, mIdx) => (
                          <option key={ms.id} value={mIdx}>
                            Milestone {mIdx + 1}: {ms.title}
                          </option>
                        ))}
                      </Select>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
