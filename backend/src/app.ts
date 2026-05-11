import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import employeeRoutes from './routes/employee.routes'
import scheduleRoutes from './routes/schedule.routes';

const app = express();

app.use(cors());
app.use(express.json());

// Add auth routes
app.use('/api/auth', authRoutes);

app.use('/api/employees', employeeRoutes);

app.use('/api/schedules', scheduleRoutes);

export default app;