import React from 'react';
import { RouteComponentProps } from 'react-router';
import { Link } from 'react-router-dom';
import { useTypedSelector } from 'src/app/hooks';
import { PostAuthor } from './PostAuthor';
import { ReactionButtons } from './ReactionButtons';
import { TimeAgo } from './TimeAgo';

type Props = {} & RouteComponentProps<{ postId: string }>;

export const SinglePostPage: React.VFC<Props> = ({ match }) => {
  const { postId } = match.params;
  const post = useTypedSelector((state) => state.posts.find((post) => post.id === postId));

  if (!post) {
    return (
      <section>
        <h2>Post not found!</h2>
      </section>
    );
  }

  return (
    <section>
      <article className="post">
        <h2>{post.title}</h2>
        <div>
          <PostAuthor userId={post.user} />
          <TimeAgo timestamp={post.date} />
        </div>
        <p className="post-content">{post.content}</p>
        <ReactionButtons post={post} />
        <Link to={`/editPost/${post.id}`} className="button">
          Edit Post
        </Link>
      </article>
    </section>
  );
};
