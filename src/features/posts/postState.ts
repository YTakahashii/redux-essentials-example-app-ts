import { AsyncState } from 'src/app/asyncState';
import { Reactions } from './reactionType';

export type Post = {
  id: string;
  title: string;
  content: string;
  user?: string;
  date: string;
  reactions: Reactions;
};

export type PostState = {
  posts: Post[];
} & AsyncState;
