import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from './firebase';
import {
  FIELD_LIMITS,
  type ActivityItem,
  type ActivityType,
  type IdeaAnalysisResult,
  type Milestone,
  type MilestoneStatus,
  type Project,
  type ProjectPriority,
  type ProjectStatus,
  type Resource,
  type Task,
  type TaskPriority,
  type TaskStatus,
  type ThemeMode,
  type UserProfile,
} from '../types/nexora';

export function createEntityId(prefix: string): string {
  const cleanPrefix = prefix.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 12) || 'id';
  const rand =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 16)
      : Math.random().toString(36).slice(2, 12);
  return `${cleanPrefix}_${Date.now().toString(36)}_${rand}`;
}

export function clampStr(value: string, maxLen: number): string {
  return value.trim().slice(0, maxLen);
}

export function isValidHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function addWeeksIso(weeks: number): string {
  const date = new Date();
  date.setDate(date.getDate() + Math.max(1, weeks) * 7);
  return date.toISOString().slice(0, 10);
}

export async function ensureUserProfile(
  user: User,
  defaultTheme: ThemeMode = 'dark'
): Promise<UserProfile> {
  const ref = doc(db, 'users', user.uid);
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    const profile: Record<string, unknown> = {
      uid: user.uid,
      displayName: clampStr(user.displayName || user.email?.split('@')[0] || 'Builder', FIELD_LIMITS.DISPLAY_NAME),
      email: clampStr(user.email || 'user@nexora.app', FIELD_LIMITS.DISPLAY_NAME * 2),
      photoURL: clampStr(user.photoURL || '', 500),
      roleTitle: 'Product Builder',
      themePreference: defaultTheme,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(ref, profile);
    return {
      uid: user.uid,
      displayName: String(profile.displayName),
      email: String(profile.email),
      photoURL: String(profile.photoURL || ''),
      roleTitle: String(profile.roleTitle),
      themePreference: defaultTheme,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
  }
}

export async function updateUserProfile(
  uid: string,
  updates: Partial<Pick<UserProfile, 'displayName' | 'roleTitle' | 'themePreference'>>
): Promise<void> {
  const ref = doc(db, 'users', uid);
  const payload: Record<string, unknown> = { updatedAt: serverTimestamp() };
  if (updates.displayName !== undefined) {
    payload.displayName = clampStr(updates.displayName, FIELD_LIMITS.DISPLAY_NAME) || 'Builder';
  }
  if (updates.roleTitle !== undefined) {
    payload.roleTitle = clampStr(updates.roleTitle, FIELD_LIMITS.ROLE_TITLE);
  }
  if (updates.themePreference !== undefined) {
    payload.themePreference = updates.themePreference === 'light' ? 'light' : 'dark';
  }
  try {
    await updateDoc(ref, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
  }
}

export function subscribeProjects(
  uid: string,
  onData: (items: Project[]) => void
): Unsubscribe {
  const q = query(collection(db, 'projects'), where('ownerId', '==', uid));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => d.data() as Project);
      items.sort((a, b) => (b.updatedAt?.toMillis?.() ?? 0) - (a.updatedAt?.toMillis?.() ?? 0));
      onData(items);
    },
    (err) => handleFirestoreError(err, OperationType.LIST, 'projects')
  );
}

export function subscribeMilestones(
  uid: string,
  onData: (items: Milestone[]) => void
): Unsubscribe {
  const q = query(collection(db, 'milestones'), where('ownerId', '==', uid));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => d.data() as Milestone);
      items.sort((a, b) => a.orderIndex - b.orderIndex);
      onData(items);
    },
    (err) => handleFirestoreError(err, OperationType.LIST, 'milestones')
  );
}

export function subscribeTasks(
  uid: string,
  onData: (items: Task[]) => void
): Unsubscribe {
  const q = query(collection(db, 'tasks'), where('ownerId', '==', uid));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => d.data() as Task);
      items.sort((a, b) => a.orderIndex - b.orderIndex);
      onData(items);
    },
    (err) => handleFirestoreError(err, OperationType.LIST, 'tasks')
  );
}

