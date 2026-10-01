import express, { Request, Response, NextFunction } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';

import { config } from './server/src/config/index.js';
import { initDatabase } from './server/src/database/db.js';

// Route handlers
import { authRouter } from './server/src/routes/auth.routes.js';
import { clientRouter } from './server/src/routes/client.routes.js';
import { projectRouter } from './server/src/routes/project.routes.js';
import { taskRouter } from './server/src/routes/task.routes.js';
import { ticketRouter } from './server/src/routes/ticket.routes.js';
import { invoiceRouter } from './server/src/routes/invoice.routes.js';
import { teamRouter } from './server/src/routes/team.routes.js';
import { reportRouter } from './server/src/routes/report.routes.js';
import { notificationRouter } from './server/src/routes/notification.routes.js';
import { adminRouter } from './server/src/routes/admin.routes.js';
import { contactRouter } from './server/src/routes/contact.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  // Ensure database is initialized
  initDatabase();

  const app = express();

  // Basic security and parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // REST API Routes
  app.use('/api/auth', authRouter);
  app.use('/api/clients', clientRouter);
  app.use('/api/projects', projectRouter);
  app.use('/api/tasks', taskRouter);
  app.use('/api/tickets', ticketRouter);
  app.use('/api/invoices', invoiceRouter);
  app.use('/api/team', teamRouter);
  app.use('/api/reports', reportRouter);
  app.use('/api/notifications', notificationRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/contact', contactRouter);

  // Health check endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      app: 'ATLAS HUB',
      timestamp: new Date().toISOString(),
    });
  });

  // Centralized API error handling
  app.use('/api', (err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('API Error:', err);
    res.status(err.status || 500).json({
      success: false,
      error: err.message || 'خطای غیرمنتظره در سرور رخ داده است.',
    });
  });

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    // Development mode: Mount Vite dev server middlewares
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: Serve built static files
    const distPath = path.resolve(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req: Request, res: Response) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  const PORT = config.port;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ATLAS HUB] Full-Stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[ATLAS HUB] Failed to start server:', err);
  process.exit(1);
});
