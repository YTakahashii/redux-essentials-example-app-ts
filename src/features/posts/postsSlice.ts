import { createSlice, nanoid, PayloadAction } from '@reduxjs/toolkit';
import { Post } from './postType';
import { sub } from 'date-fns';
import { initialReactions, Reaction } from './reactionType';

const initialState: Post[] = [
  {
    id: '1',
    title: 'First Post!',
    content: 'Hello!',
    date: sub(new Date(), { minutes: 10 }).toISOString(),
    reactions: initialReactions,
  },
  {
    id: '2',
    title: 'Second Post',
    content: 'More text',
    date: sub(new Date(), { minutes: 5 }).toISOString(),
    reactions: initialReactions,
  },
];

const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    postAdded: {
      reducer: (state, action: PayloadAction<Post>) => {
        // note: prepare -> reducer
        state.push(action.payload);
      },
      prepare: ({ title, content, userId }: Pick<Post, 'title' | 'content'> & { userId: string }) => {
        // note: action creator相当のfunction
        // note: reduxはpostsSlice.actions.postAdded({ title, content }) がdispatchされるとprepareを実行し、reducerのactionに受け渡す
        return {
          payload: {
            id: nanoid(),
            title,
            content,
            user: userId,
            date: new Date().toISOString(),
            reactions: initialReactions,
          },
        };
      },
    },
    postUpdated: (state, action: PayloadAction<Pick<Post, 'id' | 'title' | 'content'>>) => {
      const { id, title, content } = action.payload;
      const existingPost = state.find((post) => post.id === id);
      if (existingPost) {
        existingPost.title = title;
        existingPost.content = content;
      }
    },
    reactionAdded: (state, action: PayloadAction<{ postId: string; reaction: Reaction }>) => {
      const { postId, reaction } = action.payload;
      const existingPost = state.find((post) => post.id === postId);
      if (existingPost) {
        existingPost.reactions[reaction] += 1;
      }
    },
  },
});

export const { postAdded, postUpdated, reactionAdded } = postsSlice.actions;
export default postsSlice.reducer;
