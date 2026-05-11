import { Request, Response } from 'express';
import { ScheduleService } from '../services/scheduleService';
import { AuthRequest } from '../middleware/authMiddleware';

// Helper function to safely extract query params
const getQueryParam = (value: any): string | null => {
  if (!value) return null;
  if (Array.isArray(value)) return value[0];
  return value;
};

// Helper function to safely extract path params
const getPathParam = (value: any): string | null => {
  if (!value) return null;
  return String(value);
};


export class ScheduleController {
  // CREATE SCHEDULE
  static async createSchedule(req: AuthRequest, res: Response): Promise<void> {
  try {
    console.log('📥 Raw body received:', req.body);
    
    const { company_id, title, start_date, end_date } = req.body;
    const userId = req.user?.id;

    console.log('📋 Extracted values:', {
      company_id,
      title,
      start_date,
      end_date,
      userId
    });

    if (!company_id || !title || !start_date || !end_date || !userId) {
      console.log('❌ Missing fields detected');
      res.status(400).json({
        success: false,
        error: 'Missing required fields: company_id, title, start_date, end_date'
      });
      return;
    }

      const schedule = await ScheduleService.createSchedule(
        company_id,
        title,
        start_date,
        end_date,
        userId
      );

      res.status(201).json({
        success: true,
        data: schedule
      });
    } catch (error: any) {
      console.error('❌ Create schedule error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create schedule'
      });
    }
  }

  // GET ALL SCHEDULES
  static async getSchedules(req: Request, res: Response): Promise<void> {
    try {
      const companyId = getQueryParam(req.query.company_id as string | string[]);

      if (!companyId) {
        res.status(400).json({
          success: false,
          error: 'company_id is required'
        });
        return;
      }

      const schedules = await ScheduleService.getSchedules(companyId);

      res.json({
        success: true,
        data: schedules
      });
    } catch (error: any) {
      console.error('❌ Get schedules error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get schedules'
      });
    }
  }

  // GET SCHEDULE BY ID
  static async getScheduleById(req: Request, res: Response): Promise<void> {
    try {
      const id = getPathParam(req.params.id);

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Schedule ID is required'
        });
        return;
      }

      const schedule = await ScheduleService.getScheduleById(id);

      if (!schedule) {
        res.status(404).json({
          success: false,
          error: 'Schedule not found'
        });
        return;
      }

      res.json({
        success: true,
        data: schedule
      });
    } catch (error: any) {
      console.error('❌ Get schedule by ID error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get schedule'
      });
    }
  }

  // UPDATE SCHEDULE
  static async updateSchedule(req: Request, res: Response): Promise<void> {
    try {
      const id = getPathParam(req.params.id);
      const updates = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Schedule ID is required'
        });
        return;
      }

      if (!updates || Object.keys(updates).length === 0) {
        res.status(400).json({
          success: false,
          error: 'No updates provided'
        });
        return;
      }

      const schedule = await ScheduleService.updateSchedule(id, updates);

      res.json({
        success: true,
        data: schedule
      });
    } catch (error: any) {
      console.error('❌ Update schedule error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update schedule'
      });
    }
  }

  // DELETE SCHEDULE
  static async deleteSchedule(req: Request, res: Response): Promise<void> {
    try {
      const id = getPathParam(req.params.id);

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Schedule ID is required'
        });
        return;
      }

      await ScheduleService.deleteSchedule(id);

      res.json({
        success: true,
        message: 'Schedule deleted successfully'
      });
    } catch (error: any) {
      console.error('❌ Delete schedule error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to delete schedule'
      });
    }
  }

  // PUBLISH SCHEDULE
  static async publishSchedule(req: Request, res: Response): Promise<void> {
    try {
      const id = getPathParam(req.params.id);

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Schedule ID is required'
        });
        return;
      }

      const schedule = await ScheduleService.publishSchedule(id);

      res.json({
        success: true,
        data: schedule,
        message: 'Schedule published successfully'
      });
    } catch (error: any) {
      console.error('❌ Publish schedule error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to publish schedule'
      });
    }
  }

  // GET SHIFTS FOR SCHEDULE
  static async getShifts(req: Request, res: Response): Promise<void> {
    try {
      const scheduleId = getQueryParam(req.query.schedule_id as string | string[]);

      if (!scheduleId) {
        res.status(400).json({
          success: false,
          error: 'schedule_id is required'
        });
        return;
      }

      const shifts = await ScheduleService.getShifts(scheduleId);

      res.json({
        success: true,
        data: shifts
      });
    } catch (error: any) {
      console.error('❌ Get shifts error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get shifts'
      });
    }
  }

  // ADD SHIFT
  static async addShift(req: Request, res: Response): Promise<void> {
  try {
    const { schedule_id, date, start_time, end_time, position, employee_ids } = req.body;

    if (!schedule_id || !date || !start_time || !end_time || !position) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: schedule_id, date, start_time, end_time, position'
      });
      return;
    }

    const shift = await ScheduleService.addShift(
      schedule_id,
      date,
      start_time,
      end_time,
      position,
      employee_ids || []   // ← array, empty if none selected
    );

    res.status(201).json({
      success: true,
      data: shift
    });
  } catch (error: any) {
    console.error('❌ Add shift error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to add shift'
    });
  }
}
  // ASSIGN EMPLOYEE TO SHIFT
  static async assignEmployeeToShift(req: Request, res: Response): Promise<void> {
    try {
      const { shift_id, employee_id } = req.body;

      if (!shift_id || !employee_id) {
        res.status(400).json({
          success: false,
          error: 'shift_id and employee_id are required'
        });
        return;
      }

      const shift = await ScheduleService.assignEmployeesToShift(shift_id, [employee_id]);

      res.json({
        success: true,
        data: shift
      });
    } catch (error: any) {
      console.error('❌ Assign employee error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to assign employee'
      });
    }
  }

  // UNASSIGN SHIFT
static async unassignShift(req: Request, res: Response): Promise<void> {
  try {
    const { shift_id, employee_id } = req.body;

    if (!shift_id || !employee_id) {
      res.status(400).json({
        success: false,
        error: 'shift_id and employee_id are required'
      });
      return;
    }

    const shift = await ScheduleService.unassignEmployeeFromShift(shift_id, employee_id);

    res.json({
      success: true,
      data: shift
    });
  } catch (error: any) {
    console.error('❌ Unassign shift error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to unassign shift'
    });
  }
}

  // DELETE SHIFT
  static async deleteShift(req: Request, res: Response): Promise<void> {
    try {
      const { shift_id } = req.body;

      if (!shift_id) {
        res.status(400).json({
          success: false,
          error: 'shift_id is required'
        });
        return;
      }

      await ScheduleService.deleteShift(shift_id);

      res.json({
        success: true,
        message: 'Shift deleted successfully'
      });
    } catch (error: any) {
      console.error('❌ Delete shift error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to delete shift'
      });
    }
  }
}