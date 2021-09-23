import { RootState } from './store';

type Extras<T extends unknown[]> = T extends [RootState, ...infer Extras] ? Extras : [];

export const selector = <T extends (state: RootState, ...extras: any[]) => unknown>(
  select: T
): T extends (...params: infer Params) => infer Return
  ? (state: Params[0], ...extras: Extras<Params>) => Return
  : never => select as any;
