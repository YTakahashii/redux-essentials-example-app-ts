import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Post } from './types';

const initialState: Post[] = [
  { id: '1', title: 'First Post!', content: 'Hello!' },
  { id: '2', title: 'Second Post', content: 'More text' },
];

const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    postAdded: (state, action: PayloadAction<Post>) => {
      state.push(action.payload);
    },
  },
});

export const { postAdded } = postsSlice.actions;
export default postsSlice.reducer;
