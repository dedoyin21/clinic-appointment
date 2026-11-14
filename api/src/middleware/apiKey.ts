import type { RequestHandler } from 'express';

export const apiKey: RequestHandler = (req, res, next) => {
  if (!process.env.API_KEY || req.get('X-API-Key') !== process.env.API_KEY) {
    res.status(401).json({ error: 'Invalid or missing X-API-Key' });
    return;
  }
  next();
};
