import { nanoid } from 'nanoid'

export const generateId = (length?: number) => nanoid(length);
