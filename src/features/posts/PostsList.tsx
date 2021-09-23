import { EntityId } from '@reduxjs/toolkit';
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTypedDispatch, useTypedSelector } from 'src/app/hooks';
import { Spinner } from 'src/components/Spinner';
import { PostAuthor } from './PostAuthor';
import { fetchPosts, selectPostById, selectPostIds } from './postsSlice';
import { Post } from './postState';
import { ReactionButtons } from './ReactionButtons';
import { TimeAgo } from './TimeAgo';

const PostExcerpt: React.VFC<{ postId: EntityId }> = ({ postId }) => {
  const post = useTypedSelector((state) => selectPostById(state, postId));

  if (!post) {
    return <div>Post mpt found.</div>;
  }

  return (
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
};

// note: 参照していないのでexport
export const MemorizedPostExcerpt: React.NamedExoticComponent<{ post: Post }> = React.memo(({ post }) => (
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
));

export const PostsList: React.VFC = () => {
  const dispatch = useTypedDispatch();
  const orderedPostIds = useTypedSelector(selectPostIds);
  const postStatus = useTypedSelector((state) => state.posts.status);
  const error = useTypedSelector((state) => state.posts.error);

  useEffect(() => {
    if (postStatus === 'idle') {
      dispatch(fetchPosts());
    }
  }, [postStatus, dispatch]);

  return (
    <section className="posts-list">
      <h2>Posts</h2>
      {postStatus === 'loading' ? (
        <Spinner text="loading..." />
      ) : postStatus === 'succeeded' ? (
        orderedPostIds.map((postId) => <PostExcerpt key={postId} postId={postId} />)
      ) : postStatus === 'failed' ? (
        <div>{error}</div>
      ) : null}
    </section>
  );
};

/*
 * note:
  正規化の前は、reactionが更新される度に、posts配列の内容が更新されるため、<PostsList /> が再レンダリングされていた。
  このときに <PostExcerpt />がメモ化されていないと、<PostExcerpt />の再レンダリングにより、リアクションが更新されていない<PostExcerpt />まで再レンダリングされてしまった。（親の再レンダリングによる子の再レンダリング）

  postsを正規化することによって、<PostsList />はidsだけ見れば良くなり、postsの中身が更新されても再レンダリングされなくなった。
  さらに、<PostExcerpt /> の propsはpostIdのみになり、その中で取得しているpostの値が更新されない限りは再レンダリングされなくなった。
*/
