import React, { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTypedDispatch, useTypedSelector } from 'src/app/hooks';
import { Spinner } from 'src/components/Spinner';
import { PostAuthor } from './PostAuthor';
import { fetchPosts, selectAllPosts } from './postsSlice';
import { Post } from './postState';
import { ReactionButtons } from './ReactionButtons';
import { TimeAgo } from './TimeAgo';

const PostExcerpt: React.VFC<{ post: Post }> = ({ post }) => (
  <article className="post-excerpt">
    <h3>{post.title}</h3>
    <div>
      <PostAuthor userId={post.user} />
      <TimeAgo timestamp={post.date} />
    </div>
    <p className="post-content">{post.content.substring(0, 100)}</p>
    <ReactionButtons post={post} />
    <Link to={`/posts/${post.id}`} className="button muted-button">
      View Post
    </Link>
  </article>
);

export const PostsList: React.VFC = () => {
  const dispatch = useTypedDispatch();
  const posts = useTypedSelector(selectAllPosts);
  const postStatus = useTypedSelector((state) => state.posts.status);
  const error = useTypedSelector((state) => state.posts.error);

  useEffect(() => {
    if (postStatus === 'idle') {
      dispatch(fetchPosts());
    }
  }, [postStatus, dispatch]);

  const orderedPosts = useMemo(
    () => (postStatus === 'succeeded' ? posts.slice().sort((a, b) => b.date.localeCompare(a.date)) : posts),
    [postStatus, posts]
  );

  return (
    <section className="posts-list">
      <h2>Posts</h2>
      {postStatus === 'loading' ? (
        <Spinner text="loading..." />
      ) : postStatus === 'succeeded' ? (
        orderedPosts.map((post) => <PostExcerpt key={post.id} post={post} />)
      ) : postStatus === 'failed' ? (
        <div>{error}</div>
      ) : null}
    </section>
  );
};
