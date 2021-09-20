import { Reactions } from './reactionType';

export type Post = {
  id: string;
  title: string;
  content: string;
  user?: string;
  date: string;
  reactions: Reactions;
};
