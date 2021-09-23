import React from 'react';
import { Link } from 'react-router-dom';
import { fetchNotifications, selectAllNotifications } from 'src/features/notifications/notificationsSlice';
import { useTypedDispatch, useTypedSelector } from './hooks';

export const Navbar: React.VFC = () => {
  const dispatch = useTypedDispatch();
  const notifications = useTypedSelector(selectAllNotifications);
  const numUnreadNotifications = notifications.filter((n) => !n.read).length;

  const fetchNewNotifications = () => {
    dispatch(fetchNotifications());
  };

  return (
    <nav>
      <section>
        <h1>Redux Essentials Example</h1>

        <div className="navContent">
          <div className="navLinks">
            <Link to="/posts">Posts</Link>
            <Link to="/users">Users</Link>
            <Link to="/notifications">
              Notifications {numUnreadNotifications > 0 && <span className="badge">{numUnreadNotifications}</span>}
            </Link>
          </div>
          <button className="button" onClick={fetchNewNotifications}>
            Refresh Notifications
          </button>
        </div>
      </section>
    </nav>
  );
};
