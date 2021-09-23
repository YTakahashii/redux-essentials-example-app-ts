import React, { useState, ChangeEventHandler } from 'react';
import { useTypedDispatch, useTypedSelector } from 'src/app/hooks';
import { addNewPost } from './postsSlice';

export const AddPostForm: React.VFC = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [userId, setUserId] = useState('');
  const [addRequestStatus, setAddRequestStatus] = useState<'idle' | 'pending'>('idle');

  const dispatch = useTypedDispatch();
  const users = useTypedSelector((state) => state.users);

  const onTitleChanged: ChangeEventHandler<HTMLInputElement> = (e) => setTitle(e.target.value);
  const onContentChanged: ChangeEventHandler<HTMLTextAreaElement> = (e) => setContent(e.target.value);
  const onAuthorChanged: ChangeEventHandler<HTMLSelectElement> = (e) => setUserId(e.currentTarget.value);

  const canSave = [title, content, userId].every(Boolean) && addRequestStatus === 'idle';
  const onSavePostClicked = async () => {
    if (canSave) {
      try {
        setAddRequestStatus('pending');
        await dispatch(addNewPost({ title, content, user: userId })).unwrap(); // 実際のaction.payload値を返すか、拒否されたアクションの場合はエラーの新しいPromiseを投げる

        setTitle('');
        setContent('');
        setUserId('');
      } catch (err) {
        console.error('Failed to save the post: ', err);
      } finally {
        setAddRequestStatus('idle');
      }
    }
  };

  const usersOptions = users.map((user) => (
    <option key={user.id} value={user.id}>
      {user.name}
    </option>
  ));

  return (
    <section>
      <h2>Add a New Post</h2>
      <form>
        <label htmlFor="postTitle">Post Title:</label>
        <input type="text" id="postTitle" name="postTitle" value={title} onChange={onTitleChanged} />
        <label htmlFor="postAuthor">Author:</label>
        <select id="postAuthor" value={userId} onChange={onAuthorChanged}>
          <option value=""></option>
          {usersOptions}
        </select>
        <label htmlFor="postContent">Content:</label>
        <textarea id="postContent" name="postContent" value={content} onChange={onContentChanged} />
        <button type="button" onClick={onSavePostClicked} disabled={!canSave}>
          Save Post
        </button>
      </form>
    </section>
  );
};
