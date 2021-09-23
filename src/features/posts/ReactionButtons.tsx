import React from 'react';
import { useTypedDispatch } from 'src/app/hooks';
import { reactionAdded } from './postsSlice';
import { Post } from './postState';
import { reactionEmoji, Reaction } from './reactionType';

type Props = {
  post: Post;
};

export const ReactionButtons: React.VFC<Props> = ({ post }) => {
  const dispatch = useTypedDispatch();

  const reactionButtons = Object.entries(reactionEmoji).map(([name, emoji]) => {
    return (
      <button
        key={name}
        type="button"
        className="muted-button reaction-button"
        onClick={() => {
          dispatch(
            reactionAdded({
              postId: post.id,
              reaction: name as Reaction,
            })
          );
        }}
      >
        {emoji} {post.reactions[name as Reaction]}
      </button>
    );
  });

  return <div>{reactionButtons}</div>;
};
