import { customAlphabet } from 'nanoid'
const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

const customNanoid = customAlphabet(alphabet, 12);
customNanoid()

export const generateId = (length?: number) => customNanoid(length);
