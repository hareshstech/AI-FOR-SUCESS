import React, { useState } from 'react';
import {
  ArrowRight,
  Check,
  ChevronDown,
  Layers,
  ListChecks,
  Menu,
  Milestone as MilestoneIcon,
  Moon,
  Sparkles,
  Sun,
  Target,
  X,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Button, IconButton, NexoraLogo } from '../ui/Primitives';

interface LandingPageProps {
  onOpenWorkspace: (targetView?: 'dashboard' | 'idealab') => void;
  onRequireAuth: (targetView: 'dashboard' | 'idealab') => void;
}

const WORKFLOW_STAGES = [
  {
    id: 'idea',
    step: '01',
    label: 'Raw Idea',
    heading: 'Capture an unformed concept in plain language',
    body: 'Start with a single sentence or rough product note. No rigid templates required.',
    previewTitle: 'Campus Peer-Tutoring Marketplace',
    previewMeta: 'Student Venture · Estimated 6 weeks',
    items: [
      'Target: University students needing rapid 1-on-1 exam prep',
      'Core loop: Subject match, 30-min video booking, verified peer ratings',
      'Constraint: Launch MVP before midterms with a 2-person team',
    ],
  },
  {
    id: 'analysis',
    step: '02',
    label: 'AI Analysis',
    heading: 'Structured scope, objectives, and delivery horizon',
    body: 'NEXORA breaks down your concept into measurable objectives and realistic phase durations.',
    previewTitle: 'Objective Breakdown',
    previewMeta: '4 core objectives · Validated scope',
    items: [
      'Validate demand with 25 student interviews across 3 departments',
      'Launch searchable tutor directory and booking flow by Week 3',
      'Complete 15 pilot tutoring sessions with post-session feedback',
    ],
  },
  {
    id: 'milestones',
    step: '03',
    label: 'Milestones',
    heading: 'Sequential roadmap phases with clear deadlines',
    body: 'Convert high-level ambition into timed checkpoints so progress is always visible.',
    previewTitle: 'Execution Roadmap',
    previewMeta: '3 milestones · Week 1 to Week 6',
    items: [
      'Week 2 — Discovery interviews & matching rubric finalized',
      'Week 4 — MVP booking platform & tutor onboarding live',
      'Week 6 — Campus pilot launch & first 15 completed sessions',
    ],
  },
  {
    id: 'tasks',
    step: '04',
    label: 'Tasks & Progress',
    heading: 'Kanban execution synced to live project completion',
    body: 'Every task status update automatically recalculates project readiness across your workspace.',
    previewTitle: 'Active Execution Queue',
    previewMeta: '6 tasks · 67% completed',
    items: [
      'Done — Draft student survey & interview script (High)',
      'In Progress — Build tutor profile availability editor (Urgent)',
      'To Do — Schedule pilot onboarding with CS study group (Medium)',
    ],
  },
] as const;

const TESTIMONIALS = [
  {
    initials: 'DK',
    name: 'Daniel Kim',
    role: 'Co-Founder, Fieldnote Labs',
    quote:
      'Before NEXORA, our early ideas sat in scattered docs for weeks. Turning a two-line concept into a 6-week milestone board cut our MVP planning cycle from 5 days to 20 minutes.',
  },
  {
    initials: 'SR',
    name: 'Sofia Reyes',
    role: 'Graduate Researcher, MIT Media Lab',
    quote:
      'Having AI-structured milestones connected directly to real task completion keeps our thesis prototypes moving every week without heavy enterprise project-management overhead.',
  },
  {
    initials: 'AM',
    name: 'Arjun Mehta',
    role: 'Independent Product Creator',
    quote:
      'The Idea Lab gives me an editable starting structure I actually trust, and the workspace progress bar reflects real completed tasks rather than guesswork.',
  },
];

