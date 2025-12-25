export type ActionResponse<T = null> =
  | {
      data: T;
      error: null;
    }
  | {
      data: null;
      error: { message: string; code?: string; details?: unknown };
    }
  | undefined;
