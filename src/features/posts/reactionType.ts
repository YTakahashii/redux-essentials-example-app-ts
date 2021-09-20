export const reactionEmoji = {
  thumbsUp: '👍',
  hooray: '🎉',
  heart: '❤️',
  rocket: '🚀',
  eyes: '👀',
  rabbit: '🐰',
} as const;

export type ReactionEmoji = typeof reactionEmoji;
export type Reaction = keyof ReactionEmoji;
export type Reactions<T extends ReactionEmoji = ReactionEmoji> = {
  [K in keyof T]: number;
};

export const initialReactions: Reactions = { thumbsUp: 0, hooray: 0, heart: 0, rocket: 0, eyes: 0, rabbit: 0 };
