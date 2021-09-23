import React, { useState, ChangeEventHandler } from 'react';
import { RouteComponentProps, useHistory } from 'react-router';
import { useTypedDispatch, useTypedSelector } from 'src/app/hooks';
import { postUpdated, selectPostById } from './postsSlice';

type Props = RouteComponentProps<{ postId: string }>;

export const EditPostForm: React.VFC<Props> = ({ match }) => {
  const { postId } = match.params;

  const post = useTypedSelector((state) => selectPostById(state, postId));
  const [title, setTitle] = useState(post?.title ?? '');
  const [content, setContent] = useState(post?.content ?? '');

  const dispatch = useTypedDispatch();
  const history = useHistory();

  const onTitleChanged: ChangeEventHandler<HTMLInputElement> = (e) => setTitle(e.target.value);
  const onContentChanged: ChangeEventHandler<HTMLTextAreaElement> = (e) => setContent(e.target.value);

  const onSavePostClicked = () => {
    if (title && content) {
      dispatch(
        postUpdated({
          id: postId,
          title,
          content,
        })
      );
      history.push(`/posts/${postId}`);
    }
  };

  return (
    <section>
      <h2>Edit Post</h2>
      <form>
        <label htmlFor="postTitle">Post Title:</label>
        <input
          type="text"
          id="postTitle"
          name="postTitle"
          placeholder="What's on your mind?"
          value={title}
          onChange={onTitleChanged}
        />
        <label htmlFor="postContent">Content:</label>
        <textarea id="postContent" name="postContent" value={content} onChange={onContentChanged} />
      </form>
      <button type="button" onClick={onSavePostClicked}>
        Save Post
      </button>
    </section>
  );
};
