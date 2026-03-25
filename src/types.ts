export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'user';
}

export interface Character {
  id: number;
  user_id: number;
  name: string;
  personality: string;
  niche: string;
  avatar_url: string;
  created_at: string;
}

export interface ContentItem {
  id: number;
  character_id: number;
  type: 'image' | 'video' | 'post';
  url: string;
  prompt: string;
  created_at: string;
}

export type GenerationType = 'image' | 'video' | 'text';
