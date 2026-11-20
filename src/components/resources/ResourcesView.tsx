import React, { useMemo, useState } from 'react';
import { Bookmark, ExternalLink, Plus, Star, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  createResource,
  deleteResource,
  isValidHttpUrl,
  updateResource,
} from '../../lib/nexoraService';
import type { Project, Resource } from '../../types/nexora';
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

interface ResourcesViewProps {
  projects: Project[];
  resources: Resource[];
}

const RESOURCE_CATEGORIES = ['Documentation', 'Design', 'Research', 'Tooling', 'Inspiration'];

export function ResourcesView({ projects, resources }: ResourcesViewProps) {
  const { user } = useAuth();
  const { notify } = useToast();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [onlyBookmarked, setOnlyBookmarked] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('Documentation');
  const [projectId, setProjectId] = useState('');
  const [notes, setNotes] = useState('');
  const [urlError, setUrlError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const projectMap = useMemo(() => new Map(projects.map((p) => [p.id, p.title])), [projects]);

  const filtered = resources.filter((r) => {
    if (onlyBookmarked && !r.bookmarked) return false;
    if (categoryFilter !== 'all' && r.category !== categoryFilter) return false;
    const q = search.trim().toLowerCase();
    if (
      q &&
      !r.title.toLowerCase().includes(q) &&
      !r.notes.toLowerCase().includes(q) &&
      !r.url.toLowerCase().includes(q)
    ) {
      return false;
    }
    return true;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!isValidHttpUrl(url)) {
      setUrlError('Please enter a valid URL starting with https:// or http://');
      return;
    }
    setUrlError('');
    setSubmitting(true);
    try {
      await createResource(user.uid, {
        projectId,
        title,
        url,
        category,
        notes,
      });
      notify('Resource saved to library.', 'success');
      setModalOpen(false);
      setTitle('');
      setUrl('');
      setNotes('');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to save resource.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">Resources</h2>
          <p className="text-sm text-[var(--nx-text-secondary)] mt-1">
            Bookmark documentation, design links, and research references across projects
          </p>
        </div>

        <Button onClick={() => setModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
          Add Resource
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search saved resources..."
            ariaLabel="Search resources"
            className="sm:max-w-xs w-full"
          />
          <Select
            value={categoryFilter}
            aria-label="Filter by category"
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="sm:max-w-[180px]"
          >
            <option value="all">All Categories</option>
            {RESOURCE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>

        <button
          type="button"
          onClick={() => setOnlyBookmarked((v) => !v)}
          className={`inline-flex items-center gap-2 px-3.5 h-10 rounded-lg border text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
            onlyBookmarked
              ? 'bg-[var(--nx-accent-muted)] border-[var(--nx-accent-primary)] text-[var(--nx-accent-primary)]'
              : 'bg-[var(--nx-surface-base)] border-[var(--nx-border-subtle)] text-[var(--nx-text-secondary)]'
          }`}
        >
          <Star className="w-3.5 h-3.5" />
          <span>Bookmarked Only</span>
        </button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Bookmark className="w-5 h-5" />}
          title={resources.length === 0 ? 'No resources saved yet' : 'No matching resources'}
          description={
            resources.length === 0
              ? 'Save key URLs, technical docs, and research references so your team always finds what they need.'
              : 'Try adjusting your search or filter settings.'
          }
          action={
            resources.length === 0 ? (
              <Button onClick={() => setModalOpen(true)}>Add First Resource</Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((res) => (
            <Card key={res.id} className="flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs text-[var(--nx-text-muted)] truncate min-w-0 flex-1">
                    {res.category}
                    {res.projectId && projectMap.get(res.projectId)
                      ? ` · ${projectMap.get(res.projectId)}`
                      : ''}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    <IconButton
                      label={res.bookmarked ? 'Remove bookmark' : 'Bookmark resource'}
                      className="!w-8 !h-8"
                      onClick={() =>
                        void updateResource(res.id, { bookmarked: !res.bookmarked })
                      }
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${
                          res.bookmarked
                            ? 'fill-[var(--nx-accent-primary)] text-[var(--nx-accent-primary)]'
                            : ''
                        }`}
                      />
                    </IconButton>
                    <IconButton
                      label={`Delete ${res.title}`}
                      variant="destructive"
                      className="!w-8 !h-8"
                      onClick={() => void deleteResource(res.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </IconButton>
                  </div>
                </div>

                <h3 className="font-display text-base font-semibold text-[var(--nx-text-primary)] line-clamp-1">
                  {res.title}
                </h3>
                {res.notes && (
                  <p className="text-xs text-[var(--nx-text-secondary)] mt-1.5 line-clamp-2 leading-relaxed">
                    {res.notes}
                  </p>
                )}
              </div>

              <a
                href={res.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-between gap-2 pt-3 border-t border-[var(--nx-border-subtle)] text-xs font-medium text-[var(--nx-accent-primary)] hover:underline"
              >
                <span className="truncate">{res.url.replace(/^https?:\/\//, '')}</span>
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              </a>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Resource Link">
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <FieldWrapper label="Title" htmlFor="res-title">
            <Input
              id="res-title"
              required
              maxLength={160}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Stripe Billing Docs"
            />
          </FieldWrapper>

          <FieldWrapper label="URL" htmlFor="res-url" error={urlError}>
            <Input
              id="res-url"
              type="url"
              required
              maxLength={600}
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (urlError) setUrlError('');
              }}
              placeholder="https://example.com"
            />
          </FieldWrapper>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FieldWrapper label="Category" htmlFor="res-cat">
              <Select
                id="res-cat"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {RESOURCE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </FieldWrapper>

            <FieldWrapper label="Project (optional)" htmlFor="res-proj">
              <Select
                id="res-proj"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
              >
                <option value="">General Workspace</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </Select>
            </FieldWrapper>
          </div>

          <FieldWrapper label="Notes" htmlFor="res-notes">
            <Textarea
              id="res-notes"
              rows={2}
              maxLength={600}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Why is this useful?"
            />
          </FieldWrapper>

          <div className="flex justify-end gap-2.5 pt-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Save Resource
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
