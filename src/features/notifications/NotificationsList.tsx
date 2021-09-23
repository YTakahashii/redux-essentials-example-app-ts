import React, { useLayoutEffect } from 'react';
import { useTypedDispatch, useTypedSelector } from 'src/app/hooks';
import { selectAllUsers } from '../users/usersSlice';
import { allNotificationsRead, selectAllNotifications } from './notificationsSlice';
import { formatDistanceToNow, parseISO } from 'date-fns';
import classNames from 'classnames';

export const NotificationsList: React.VFC = () => {
  const dispatch = useTypedDispatch();
  const notifications = useTypedSelector(selectAllNotifications);
  const users = useTypedSelector(selectAllUsers);

  useLayoutEffect(() => {
    dispatch(allNotificationsRead());
  });

  const renderedNotifications = notifications.map((notification) => {
    const date = parseISO(notification.date);
    const timeAgo = formatDistanceToNow(date);
    const user = users.find((user) => user.id === notification.user) || {
      name: 'Unknown User',
    };
    const notificationClassName = classNames('notification', {
      new: !!notification.isNew,
    });

    return (
      <div key={notification.id} className={notificationClassName}>
        <div>
          <b>{user.name}</b> {notification.message}
        </div>
        <div title={notification.date}>
          <i>{timeAgo} ago</i>
        </div>
      </div>
    );
  });

  return (
    <section className="notificationsList">
      <h2>Notifications</h2>
      {renderedNotifications}
    </section>
  );
};
