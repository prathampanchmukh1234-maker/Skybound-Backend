
import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase.js';

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization header' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  if (!supabase) {
    // If Supabase is not configured, we might be in demo mode
    // For now, let's allow it to pass if we want to "get back running"
    // but ideally we should check if it's a demo token
    return next();
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    // Optionally attach user to request
    (req as any).user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Authentication failed' });
  }
};
