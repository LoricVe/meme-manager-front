import { Tag } from './tag';
import { User } from './user';

export interface Meme {
  id: string;
  title: string;
  image: string;
  views: number;
  likes: number;
  user_created: string | User;
  date_created: string;
  date_updated?: string;
  tags?: MemeTag[];
  status: 'published' | 'draft' | 'archived';
  isLikedByCurrentUser?: boolean; // Ajouté côté client
}

export interface MemeTag {
  id: string;
  memes_id: string;
  tags_id: string | Tag;
}

export interface MemeLike {
  id: string;
  meme_id: string | Meme;
  user_id: string | User;
  date_created: string;
}

export interface CreateMemeData {
  title: string;
  image: File;
  tags?: string[];
  status?: 'published' | 'draft';
}