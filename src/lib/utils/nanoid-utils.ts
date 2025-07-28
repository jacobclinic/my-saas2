import { customAlphabet } from 'nanoid'
const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

const customNanoid = customAlphabet(alphabet, 12);

export const generateId = (length?: number) => customNanoid(length);
