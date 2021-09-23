import { createAsyncThunk, createEntityAdapter, createSlice } from '@reduxjs/toolkit';
import { client } from 'src/api/client';
import { RootState } from 'src/app/store';
import { Notification } from './notificationsState';

const notificationsAdapter = createEntityAdapter<Notification>({
  sortComparer: (a, b) => b.date.localeCompare(a.date),
});

const initialState = notificationsAdapter.getInitialState();

export const fetchNotifications = createAsyncThunk<Notification[], void, { state: RootState }>(
  'notifications/fetchNotifications',
  async (_, { getState }) => {
    const allNotifications = selectAllNotifications(getState());
    const [latestNotification] = allNotifications;
    const latestTimestamp = latestNotification?.date ?? '';
    const response = await client.get(`/fakeApi/notifications?since=${latestTimestamp}`);
    return response.data as Notification[];
  }
);

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    allNotificationsRead: (state) => {
      Object.values(state.entities).forEach((notification) => {
        if (notification) {
          notification.read = true;
        }
      });
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchNotifications.fulfilled, (state, action) => {
      Object.values(state.entities).forEach((notification) => {
        if (notification) {
          notification.isNew = !notification.read;
        }
      });
      notificationsAdapter.upsertMany(state, action.payload);
    });
  },
});

export const { allNotificationsRead } = notificationsSlice.actions;
export default notificationsSlice.reducer;

export const {
  selectAll: selectAllNotifications,
  selectById: selectNotificationById,
  selectIds: selectNotificationIds,
} = notificationsAdapter.getSelectors<RootState>((state) => state.notifications);
