import { VercelRequest, VercelResponse } from '@vercel/node';
import { AuthenticatedRequest, JwtPayloadWithUserId } from './types';
import jwt from 'jsonwebtoken';

export default function authMiddleware(req: AuthenticatedRequest, res: VercelResponse, next: Function) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send('Authorization header missing');
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).send('Token missing');
  }

  try {
    if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET not set');
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayloadWithUserId;
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).send('Invalid token');
  }
}