export function subscribeResources(
  uid: string,
  onData: (items: Resource[]) => void
): Unsubscribe {
  const q = query(collection(db, 'resources'), where('ownerId', '==', uid));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => d.data() as Resource);
      items.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
      onData(items);
    },
    (err) => handleFirestoreError(err, OperationType.LIST, 'resources')
  );
}

export function subscribeActivities(
  uid: string,
  onData: (items: ActivityItem[]) => void
): Unsubscribe {
  const q = query(collection(db, 'activities'), where('ownerId', '==', uid));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((d) => d.data() as ActivityItem);
      items.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
      onData(items.slice(0, 30));
    },
    (err) => handleFirestoreError(err, OperationType.LIST, 'activities')
  );
}

async function logActivity(
  uid: string,
  projectId: string,
  type: ActivityType,
  message: string
): Promise<void> {
  const id = createEntityId('act');
  try {
    await setDoc(doc(db, 'activities', id), {
      id,
      ownerId: uid,
      projectId,
      type,
      message: clampStr(message, FIELD_LIMITS.ACTIVITY_MSG) || 'Workspace updated',
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `activities/${id}`);
  }
}

export async function saveIdeaBlueprintAsProject(
  uid: string,
  sourceIdea: string,
  draft: IdeaAnalysisResult
): Promise<string> {
  const batch = writeBatch(db);
  const projectId = createEntityId('proj');
  const maxWeekOffset = draft.milestones.reduce((acc, m) => Math.max(acc, m.offsetWeeks), 4);

  const projectRef = doc(db, 'projects', projectId);
  batch.set(projectRef, {
    id: projectId,
    ownerId: uid,
    title: clampStr(draft.title, FIELD_LIMITS.PROJECT_TITLE) || 'Untitled Project',
    summary: clampStr(draft.summary, FIELD_LIMITS.PROJECT_SUMMARY),
    category: clampStr(draft.category, FIELD_LIMITS.CATEGORY) || 'Software & SaaS',
    status: 'active' as ProjectStatus,
    priority: 'high' as ProjectPriority,
    estimatedTimeline: clampStr(draft.estimatedTimeline, FIELD_LIMITS.TIMELINE) || '6 weeks',
    objectives: draft.objectives
      .map((o) => clampStr(o, FIELD_LIMITS.OBJECTIVE))
      .filter(Boolean)
      .slice(0, FIELD_LIMITS.MAX_OBJECTIVES),
    notes: '',
    targetDate: addWeeksIso(maxWeekOffset),
    sourceIdea: clampStr(sourceIdea, FIELD_LIMITS.SOURCE_IDEA),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const milestoneIds: string[] = [];
  draft.milestones.slice(0, 8).forEach((m, idx) => {
    const milestoneId = createEntityId('ms');
    milestoneIds.push(milestoneId);
    batch.set(doc(db, 'milestones', milestoneId), {
      id: milestoneId,
      projectId,
      ownerId: uid,
      title: clampStr(m.title, FIELD_LIMITS.MILESTONE_TITLE) || `Milestone ${idx + 1}`,
      description: clampStr(m.description, FIELD_LIMITS.MILESTONE_DESC),
      dueDate: addWeeksIso(m.offsetWeeks),
      status: idx === 0 ? ('in_progress' as MilestoneStatus) : ('upcoming' as MilestoneStatus),
      orderIndex: idx,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });

  draft.tasks.slice(0, 20).forEach((t, idx) => {
    const taskId = createEntityId('tsk');
    const milestoneId = milestoneIds[t.milestoneIndex] ?? '';
    const dueOffset = draft.milestones[t.milestoneIndex]?.offsetWeeks ?? 2;
    batch.set(doc(db, 'tasks', taskId), {
      id: taskId,
      projectId,
      milestoneId,
      ownerId: uid,
      title: clampStr(t.title, FIELD_LIMITS.TASK_TITLE) || `Task ${idx + 1}`,
      description: clampStr(t.description, FIELD_LIMITS.TASK_DESC),
      status: 'todo' as TaskStatus,
      priority: t.priority,
      dueDate: addWeeksIso(dueOffset),
      orderIndex: idx,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });

  const actId = createEntityId('act');
  batch.set(doc(db, 'activities', actId), {
    id: actId,
    ownerId: uid,
    projectId,
    type: 'idea_analyzed',
    message: clampStr(`Launched "${draft.title}" from AI Idea Lab`, FIELD_LIMITS.ACTIVITY_MSG),
    createdAt: serverTimestamp(),
  });

  try {
    await batch.commit();
    return projectId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `projects/${projectId}`);
  }
}

export async function createManualProject(
  uid: string,
  input: {
    title: string;
    summary: string;
    category: string;
    priority: ProjectPriority;
    estimatedTimeline: string;
    targetDate: string;
    objectives: string[];
  }
): Promise<string> {
  const projectId = createEntityId('proj');
  const title = clampStr(input.title, FIELD_LIMITS.PROJECT_TITLE) || 'Untitled Project';
  try {
    await setDoc(doc(db, 'projects', projectId), {
      id: projectId,
      ownerId: uid,
      title,
      summary: clampStr(input.summary, FIELD_LIMITS.PROJECT_SUMMARY),
      category: clampStr(input.category, FIELD_LIMITS.CATEGORY) || 'Software & SaaS',
      status: 'planning' as ProjectStatus,
      priority: input.priority,
      estimatedTimeline: clampStr(input.estimatedTimeline, FIELD_LIMITS.TIMELINE) || '4 weeks',
      objectives: input.objectives
        .map((o) => clampStr(o, FIELD_LIMITS.OBJECTIVE))
        .filter(Boolean)
        .slice(0, FIELD_LIMITS.MAX_OBJECTIVES),
      notes: '',
      targetDate: clampStr(input.targetDate, 32),
      sourceIdea: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await logActivity(uid, projectId, 'project_created', `Created project "${title}"`);
    return projectId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `projects/${projectId}`);
  }
}

export async function updateProject(
  projectId: string,
  updates: Partial<
    Pick<
      Project,
      | 'title'
      | 'summary'
      | 'category'
      | 'status'
      | 'priority'
      | 'estimatedTimeline'
      | 'objectives'
      | 'notes'
      | 'targetDate'
    >
  >
): Promise<void> {
  const payload: Record<string, unknown> = { updatedAt: serverTimestamp() };
  if (updates.title !== undefined) {
    payload.title = clampStr(updates.title, FIELD_LIMITS.PROJECT_TITLE) || 'Untitled Project';
  }
  if (updates.summary !== undefined) payload.summary = clampStr(updates.summary, FIELD_LIMITS.PROJECT_SUMMARY);
  if (updates.category !== undefined) payload.category = clampStr(updates.category, FIELD_LIMITS.CATEGORY);
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.priority !== undefined) payload.priority = updates.priority;
  if (updates.estimatedTimeline !== undefined) {
    payload.estimatedTimeline = clampStr(updates.estimatedTimeline, FIELD_LIMITS.TIMELINE);
  }
  if (updates.objectives !== undefined) {
    payload.objectives = updates.objectives
      .map((o) => clampStr(o, FIELD_LIMITS.OBJECTIVE))
      .filter(Boolean)
      .slice(0, FIELD_LIMITS.MAX_OBJECTIVES);
  }
  if (updates.notes !== undefined) payload.notes = updates.notes.slice(0, FIELD_LIMITS.PROJECT_NOTES);
  if (updates.targetDate !== undefined) payload.targetDate = clampStr(updates.targetDate, 32);

  try {
    await updateDoc(doc(db, 'projects', projectId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `projects/${projectId}`);
  }
}

export async function deleteProjectCascade(
  projectId: string,
  milestones: Milestone[],
  tasks: Task[],
  resources: Resource[]
): Promise<void> {
  const batch = writeBatch(db);
  milestones
    .filter((m) => m.projectId === projectId)
    .forEach((m) => batch.delete(doc(db, 'milestones', m.id)));
  tasks
    .filter((t) => t.projectId === projectId)
    .forEach((t) => batch.delete(doc(db, 'tasks', t.id)));
  resources
    .filter((r) => r.projectId === projectId)
    .forEach((r) => batch.delete(doc(db, 'resources', r.id)));
  batch.delete(doc(db, 'projects', projectId));

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `projects/${projectId}`);
  }
}

export async function createMilestone(
  uid: string,
  input: {
    projectId: string;
    title: string;
    description: string;
    dueDate: string;
    orderIndex: number;
  }
): Promise<string> {
  const id = createEntityId('ms');
  try {
    await setDoc(doc(db, 'milestones', id), {
      id,
      projectId: input.projectId,
      ownerId: uid,
      title: clampStr(input.title, FIELD_LIMITS.MILESTONE_TITLE) || 'Milestone',
      description: clampStr(input.description, FIELD_LIMITS.MILESTONE_DESC),
      dueDate: clampStr(input.dueDate, 32),
      status: 'upcoming' as MilestoneStatus,
      orderIndex: Math.max(0, Math.min(1000, input.orderIndex)),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `milestones/${id}`);
  }
}

export async function updateMilestone(
  uid: string,
  milestoneId: string,
  updates: Partial<Pick<Milestone, 'title' | 'description' | 'dueDate' | 'status' | 'orderIndex'>>,
  projectIdForLog?: string
): Promise<void> {
  const payload: Record<string, unknown> = { updatedAt: serverTimestamp() };
  if (updates.title !== undefined) payload.title = clampStr(updates.title, FIELD_LIMITS.MILESTONE_TITLE);
  if (updates.description !== undefined) payload.description = clampStr(updates.description, FIELD_LIMITS.MILESTONE_DESC);
  if (updates.dueDate !== undefined) payload.dueDate = clampStr(updates.dueDate, 32);
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.orderIndex !== undefined) payload.orderIndex = Math.max(0, Math.min(1000, updates.orderIndex));

  try {
    await updateDoc(doc(db, 'milestones', milestoneId), payload);
    if (updates.status === 'completed' && updates.title && projectIdForLog) {
      await logActivity(uid, projectIdForLog, 'milestone_completed', `Completed milestone "${updates.title}"`);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `milestones/${milestoneId}`);
  }
}

export async function deleteMilestone(milestoneId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'milestones', milestoneId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `milestones/${milestoneId}`);
  }
}

export async function createTask(
  uid: string,
  input: {
    projectId: string;
    milestoneId?: string;
    title: string;
    description: string;
    status?: TaskStatus;
    priority: TaskPriority;
    dueDate: string;
    orderIndex: number;
  }
): Promise<string> {
  const id = createEntityId('tsk');
  const title = clampStr(input.title, FIELD_LIMITS.TASK_TITLE) || 'Untitled task';
  try {
    await setDoc(doc(db, 'tasks', id), {
      id,
      projectId: input.projectId,
      milestoneId: input.milestoneId || '',
      ownerId: uid,
      title,
      description: clampStr(input.description, FIELD_LIMITS.TASK_DESC),
      status: input.status || ('todo' as TaskStatus),
      priority: input.priority,
      dueDate: clampStr(input.dueDate, 32),
      orderIndex: Math.max(0, Math.min(10000, input.orderIndex)),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await logActivity(uid, input.projectId, 'task_created', `Added task "${title}"`);
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `tasks/${id}`);
  }
}

export async function updateTask(
  uid: string,
  taskId: string,
  updates: Partial<
    Pick<Task, 'milestoneId' | 'title' | 'description' | 'status' | 'priority' | 'dueDate' | 'orderIndex'>
  >,
  meta?: { projectId?: string; taskTitle?: string; previousStatus?: TaskStatus }
): Promise<void> {
  const payload: Record<string, unknown> = { updatedAt: serverTimestamp() };
  if (updates.milestoneId !== undefined) payload.milestoneId = updates.milestoneId;
  if (updates.title !== undefined) payload.title = clampStr(updates.title, FIELD_LIMITS.TASK_TITLE) || 'Untitled task';
  if (updates.description !== undefined) payload.description = clampStr(updates.description, FIELD_LIMITS.TASK_DESC);
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.priority !== undefined) payload.priority = updates.priority;
  if (updates.dueDate !== undefined) payload.dueDate = clampStr(updates.dueDate, 32);
  if (updates.orderIndex !== undefined) payload.orderIndex = Math.max(0, Math.min(10000, updates.orderIndex));

  try {
    await updateDoc(doc(db, 'tasks', taskId), payload);
    if (
      updates.status === 'done' &&
      meta?.previousStatus !== 'done' &&
      meta?.projectId &&
      meta?.taskTitle
    ) {
      await logActivity(uid, meta.projectId, 'task_completed', `Completed "${meta.taskTitle}"`);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `tasks/${taskId}`);
  }
}

export async function deleteTask(taskId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'tasks', taskId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `tasks/${taskId}`);
  }
}

export async function createResource(
  uid: string,
  input: {
    projectId?: string;
    title: string;
    url: string;
    category: string;
    notes: string;
  }
): Promise<string> {
  if (!isValidHttpUrl(input.url)) {
    throw new Error('Resource URL must start with http:// or https://');
  }
  const id = createEntityId('res');
  const title = clampStr(input.title, FIELD_LIMITS.RESOURCE_TITLE) || 'Resource';
  try {
    await setDoc(doc(db, 'resources', id), {
      id,
      ownerId: uid,
      projectId: input.projectId || '',
      title,
      url: clampStr(input.url, FIELD_LIMITS.RESOURCE_URL),
      category: clampStr(input.category, FIELD_LIMITS.CATEGORY) || 'Reference',
      notes: clampStr(input.notes, FIELD_LIMITS.RESOURCE_NOTES),
      bookmarked: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await logActivity(uid, input.projectId || '', 'resource_added', `Bookmarked "${title}"`);
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `resources/${id}`);
  }
}

export async function updateResource(
  resourceId: string,
  updates: Partial<Pick<Resource, 'projectId' | 'title' | 'url' | 'category' | 'notes' | 'bookmarked'>>
): Promise<void> {
  const payload: Record<string, unknown> = { updatedAt: serverTimestamp() };
  if (updates.projectId !== undefined) payload.projectId = updates.projectId;
  if (updates.title !== undefined) payload.title = clampStr(updates.title, FIELD_LIMITS.RESOURCE_TITLE);
  if (updates.url !== undefined) {
    if (!isValidHttpUrl(updates.url)) {
      throw new Error('Resource URL must start with http:// or https://');
    }
    payload.url = clampStr(updates.url, FIELD_LIMITS.RESOURCE_URL);
  }
  if (updates.category !== undefined) payload.category = clampStr(updates.category, FIELD_LIMITS.CATEGORY);
  if (updates.notes !== undefined) payload.notes = clampStr(updates.notes, FIELD_LIMITS.RESOURCE_NOTES);
  if (updates.bookmarked !== undefined) payload.bookmarked = updates.bookmarked;

  try {
    await updateDoc(doc(db, 'resources', resourceId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `resources/${resourceId}`);
  }
}

export async function deleteResource(resourceId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'resources', resourceId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `resources/${resourceId}`);
  }
}
