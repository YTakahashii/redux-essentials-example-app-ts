import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Post, PostState } from './postState';
import { Reaction } from './reactionType';
import { selector } from 'src/app/selector';
import { client } from 'src/api/client';

const initialState: PostState = {
  posts: [],
  status: 'idle',
  error: null,
};

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
      const existingPost = state.posts.find((post) => post.id === id);
      if (existingPost) {
        existingPost.title = title;
        existingPost.content = content;
      }
    },
    reactionAdded: (state, action: PayloadAction<{ postId: string; reaction: Reaction }>) => {
      const { postId, reaction } = action.payload;
      const existingPost = state.posts.find((post) => post.id === postId);
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
        state.posts = state.posts.concat(action.payload);
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message ?? null;
      });
    builder.addCase(addNewPost.fulfilled, (state, action) => {
      state.posts.push(action.payload);
    });
  },
});

export const { postUpdated, reactionAdded } = postsSlice.actions;
export default postsSlice.reducer;

export const selectAllPosts = selector((state) => state.posts.posts);
export const selectPostById = selector((state, postId: string) => state.posts.posts.find((post) => post.id === postId));
