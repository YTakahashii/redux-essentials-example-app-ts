import React from 'react';
import { Link } from 'react-router-dom';
import { useTypedSelector } from 'src/app/hooks';
import { selectAllUsers } from './usersSlice';

export const UsersList: React.VFC = () => {
  const users = useTypedSelector(selectAllUsers);

  const renderedUsers = users.map((user) => (
    <li key={user.id}>
      <Link to={`/users/${user.id}`}>{user.name}</Link>
    </li>
  ));

  return (
    <section>
      <h2>Users</h2>
      {renderedUsers}
    </section>
  );
};
