import React from 'react';
import { useTypedSelector } from 'src/app/hooks';
import { selectUserById } from '../users/usersSlice';

type Props = {
  userId?: string;
};

export const PostAuthor: React.VFC<Props> = ({ userId }) => {
  const author = useTypedSelector((state) => selectUserById(state, userId ?? ''));

  return <span>by {author ? author.name : 'Unknown author'}</span>;
};
