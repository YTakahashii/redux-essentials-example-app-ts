export type AsyncStatus = 'idle' | 'loading' | 'succeeded' | 'failed';
export type AsyncState = {
  status: AsyncStatus;
  error: string | null;
};
