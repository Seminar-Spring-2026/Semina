import type { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';

function getEnv(name: string): string | undefined {
  const v = process.env[name];
  return v && v.trim() !== '' ? v : undefined;
}

function initFirebaseAdmin(): void {
  if (admin.apps.length > 0) return;

  const projectId = getEnv('FIREBASE_PROJECT_ID');
  const clientEmail = getEnv('FIREBASE_CLIENT_EMAIL');
  const privateKeyRaw = getEnv('FIREBASE_PRIVATE_KEY');

  if (!projectId || !clientEmail || !privateKeyRaw) {
    throw new Error(
      'Missing Firebase Admin env vars. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY.'
    );
  }

  const privateKey = privateKeyRaw.replace(/\\n/g, '\n');

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

export async function requireFirebaseAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    initFirebaseAdmin();

    const authHeader = req.headers.authorization || '';
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    const token = match?.[1];

    if (!token) {
      res.status(401).json({ success: false, error: 'Missing Authorization bearer token' });
      return;
    }

    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;

    next();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unauthorized';
    res.status(401).json({ success: false, error: message });
  }
}

