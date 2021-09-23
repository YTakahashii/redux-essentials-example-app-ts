import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { client } from 'src/api/client';
import { User } from './userType';

const initialState: User[] = [];

export const fetchUsers = createAsyncThunk('users/fetchUser', async () => {
  const result = await client.get('/fakeApi/users');
  return result.data as User[];
});

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchUsers.fulfilled, (state, action) => {
      return action.payload;
    });
  },
});

export default usersSlice.reducer;
