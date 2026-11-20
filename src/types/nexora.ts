import type { Timestamp } from 'firebase/firestore';

export type ThemeMode = 'dark' | 'light';

export type ProjectStatus = 'planning' | 'active' | 'paused' | 'completed';
export type ProjectPriority = 'low' | 'medium' | 'high' | 'critical';
export type MilestoneStatus = 'upcoming' | 'in_progress' | 'completed';
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type ActivityType =
  | 'idea_analyzed'
  | 'project_created'
  | 'milestone_completed'
  | 'task_created'
  | 'task_completed'
  | 'resource_added';

export type AppView =
  | 'landing'
  | 'dashboard'
  | 'idealab'
  | 'projects'
  | 'project-detail'
  | 'tasks'
  | 'resources'
  | 'settings';

export const IDEA_CATEGORIES = [
  'Software & SaaS',
  'Startup Venture',
  'Creative & Media',
  'Student Research',
  'Hardware & Product',
  'Community & Impact',
] as const;

export const FIELD_LIMITS = {
  DISPLAY_NAME: 100,
  ROLE_TITLE: 80,
  PROJECT_TITLE: 140,
  PROJECT_SUMMARY: 1000,
  CATEGORY: 60,
  TIMELINE: 80,
  OBJECTIVE: 240,
  MAX_OBJECTIVES: 10,
  PROJECT_NOTES: 10000,
  SOURCE_IDEA: 2000,
  MILESTONE_TITLE: 160,
  MILESTONE_DESC: 600,
  TASK_TITLE: 200,
  TASK_DESC: 1000,
  RESOURCE_TITLE: 160,
  RESOURCE_URL: 600,
  RESOURCE_NOTES: 600,
  ACTIVITY_MSG: 240,
} as const;

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  roleTitle?: string;
  themePreference: ThemeMode;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Project {
  id: string;
  ownerId: string;
  title: string;
  summary: string;
  category: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  estimatedTimeline: string;
  objectives: string[];
  notes: string;
  targetDate: string;
  sourceIdea: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Milestone {
  id: string;
  projectId: string;
  ownerId: string;
  title: string;
  description: string;
  dueDate: string;
  status: MilestoneStatus;
  orderIndex: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Task {
  id: string;
  projectId: string;
  milestoneId: string;
  ownerId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  orderIndex: number;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface Resource {
  id: string;
  ownerId: string;
  projectId: string;
  title: string;
  url: string;
  category: string;
  notes: string;
  bookmarked: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface ActivityItem {
  id: string;
  ownerId: string;
  projectId: string;
  type: ActivityType;
  message: string;
  createdAt?: Timestamp;
}

export interface IdeaMilestoneDraft {
  id: string;
  title: string;
  description: string;
  offsetWeeks: number;
}

export interface IdeaTaskDraft {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  milestoneIndex: number;
}

export interface IdeaAnalysisResult {
  title: string;
  summary: string;
  category: string;
  estimatedTimeline: string;
  objectives: string[];
  milestones: IdeaMilestoneDraft[];
  tasks: IdeaTaskDraft[];
}
