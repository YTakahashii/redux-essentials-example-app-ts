import React from 'react';
import { RouteComponentProps } from 'react-router';
import { Link } from 'react-router-dom';
import { useTypedSelector } from 'src/app/hooks';
import { selectPostsByUser } from '../posts/postsSlice';
import { selectUserById } from './usersSlice';

type Props = RouteComponentProps<{ userId: string }>;

export const UserPage: React.VFC<Props> = ({ match }) => {
  const { userId } = match.params;

  const user = useTypedSelector((state) => selectUserById(state, userId));

  /*
  // note: useSelectorは何らかのactionがdispatchされる度に実行され、新しい参照値を返すとコンポーネントの再レンダリングが強制される
  // note: filterは常に新しい配列の参照を返すため、実際に値が変化していなくても、どこかでactionがdispatchされると再レンダリングされてしまう
  const postsForUser = useTypedSelector((state) => {
    const allPosts = selectAllPosts(state);
    return allPosts.filter((post) => post.user === userId);
  });
  */

  const postsForUser = useTypedSelector((state) => selectPostsByUser(state, userId));

  const postTitles = postsForUser.map((post) => (
    <li key={post.id}>
      <Link to={`/posts/${post.id}`}>{post.title}</Link>
    </li>
  ));

  if (!user) {
    return (
      <section>
        <p>User not found</p>
      </section>
    );
  }

  return (
    <section>
      <h2>{user.name}</h2>
      <ul>{postTitles}</ul>
    </section>
  );
};
