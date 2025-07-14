// lib/registration-link.ts
import jwt from 'jsonwebtoken';

export interface ClassRegistrationData {
  classId: string;
  className: string;
  nextSession: string;
  time: string;
  tutorName: string;
}

export function generateRegistrationToken(data: ClassRegistrationData): string {
  return jwt.sign(data, process.env.JWT_SECRET!, { expiresIn: '7d' });
}

export function verifyRegistrationToken(
  token: string,
): ClassRegistrationData | null {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as ClassRegistrationData;
  } catch {
    return null;
  }
}
