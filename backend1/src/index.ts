import { WebSocketServer } from 'ws';
import { GameManager } from './GameManager';
import express from 'express';
import http from 'http';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { authRouter } from './auth';
import { prisma } from './prisma';

const requiredEnv = ['DATABASE_URL'];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

if (!process.env.JWT_SECRET) {
  console.warn(
    '\n⚠️  WARNING: JWT_SECRET environment variable is not set.\n' +
    '   Falling back to a dev-only default. Set JWT_SECRET in production before deploying.\n'
  );
}

const app = express();

app.set('trust proxy', 1);
app.use(cors());
app.use(express.json());

// ── Rate Limiting ──────────────────────────────────────────────────────────────
// Limit login attempts: max 10 per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
});

// Limit registration: max 5 accounts per hour per IP
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many accounts created from this IP. Please try again later.' },
});

app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/register', registerLimiter);

app.use('/api/auth', authRouter);

app.get('/health', (req, res) => {
  res.send('ok');
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const PORT = Number(process.env.PORT || 8080);

const gameManager = new GameManager();

const startServer = async () => {
  try {
    await prisma.$connect();
    console.log('Database connection successful');

    server.listen(PORT, () => console.log(`Server (HTTP+WS) started on port ${PORT}`));

    wss.on('connection', function connection(ws) {
      gameManager.addUser(ws);
    });
  } catch (error) {
    console.error('Failed to connect to database. Check DATABASE_URL and Prisma setup.', error);
    process.exit(1);
  }
};

startServer();