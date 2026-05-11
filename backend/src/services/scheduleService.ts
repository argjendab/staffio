import { supabase } from '../config/supabase';

export class ScheduleService {
  static async createSchedule(
    companyId: string,
    title: string,
    startDate: string,
    endDate: string,
    createdBy: string
  ) {
    try {
      console.log('📅 Creating schedule:', title);

      const { data, error } = await supabase
        .from('schedules')
        .insert([{
          company_id: companyId,
          title,
          start_date: startDate,
          end_date: endDate,
          created_by: createdBy,
          status: 'draft'
        }])
        .select();

      if (error) throw error;

      console.log('✅ Schedule created:', data?.[0]?.id);
      return data?.[0];
    } catch (error: any) {
      console.error('❌ Error creating schedule:', error.message);
      throw error;
    }
  }

  static async getSchedules(companyId: string) {
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('company_id', companyId)
        .order('start_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('❌ Error getting schedules:', error.message);
      throw error;
    }
  }

  static async getScheduleById(scheduleId: string) {
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('id', scheduleId)
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('❌ Error getting schedule:', error.message);
      throw error;
    }
  }

  static async updateSchedule(scheduleId: string, updates: Partial<any>) {
    try {
      const { data, error } = await supabase
        .from('schedules')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', scheduleId)
        .select();

      if (error) throw error;
      return data?.[0];
    } catch (error: any) {
      console.error('❌ Error updating schedule:', error.message);
      throw error;
    }
  }

  static async deleteSchedule(scheduleId: string) {
    try {
      const { error } = await supabase
        .from('schedules')
        .delete()
        .eq('id', scheduleId);

      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error('❌ Error deleting schedule:', error.message);
      throw error;
    }
  }

  static async publishSchedule(scheduleId: string) {
    try {
      return this.updateSchedule(scheduleId, { status: 'published' });
    } catch (error: any) {
      console.error('❌ Error publishing schedule:', error.message);
      throw error;
    }
  }

  // ── SHIFTS ────────────────────────────────────────────────────────────

  static async addShift(
    scheduleId: string,
    date: string,
    startTime: string,
    endTime: string,
    position: string,
    employeeIds: string[] = []   // multiple employees
  ) {
    try {
      console.log('➕ Adding shift to schedule:', scheduleId);

      const { data: existing, error: checkError } = await supabase
        .from('shifts')
        .select('id')
        .eq('schedule_id', scheduleId)
        .eq('date', date)

      if (checkError) throw checkError;

      if (existing && existing.length > 0) {
  throw new Error(`A shift already exists for this date`);
}

      // Create the shift
      const { data: shift, error: shiftError } = await supabase
        .from('shifts')
        .insert([{
          schedule_id: scheduleId,
          date,
          start_time: startTime,
          end_time: endTime,
          position,
          status: employeeIds.length > 0 ? 'assigned' : 'unassigned'
        }])
        .select()
        .single();

      if (shiftError) throw shiftError;

      // Assign employees if provided
      if (employeeIds.length > 0) {
        const assignments = employeeIds.map(employeeId => ({
          shift_id: shift.id,
          employee_id: employeeId
        }));

        const { error: assignError } = await supabase
          .from('shift_assignments')
          .insert(assignments);

        if (assignError) throw assignError;
      }

      console.log('✅ Shift added with', employeeIds.length, 'employees');
      return shift;
    } catch (error: any) {
      console.error('❌ Error adding shift:', error.message);
      throw error;
    }
  }

  static async getShifts(scheduleId: string) {
    try {
      console.log('📥 Getting shifts for schedule:', scheduleId);

      // Get shifts
      const { data: shifts, error: shiftError } = await supabase
        .from('shifts')
        .select('*')
        .eq('schedule_id', scheduleId)
        .order('date', { ascending: true });

      if (shiftError) throw shiftError;
      if (!shifts || shifts.length === 0) return [];

      // Get all assignments for these shifts with employee info
      const shiftIds = shifts.map(s => s.id);

      const { data: assignments, error: assignError } = await supabase
  .from('shift_assignments')
  .select(`
    shift_id,
    employee_id,
    employee:employee_id (
      id,
      user_id,
      user:user_id (
        id,
        first_name,
        last_name,
        email
      )
    )
  `)
  .in('shift_id', shiftIds);

      if (assignError) throw assignError;

      // Merge assignments into shifts
      const shiftsWithEmployees = shifts.map(shift => ({
  ...shift,
  employees: (assignments || [])
    .filter(a => a.shift_id === shift.id)
    .map(a => ({
      employee_id: a.employee_id,
      first_name: (a.employee as any)?.user?.first_name,
      last_name: (a.employee as any)?.user?.last_name,
      email: (a.employee as any)?.user?.email
    }))
}));

      console.log('✅ Shifts retrieved:', shifts.length);
      return shiftsWithEmployees;
    } catch (error: any) {
      console.error('❌ Error getting shifts:', error.message);
      throw error;
    }
  }

  // Assign one or more employees to an existing shift
  static async assignEmployeesToShift(shiftId: string, employeeIds: string[]) {
    try {
      console.log('👤 Assigning', employeeIds.length, 'employees to shift:', shiftId);

      const assignments = employeeIds.map(employeeId => ({
        shift_id: shiftId,
        employee_id: employeeId
      }));

      // upsert to avoid duplicate errors
      const { error } = await supabase
        .from('shift_assignments')
        .upsert(assignments, { onConflict: 'shift_id,employee_id' });

      if (error) throw error;

      // Update shift status
      await supabase
        .from('shifts')
        .update({ status: 'assigned', updated_at: new Date().toISOString() })
        .eq('id', shiftId);

      console.log('✅ Employees assigned');
      return true;
    } catch (error: any) {
      console.error('❌ Error assigning employees:', error.message);
      throw error;
    }
  }

  // Remove one employee from a shift
  static async unassignEmployeeFromShift(shiftId: string, employeeId: string) {
    try {
      console.log('❌ Unassigning employee from shift:', shiftId);

      const { error } = await supabase
        .from('shift_assignments')
        .delete()
        .eq('shift_id', shiftId)
        .eq('employee_id', employeeId);

      if (error) throw error;

      // Check if any employees remain
      const { data: remaining } = await supabase
        .from('shift_assignments')
        .select('id')
        .eq('shift_id', shiftId);

      if (!remaining || remaining.length === 0) {
        await supabase
          .from('shifts')
          .update({ status: 'unassigned', updated_at: new Date().toISOString() })
          .eq('id', shiftId);
      }

      console.log('✅ Employee unassigned');
      return true;
    } catch (error: any) {
      console.error('❌ Error unassigning employee:', error.message);
      throw error;
    }
  }

  static async deleteShift(shiftId: string) {
    try {
      console.log('Deleting shift:', shiftId);

      // Assignments auto-delete via CASCADE
      const { error } = await supabase
        .from('shifts')
        .delete()
        .eq('id', shiftId);

      if (error) throw error;

      console.log('✅ Shift deleted');
      return true;
    } catch (error: any) {
      console.error('Error deleting shift:', error.message);
      throw error;
    }
  }

  static async updateShift(shiftId: string, updates: Partial<any>) {
    try {
      const { data, error } = await supabase
        .from('shifts')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', shiftId)
        .select();

      if (error) throw error;
      return data?.[0];
    } catch (error: any) {
      console.error('Error updating shift:', error.message);
      throw error;
    }
  }
}