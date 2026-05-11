import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

export class EmployeeController {
  
  // Get all employees for a company
  static async getEmployees(req: Request, res: Response) {
  try {
    console.log('Get employees request');
    
    const { companyId } = req.query;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        error: 'companyId is required'
      });
    }

    // Get employees
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (empError) {
      console.error('Database error:', empError.message);
      throw empError;
    }

    // Get users separately
    const employeeIds = employees?.map(e => e.user_id) || [];
    let usersMap: any = {};

    if (employeeIds.length > 0) {
      const { data: userData } = await supabase
        .from('users')
        .select('id, email, first_name, last_name')
        .in('id', employeeIds);

      userData?.forEach(user => {
        usersMap[user.id] = user;
      });
    }

    // Merge data
    const employeesWithUsers = employees?.map(emp => ({
      ...emp,
      user: usersMap[emp.user_id] || null
    })) || [];

    console.log('✅ Employees retrieved:', employeesWithUsers.length);

    return res.json({
      success: true,
      data: employeesWithUsers
    });

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

  // Get single employee
  static async getEmployee(req: Request, res: Response) {
    try {
      console.log('📥 Get employee request:', req.params.id);

      const { id } = req.params;

      const { data, error } = await supabase
        .from('employees')
        .select(`
          id,
          company_id,
          user_id,
          position,
          phone,
          created_at,
          users:user_id (
            id,
            email,
            first_name,
            last_name
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('❌ Database error:', error.message);
        throw error;
      }

      console.log('✅ Employee found');

      return res.json({
        success: true,
        data
      });

    } catch (error: any) {
      console.error('❌ Error:', error.message);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Create employee
  static async createEmployee(req: Request, res: Response) {
    try {
      console.log('📝 Create employee request');

      const { company_id, user_id, position, phone } = req.body;

      if (!company_id || !user_id || !position || !phone) {
        return res.status(400).json({
          success: false,
          error: 'All fields are required'
        });
      }

      const { data, error } = await supabase
        .from('employees')
        .insert([
          {
            company_id,
            user_id,
            position,
            phone
          }
        ])
        .select();

      if (error) {
        console.error('❌ Database error:', error.message);
        throw error;
      }

      console.log('✅ Employee created');

      return res.status(201).json({
        success: true,
        data: data?.[0]
      });

    } catch (error: any) {
      console.error('❌ Error:', error.message);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Update employee
  static async updateEmployee(req: Request, res: Response) {
    try {
      console.log('✏️ Update employee request:', req.params.id);

      const { id } = req.params;
      const { position, phone } = req.body;

      const { data, error } = await supabase
        .from('employees')
        .update({ position, phone })
        .eq('id', id)
        .select();

      if (error) {
        console.error('❌ Database error:', error.message);
        throw error;
      }

      console.log('✅ Employee updated');

      return res.json({
        success: true,
        data: data?.[0]
      });

    } catch (error: any) {
      console.error('❌ Error:', error.message);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Delete employee
  static async deleteEmployee(req: Request, res: Response) {
    try {
      console.log('🗑️ Delete employee request:', req.params.id);

      const { id } = req.params;

      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Database error:', error.message);
        throw error;
      }

      console.log('✅ Employee deleted');

      return res.json({
        success: true,
        message: 'Employee deleted successfully'
      });

    } catch (error: any) {
      console.error('❌ Error:', error.message);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Invite employee
  static async inviteEmployee(req: Request, res: Response) {
  try {
    console.log('📧 Invite employee request');

    const { company_id, email, position } = req.body;
    const invitingUser = (req as any).user;

    if (!company_id || !email || !position) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required'
      });
    }

    // Check if invitation already exists and is not used
    const { data: existingInvite } = await supabase
      .from('invitations')
      .select('*')
      .eq('email', email)
      .eq('company_id', company_id)
      .eq('used', false)
      .single();

    // if (existingInvite && new Date(existingInvite.expires_at) > new Date()) {
    //   return res.status(400).json({
    //     success: false,
    //     error: 'An active invitation already exists for this email'
    //   });
    // }

    // Generate secure token (32 bytes)
    const crypto = require('crypto');
    const invitationToken = crypto.randomBytes(32).toString('hex');

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create invitation in database
    const { data: invitation, error: inviteError } = await supabase
      .from('invitations')
      .insert([
        {
          company_id,
          email,
          role: 'employee',
          invitation_token: invitationToken,
          expires_at: expiresAt.toISOString(),
          used: false
        }
      ])
      .select();

    if (inviteError) {
      console.error('❌ Database error:', inviteError.message);
      throw inviteError;
    }

    // Get company info
    const { data: company } = await supabase
      .from('companies')
      .select('name')
      .eq('id', company_id)
      .single();

    // Send invitation email via Resend
    const { EmailService } = await import('../services/emailService');
    await EmailService.sendInvitationEmail(
      email,
      invitationToken,
      company?.name || 'Your Company',
      invitingUser?.first_name || 'A team member'
    );

    console.log('✅ Invitation created and email sent to:', email);

    return res.status(201).json({
      success: true,
      data: invitation?.[0],
      message: `Invitation sent to ${email}`
    });

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
}