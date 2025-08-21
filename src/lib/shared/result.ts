import { AppError } from "./errors";

export type Result<T, E = AppError> = { success: true; data: T } | { success: false; error: E };

export const success = <T>(data: T): Result<T> => ({ success: true, data });
export const failure = <E extends AppError>(error: E): Result<never, E> => ({ success: false, error });