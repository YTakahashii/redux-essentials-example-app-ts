import { createAsyncThunk, createSlice, PayloadAction, createSelector, createEntityAdapter } from '@reduxjs/toolkit';
import { Post } from './postState';
import { Reaction } from './reactionType';
import { selector } from 'src/app/selector';
import { client } from 'src/api/client';
import { AsyncState } from 'src/app/asyncState';
import { RootState } from 'src/app/store';

const postsAdapter = createEntityAdapter<Post>({
  sortComparer: (a, b) => b.date.localeCompare(a.date),
});

const initialState = postsAdapter.getInitialState<AsyncState>({
  status: 'idle',
  error: null,
});

export const fetchPosts = createAsyncThunk('posts/fetchPosts', async () => {
  const response = await client.get('/fakeApi/posts');
  return response.data as Post[];
});

type AddNewPostParams = Pick<Post, 'title' | 'content'> & { user: string };
export const addNewPost = createAsyncThunk('posts/addNewPost', async (initialPost: AddNewPostParams) => {
  const result = await client.post('fakeApi/posts', initialPost);
  return result.data as Post;
});

const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    postUpdated: (state, action: PayloadAction<Pick<Post, 'id' | 'title' | 'content'>>) => {
      const { id, title, content } = action.payload;
      const existingPost = state.entities[id];
      if (existingPost) {
        existingPost.title = title;
        existingPost.content = content;
      }
    },
    reactionAdded: (state, action: PayloadAction<{ postId: string; reaction: Reaction }>) => {
      const { postId, reaction } = action.payload;
      const existingPost = state.entities[postId];
      if (existingPost) {
        existingPost.reactions[reaction] += 1;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPosts.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.status = 'succeeded';
        postsAdapter.upsertMany(state, action.payload);
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? null;
      });
    builder.addCase(addNewPost.fulfilled, postsAdapter.addOne);
  },
});

export const { postUpdated, reactionAdded } = postsSlice.actions;
export default postsSlice.reducer;

export const {
  selectAll: selectAllPosts,
  selectById: selectPostById,
  selectIds: selectPostIds,
} = postsAdapter.getSelectors<RootState>((state) => state.posts);
export const selectPostsByUser = createSelector(
  [selectAllPosts, selector((_, userId: string) => userId)], // input selector
  (posts, userId) => posts.filter((post) => post.user === userId) // output selector
);
