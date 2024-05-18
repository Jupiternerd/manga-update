import { VercelRequest, VercelResponse } from '@vercel/node';
import { JwtPayload } from 'jsonwebtoken';

export interface AuthenticatedRequest extends VercelRequest {
    userId?: string;
}

export interface JwtPayloadWithUserId extends JwtPayload {
    userId: string;
  }