const FAQS = [
  {
    q: 'How does the AI Idea Lab turn an idea into a project?',
    a: 'Enter your concept and optional category or timeline. NEXORA sends your prompt to our server-side Gemini analysis engine, returning a structured title, executive summary, objectives, sequential milestones, and prioritized tasks that you can edit before saving to your workspace.',
  },
  {
    q: 'Can I edit or customize AI-generated milestones and tasks?',
    a: 'Yes. Every generated objective, milestone, timeline, and task is completely editable inside the Idea Lab review step and inside the Project Workspace after saving.',
  },
  {
    q: 'How is project progress calculated?',
    a: 'NEXORA computes project progress directly from your real task records in the database—measuring completed tasks divided by total tasks in each project, with zero fabricated scores.',
  },
  {
    q: 'Is my workspace data private?',
    a: 'Yes. Projects, milestones, tasks, notes, and bookmarked resources are authenticated through Google Sign-In and strictly isolated to your account via database security rules.',
  },
];

export function LandingPage({ onOpenWorkspace, onRequireAuth }: LandingPageProps) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeStage, setActiveStage] = useState<string>('idea');
  const [annualBilling, setAnnualBilling] = useState<boolean>(true);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const stage = WORKFLOW_STAGES.find((s) => s.id === activeStage) ?? WORKFLOW_STAGES[0];

  const handlePrimaryAction = (target: 'dashboard' | 'idealab') => {
    if (user) {
      onOpenWorkspace(target);
    } else {
      onRequireAuth(target);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--nx-bg-primary)] text-[var(--nx-text-primary)]">
      {/* Top Navigation Bar — 3-Zone Contract */}
      <header className="sticky top-0 z-40 border-b border-[var(--nx-border-subtle)] bg-[var(--nx-bg-primary)]/90 backdrop-blur-md">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          <a href="#top" className="shrink-0">
            <NexoraLogo />
          </a>

          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center gap-7 text-sm font-medium text-[var(--nx-text-secondary)]"
          >
            <a
              href="#workflow"
              className="hover:text-[var(--nx-text-primary)] transition-colors whitespace-nowrap shrink-0"
            >
              Workflow
            </a>
            <a
              href="#capabilities"
              className="hover:text-[var(--nx-text-primary)] transition-colors whitespace-nowrap shrink-0"
            >
              Idea Lab
            </a>
            <a
              href="#pricing"
              className="hover:text-[var(--nx-text-primary)] transition-colors whitespace-nowrap shrink-0"
            >
              Pricing
            </a>
            <a
              href="#faq"
              className="hover:text-[var(--nx-text-primary)] transition-colors whitespace-nowrap shrink-0"
            >
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <IconButton
              label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
              onClick={toggleTheme}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </IconButton>
            <Button
              size="sm"
              onClick={() => handlePrimaryAction('dashboard')}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              {user ? 'Open Workspace' : 'Start Building'}
            </Button>
            <IconButton
              label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              className="md:hidden"
              onClick={() => setMobileMenuOpen((v) => !v)}
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </IconButton>
          </div>
        </div>

        {mobileMenuOpen && (
          <nav
            aria-label="Mobile navigation"
            className="md:hidden border-t border-[var(--nx-border-subtle)] bg-[var(--nx-bg-primary)] px-4 py-3 flex flex-col gap-1"
          >
            {[
              { href: '#workflow', label: 'Workflow' },
              { href: '#capabilities', label: 'Idea Lab' },
              { href: '#pricing', label: 'Pricing' },
              { href: '#faq', label: 'FAQ' },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--nx-text-secondary)] hover:text-[var(--nx-text-primary)] hover:bg-[var(--nx-surface-elevated)]"
              >
                {link.label}
              </a>
            ))}
          </nav>
        )}
      </header>

      <main id="top">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-[var(--nx-border-subtle)]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 -top-40 h-[420px] bg-gradient-to-b from-[#8765F7]/14 via-[#8765F7]/4 to-transparent blur-3xl"
          />
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-14 lg:pt-20 lg:pb-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
              {/* Hero Narrative */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="lg:col-span-6 flex flex-col justify-center"
              >
                <p className="text-xs font-semibold tracking-wide text-[var(--nx-accent-primary)] mb-4">
                  AI-Powered Idea-to-Action Platform
                </p>
                <h1 className="font-display text-4xl sm:text-5xl lg:text-[54px] font-bold tracking-tight leading-[1.08] text-balance text-[var(--nx-text-primary)]">
                  Your ideas deserve to become reality.
                </h1>
                <p className="mt-5 text-base sm:text-lg text-[var(--nx-text-secondary)] leading-relaxed max-w-xl">
                  NEXORA transforms raw concepts into structured projects, timed milestones, prioritized tasks, and measurable execution—built for creators, students, and founders ready to ship.
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Button
                    size="lg"
                    onClick={() => handlePrimaryAction('idealab')}
                    leftIcon={<Sparkles className="w-4 h-4" />}
                  >
                    Launch AI Idea Lab
                  </Button>
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={() => {
                      document.getElementById('workflow')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    Explore Workflow
                  </Button>
                </div>

                <div className="mt-8 pt-6 border-t border-[var(--nx-border-subtle)] flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[var(--nx-text-muted)]">
                  <span>15-sec AI blueprint</span>
                  <span aria-hidden="true" className="hidden sm:inline">·</span>
                  <span>Task-synced progress</span>
                  <span aria-hidden="true" className="hidden sm:inline">·</span>
                  <span>Light & Dark mode</span>
                </div>
              </motion.div>

              {/* Hero Interactive Product Preview */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="lg:col-span-6 flex"
              >
                <div className="w-full rounded-2xl border border-[var(--nx-border-strong)] bg-[var(--nx-surface-base)] shadow-[var(--nx-shadow-md)] p-5 sm:p-6 flex flex-col justify-between">
                  <div className="flex items-center justify-between gap-4 pb-4 border-b border-[var(--nx-border-subtle)]">
                    <div className="min-w-0">
                      <p className="text-xs text-[var(--nx-text-muted)]">Interactive Blueprint Preview</p>
                      <h2 className="font-display text-base font-semibold text-[var(--nx-text-primary)] truncate mt-0.5">
                        {stage.previewTitle}
                      </h2>
                    </div>
                    <span className="font-mono-num text-xs font-medium text-[var(--nx-accent-primary)] shrink-0">
                      Stage {stage.step} / 04
                    </span>
                  </div>

                  {/* Stage Selector Tabs */}
                  <div
                    role="tablist"
                    aria-label="NEXORA workflow stages"
                    className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 my-4 p-1 rounded-xl bg-[var(--nx-bg-primary)] border border-[var(--nx-border-subtle)]"
                  >
                    {WORKFLOW_STAGES.map((item) => {
                      const active = item.id === stage.id;
                      return (
                        <button
                          key={item.id}
                          role="tab"
                          type="button"
                          aria-selected={active}
                          onClick={() => setActiveStage(item.id)}
                          className={`px-2.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                            active
                              ? 'bg-[var(--nx-accent-primary)] text-[var(--nx-text-on-accent)]'
                              : 'text-[var(--nx-text-secondary)] hover:text-[var(--nx-text-primary)]'
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Stage Detail Content */}
                  <div className="flex-1 flex flex-col justify-between gap-4">
                    <div>
                      <p className="text-xs text-[var(--nx-text-muted)] mb-2">{stage.previewMeta}</p>
                      <h3 className="font-display text-sm font-semibold text-[var(--nx-text-primary)] mb-3">
                        {stage.heading}
                      </h3>
                      <ul className="space-y-2.5">
                        {stage.items.map((line, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2.5 text-sm text-[var(--nx-text-secondary)] leading-snug"
                          >
                            <Check className="w-4 h-4 text-[var(--nx-accent-primary)] shrink-0 mt-0.5" />
                            <span>{line}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-4 border-t border-[var(--nx-border-subtle)] flex items-center justify-between gap-4">
                      <span className="text-xs text-[var(--nx-text-muted)]">
                        Build your own structured roadmap
                      </span>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handlePrimaryAction('idealab')}
                      >
                        Try Idea Lab
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* 4-Column Pipeline Strip */}
            <div className="mt-12 pt-8 border-t border-[var(--nx-border-subtle)] grid grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: '01. Idea Capture', value: 'Freeform Input', note: 'Zero rigid forms' },
                { label: '02. AI Synthesis', value: 'Gemini Structured', note: 'Objectives & scope' },
                { label: '03. Roadmap Builder', value: 'Timed Milestones', note: 'Editable sequences' },
                { label: '04. Task Execution', value: 'Live Progress', note: 'Kanban & list views' },
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col gap-1">
                  <span className="text-xs text-[var(--nx-text-muted)]">{stat.label}</span>
                  <span className="font-display text-base font-semibold text-[var(--nx-text-primary)]">
                    {stat.value}
                  </span>
                  <span className="text-xs text-[var(--nx-text-secondary)]">{stat.note}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Workflow Pipeline Section */}
        <section id="workflow" className="py-16 lg:py-24 border-b border-[var(--nx-border-subtle)]">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-12">
              <p className="text-xs font-semibold text-[var(--nx-accent-primary)] mb-2">
                Core Experience
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-balance">
                One continuous chain from spark to shipped milestone.
              </h2>
              <p className="mt-3 text-base text-[var(--nx-text-secondary)] leading-relaxed">
                Most tools separate brainstorming from execution. NEXORA keeps your original idea, strategic objectives, milestone dates, and daily tasks connected in one workspace.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                {
                  num: '01',
                  icon: <Sparkles className="w-5 h-5" />,
                  title: 'AI Idea Analysis',
                  desc: 'Describe what you want to build. Receive an executive summary, category fit, and realistic delivery horizon.',
                },
                {
                  num: '02',
                  icon: <Target className="w-5 h-5" />,
                  title: 'Structured Objectives',
                  desc: 'Clarify measurable goals before writing code or recruiting teammates, keeping scope tight.',
                },
                {
                  num: '03',
                  icon: <MilestoneIcon className="w-5 h-5" />,
                  title: 'Milestone Timeline',
                  desc: 'Sequence your roadmap into chronological checkpoints with editable target dates and status.',
                },
                {
                  num: '04',
                  icon: <ListChecks className="w-5 h-5" />,
                  title: 'Kanban & Progress',
                  desc: 'Move tasks from To Do to Done and watch project completion recalculate automatically.',
                },
              ].map((step) => (
                <div
                  key={step.num}
                  className="rounded-xl border border-[var(--nx-border-subtle)] bg-[var(--nx-surface-base)] p-6 flex flex-col justify-between gap-5"
                >
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-lg bg-[var(--nx-accent-muted)] text-[var(--nx-accent-primary)] flex items-center justify-center">
                      {step.icon}
                    </div>
                    <span className="font-mono-num text-xs text-[var(--nx-text-muted)]">
                      {step.num}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-display text-base font-semibold text-[var(--nx-text-primary)]">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-sm text-[var(--nx-text-secondary)] leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Asymmetric Capabilities Bento Section */}
        <section
          id="capabilities"
          className="py-16 lg:py-24 bg-[var(--nx-bg-secondary)]/50 border-b border-[var(--nx-border-subtle)]"
        >
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-12">
              <p className="text-xs font-semibold text-[var(--nx-accent-primary)] mb-2">
                Platform Capabilities
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-balance">
                Engineered for clarity under real execution pressure.
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2 rounded-xl border border-[var(--nx-border-subtle)] bg-[var(--nx-surface-base)] p-6 sm:p-8 flex flex-col justify-between gap-6">
                <div>
                  <span className="text-xs font-medium text-[var(--nx-accent-primary)]">
                    Signature Workspace
                  </span>
                  <h3 className="font-display text-xl font-semibold mt-1.5">
                    01. AI Idea Lab with Full Human Review
                  </h3>
                  <p className="mt-2.5 text-sm sm:text-base text-[var(--nx-text-secondary)] leading-relaxed max-w-2xl">
                    Review every AI-generated objective, milestone, and task inline before committing a single record. Rename milestones, adjust priorities, add custom deliverables, and save everything atomically into a live workspace.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-[var(--nx-border-subtle)]">
                  <div>
                    <div className="font-mono-num text-lg font-semibold text-[var(--nx-text-primary)]">
                      3–5
                    </div>
                    <div className="text-xs text-[var(--nx-text-secondary)]">
                      Chronological milestones per blueprint
                    </div>
                  </div>
                  <div>
                    <div className="font-mono-num text-lg font-semibold text-[var(--nx-text-primary)]">
                      6–10
                    </div>
                    <div className="text-xs text-[var(--nx-text-secondary)]">
                      Prioritized tasks mapped to phases
                    </div>
                  </div>
                  <div>
                    <div className="font-mono-num text-lg font-semibold text-[var(--nx-text-primary)]">
                      100%
                    </div>
                    <div className="text-xs text-[var(--nx-text-secondary)]">
                      Editable before & after project save
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-[var(--nx-border-subtle)] bg-[var(--nx-surface-base)] p-6 sm:p-8 flex flex-col justify-between gap-6">
                <div>
                  <div className="w-10 h-10 rounded-lg bg-[var(--nx-accent-muted)] text-[var(--nx-accent-primary)] flex items-center justify-center mb-4">
                    <Layers className="w-5 h-5" />
                  </div>
                  <h3 className="font-display text-xl font-semibold">
                    02. Unified Project Notes & Resources
                  </h3>
                  <p className="mt-2.5 text-sm text-[var(--nx-text-secondary)] leading-relaxed">
                    Keep architecture notes, research links, and reference tools bound directly to each project instead of lost across browser tabs.
                  </p>
                </div>
                <Button
                  variant="secondary"
                  className="self-start"
                  onClick={() => handlePrimaryAction('dashboard')}
                >
                  Open Workspace
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials (Proof Adjacent to Capabilities) */}
        <section className="py-16 lg:py-24 border-b border-[var(--nx-border-subtle)]">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-12">
              <p className="text-xs font-semibold text-[var(--nx-accent-primary)] mb-2">
                Builder Stories
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-balance">
                Trusted by students, founders, and solo builders shipping real work.
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {TESTIMONIALS.map((item) => (
                <figure
                  key={item.name}
                  className="rounded-xl border border-[var(--nx-border-subtle)] bg-[var(--nx-surface-base)] p-6 flex flex-col justify-between gap-6"
                >
                  <blockquote className="text-sm text-[var(--nx-text-secondary)] leading-relaxed">
                    “{item.quote}”
                  </blockquote>
                  <figcaption className="flex items-center gap-3 pt-4 border-t border-[var(--nx-border-subtle)]">
                    <div
                      aria-hidden="true"
                      className="w-10 h-10 rounded-full bg-[var(--nx-accent-muted)] text-[var(--nx-accent-primary)] font-display text-xs font-bold flex items-center justify-center shrink-0"
                    >
                      {item.initials}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-[var(--nx-text-primary)] truncate">
                        {item.name}
                      </div>
                      <div className="text-xs text-[var(--nx-text-muted)] truncate">{item.role}</div>
                    </div>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section
          id="pricing"
          className="py-16 lg:py-24 bg-[var(--nx-bg-secondary)]/50 border-b border-[var(--nx-border-subtle)]"
        >
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
              <div className="max-w-xl">
                <p className="text-xs font-semibold text-[var(--nx-accent-primary)] mb-2">
                  Transparent Pricing
                </p>
                <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-balance">
                  Start free. Scale when your roadmap grows.
                </h2>
              </div>

              <div
                role="group"
                aria-label="Billing cycle"
                className="inline-flex items-center p-1 rounded-xl bg-[var(--nx-surface-base)] border border-[var(--nx-border-subtle)] self-start"
              >
                <button
                  type="button"
                  onClick={() => setAnnualBilling(false)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    !annualBilling
                      ? 'bg-[var(--nx-accent-primary)] text-[var(--nx-text-on-accent)]'
                      : 'text-[var(--nx-text-secondary)] hover:text-[var(--nx-text-primary)]'
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setAnnualBilling(true)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    annualBilling
                      ? 'bg-[var(--nx-accent-primary)] text-[var(--nx-text-on-accent)]'
                      : 'text-[var(--nx-text-secondary)] hover:text-[var(--nx-text-primary)]'
                  }`}
                >
                  Annual (Save 20%)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {[
                {
                  name: 'Starter',
                  audience: 'For students & first-time builders',
                  price: '$0',
                  cadence: 'Free forever',
                  highlight: false,
                  limits: [
                    'Up to 3 active projects',
                    '15 AI Idea Lab generations / month',
                    'Kanban & list task execution',
                    'Resource bookmarking library',
                  ],
                  cta: 'Start Free',
                },
                {
                  name: 'Pro Builder',
                  audience: 'For solo founders & creators shipping weekly',
                  price: annualBilling ? '$15' : '$19',
                  cadence: 'per month',
                  highlight: true,
                  limits: [
                    'Unlimited active projects & milestones',
                    'Unlimited AI Idea Lab blueprints',
                    'Real-time progress analytics & deadlines',
                    'Priority Gemini synthesis speed',
                  ],
                  cta: 'Launch Pro Workspace',
                },
                {
                  name: 'Studio',
                  audience: 'For student incubators & product teams',
                  price: annualBilling ? '$39' : '$49',
                  cadence: 'per month',
                  highlight: false,
                  limits: [
                    'Everything in Pro Builder',
                    'Up to 10 workspace seats',
                    'Shared roadmap & milestone tracking',
                    'Dedicated onboarding support',
                  ],
                  cta: 'Open Studio Workspace',
                },
              ].map((tier) => (
                <div
                  key={tier.name}
                  className={`rounded-xl p-6 sm:p-7 flex flex-col justify-between gap-6 border ${
                    tier.highlight
                      ? 'bg-[var(--nx-surface-base)] border-[var(--nx-accent-primary)] shadow-[var(--nx-shadow-md)]'
                      : 'bg-[var(--nx-surface-base)] border-[var(--nx-border-subtle)]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-display text-lg font-semibold">{tier.name}</h3>
                      {tier.highlight && (
                        <span className="text-xs font-medium text-[var(--nx-accent-primary)]">
                          Recommended
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--nx-text-secondary)] mt-1">{tier.audience}</p>

                    <div className="mt-5 flex items-baseline gap-2">
                      <span className="font-display font-mono-num text-3xl font-bold">
                        {tier.price}
                      </span>
                      <span className="text-xs text-[var(--nx-text-muted)]">{tier.cadence}</span>
                    </div>

                    <ul className="mt-6 space-y-2.5 text-sm text-[var(--nx-text-secondary)]">
                      {tier.limits.map((lim) => (
                        <li key={lim} className="flex items-start gap-2.5">
                          <Check className="w-4 h-4 text-[var(--nx-accent-primary)] shrink-0 mt-0.5" />
                          <span>{lim}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button
                    variant={tier.highlight ? 'primary' : 'secondary'}
                    className="w-full"
                    onClick={() => handlePrimaryAction('dashboard')}
                  >
                    {tier.cta}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-16 lg:py-24 border-b border-[var(--nx-border-subtle)]">
          <div className="max-w-[820px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <p className="text-xs font-semibold text-[var(--nx-accent-primary)] mb-2">FAQ</p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
                Common questions
              </h2>
            </div>

            <div className="divide-y divide-[var(--nx-border-subtle)] border-y border-[var(--nx-border-subtle)]">
              {FAQS.map((item, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div key={item.q}>
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full py-5 flex items-center justify-between gap-4 text-left cursor-pointer group"
                    >
                      <span className="font-display text-base font-medium text-[var(--nx-text-primary)] group-hover:text-[var(--nx-accent-primary)] transition-colors">
                        {item.q}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-[var(--nx-text-muted)] shrink-0 transition-transform duration-150 ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <p className="pb-5 text-sm text-[var(--nx-text-secondary)] leading-relaxed">
                        {item.a}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 lg:py-20">
          <div className="max-w-[920px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-balance">
              Turn your next idea into a structured roadmap today.
            </h2>
            <p className="mt-4 text-base text-[var(--nx-text-secondary)] max-w-xl mx-auto">
              Open the AI Idea Lab, refine your milestones, and track every task through launch.
            </p>
            <div className="mt-8 flex justify-center">
              <Button
                size="lg"
                onClick={() => handlePrimaryAction('idealab')}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Open AI Idea Lab
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-[var(--nx-border-subtle)] py-10">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex flex-col gap-1.5">
            <NexoraLogo />
            <p className="text-xs text-[var(--nx-text-muted)]">
              Your ideas deserve to become reality.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-xs text-[var(--nx-text-secondary)]">
            <a href="#workflow" className="hover:text-[var(--nx-text-primary)]">
              Workflow
            </a>
            <a href="#capabilities" className="hover:text-[var(--nx-text-primary)]">
              Idea Lab
            </a>
            <a href="#pricing" className="hover:text-[var(--nx-text-primary)]">
              Pricing
            </a>
            <a href="#faq" className="hover:text-[var(--nx-text-primary)]">
              FAQ
            </a>
            <span className="text-[var(--nx-text-muted)]">
              © {new Date().getFullYear()} NEXORA
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
