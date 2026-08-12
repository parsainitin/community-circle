import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import webhookRoutes from './routes/webhookRoutes';
import groupRoutes from './routes/groupRoutes';
import broadcastRoutes from './routes/broadcastRoutes';
import instanceRoutes from './routes/instanceRoutes';
import directMessageRoutes from './routes/directMessageRoutes';
import configRoutes from './routes/configRoutes';

export const createApp = (): Application => {
  const app = express();

  // Middlewares
  app.use(helmet({ contentSecurityPolicy: false })); // Allow inline QR code base64 rendering
  app.use(cors());
  app.use(express.json());

  // Serve static UI frontend
  app.use(express.static(path.join(__dirname, '../public')));

  // Health check endpoint
  app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'OK', service: 'WhastFlow Backend', timestamp: new Date() });
  });

  // API Routes
  app.use('/api/config', configRoutes);
  app.use('/api/instance', instanceRoutes);
  app.use('/api/webhooks', webhookRoutes);
  app.use('/api/groups', groupRoutes);
  app.use('/api/broadcast', broadcastRoutes);
  app.use('/api/message', directMessageRoutes);

  // Fallback to Dashboard for root SPA routes
  app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  });

  return app;
};
