import { createAsyncThunk, createEntityAdapter, createSlice } from '@reduxjs/toolkit';
import { client } from 'src/api/client';
import { RootState } from 'src/app/store';
import { User } from './userType';

const usersAdapter = createEntityAdapter<User>();

const initialState = usersAdapter.getInitialState();

export const fetchUsers = createAsyncThunk('users/fetchUser', async () => {
  const result = await client.get('/fakeApi/users');
  return result.data as User[];
});

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchUsers.fulfilled, usersAdapter.setAll);
  },
});

export default usersSlice.reducer;

export const {
  selectAll: selectAllUsers,
  selectById: selectUserById,
  selectIds: selectUserIds,
} = usersAdapter.getSelectors<RootState>((state) => state.users);
