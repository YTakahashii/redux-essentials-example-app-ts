export const reactionEmoji = {
  thumbsUp: '👍',
  hooray: '🎉',
  heart: '❤️',
  rocket: '🚀',
  eyes: '👀',
} as const;

export type Reaction = keyof typeof reactionEmoji;
export type Reactions = {
  [K in Reaction]: number;
};
