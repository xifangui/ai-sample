import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

type JwtPayload = {
  userId: number;
  email: string;
  role: 'user' | 'admin';
};

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, message: 'Token not provided' });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(500).json({ success: false, message: 'JWT secret not configured' });
  }

  jwt.verify(token, secret, (err, decoded) => {
    if (err || !decoded) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
    req.user = decoded as JwtPayload;
    next();
  });
}

export function authorizeRoles(roles: Array<'user' | 'admin'>) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthenticated' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    next();
  };
}
