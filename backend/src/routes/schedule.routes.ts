import { Router } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { ScheduleController } from '../controllers/scheduleController';

const router = Router();

// Auth middleware
router.use(authMiddleware);

// Schedule routes
router.post('/', ScheduleController.createSchedule);
router.get('/', ScheduleController.getSchedules);
router.get('/:id', ScheduleController.getScheduleById);
router.put('/:id', ScheduleController.updateSchedule);
router.delete('/:id', ScheduleController.deleteSchedule);
router.post('/:id/publish', ScheduleController.publishSchedule);

// Shift routes
router.get('/:schedule_id/shifts', ScheduleController.getShifts);
router.post('/:schedule_id/shifts', ScheduleController.addShift);
router.post('/shifts/assign', ScheduleController.assignEmployeeToShift);
router.post('/shifts/unassign', ScheduleController.unassignShift);
router.delete('/shifts/delete', ScheduleController.deleteShift);

export default router;