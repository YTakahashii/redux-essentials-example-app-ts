import { configureStore } from '@reduxjs/toolkit';
import postsReducer from 'src/features/posts/postsSlice';
import usersReducer from 'src/features/users/usersSlice';

const store = configureStore({
  reducer: {
    posts: postsReducer,
    users: usersReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;
