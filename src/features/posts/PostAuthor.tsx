import React from 'react';
import { useTypedSelector } from 'src/app/hooks';

type Props = {
  userId?: string;
};
export const PostAuthor: React.VFC<Props> = ({ userId }) => {
  const author = useTypedSelector((state) => state.users.find((user) => user.id === userId));

  return <span>by {author ? author.name : 'Unknown author'}</span>;
};
