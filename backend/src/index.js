import express from 'express';
import cors from 'cors';
import requestsRouter from './routes/requests.js';
import usersRouter from './routes/users.js';
import facultiesRouter from './routes/faculties.js';
import emailRouter from './routes/email.js';
import coursesRouter from './routes/courses.js';
import emailApprovalRouter from './routes/emailApproval.js';
import noCheckinRouter from './routes/noCheckin.js';

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
  : ['http://localhost:5173'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

app.use('/api/requests', requestsRouter);
app.use('/api/users', usersRouter);
app.use('/api/faculties', facultiesRouter);
app.use('/api/email', emailRouter);
app.use('/api/courses', coursesRouter);
app.use('/api/approval', emailApprovalRouter);
app.use('/api/no-checkin', noCheckinRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
