export type PostStatus = 'draft' | 'published' | 'scheduled' | 'trashed';

export interface Author {
  id: string;
  name: string;
  avatar?: string;
  bio?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content?: string;
  coverImage?: string;
  publishedAt: string;
  readingTime: number;
  categories: Category[];
  tags: Tag[];
  author: Author;
  status: PostStatus;
}

export interface Project {
  id: string;
  title: string;
  slug: string;
  description: string;
  longDescription?: string;
  technologies: string[];
  repository?: string;
  demo?: string;
  status: 'active' | 'completed' | 'archived' | 'in-progress';
  featured: boolean;
  coverImage?: string;
  publishedAt: string;
}

export interface LabService {
  id: string;
  name: string;
  slug: string;
  description: string;
  stack: string[];
  status: 'online' | 'offline' | 'maintenance';
  icon?: string;
}

export interface Resource {
  id: string;
  title: string;
  slug: string;
  description: string;
  type: 'script' | 'docker' | 'template' | 'pdf' | 'other';
  downloadUrl: string;
  tags: string[];
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  lessonsCount: number;
  status: 'coming-soon' | 'available' | 'in-progress';
  coverImage?: string;
}

export interface Video {
  id: string;
  title: string;
  url: string;
  platform: 'youtube' | 'tiktok';
  publishedAt: string;
  thumbnail?: string;
}

export interface TimelineEvent {
  id: string;
  year: string;
  title: string;
  description: string;
  type: 'education' | 'work' | 'project' | 'achievement';
}

export interface SocialLink {
  name: string;
  url: string;
  icon: string;
}

export interface SiteSettings {
  title: string;
  description: string;
  url: string;
  author: string;
  email: string;
}
