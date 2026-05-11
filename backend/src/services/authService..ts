import { supabase } from '../config/supabase';
import * as jwt from 'jsonwebtoken';

export class AuthService {
  
  // Register a new OWNER (creates company)
  async registerOwner(email: string, password: string, firstName: string, lastName: string, companyName: string) {
    try {
      console.log('📝 Registering owner:', email);

      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
      });

      if (authError) {
        console.error('❌ Auth error:', authError.message);
        throw authError;
      }

      console.log('✅ User created in Supabase Auth');

      // Create company
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .insert([
          {
            name: companyName,
            owner_id: authData.user.id,
            subscription_plan: 'free'
          }
        ])
        .select()
        .single();

      if (companyError) {
        console.error('❌ Company error:', companyError.message);
        throw companyError;
      }

      console.log('✅ Company created');

      // Create user record
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert([
          {
            id: authData.user.id,
            email: email,
            first_name: firstName,
            last_name: lastName,
            company_id: companyData.id,
            role: 'owner'
          }
        ])
        .select()
        .single();

      if (userError) {
        console.error('❌ User error:', userError.message);
        throw userError;
      }

      console.log('✅ User created');

      return {
        success: true,
        user: userData,
        company: companyData,
        message: 'Owner registered successfully!'
      };

    } catch (error: any) {
      console.error('❌ Register failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Login user
  async login(email: string, password: string) {
    try {
      console.log('🔐 Logging in user:', email);

      // Authenticate with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) {
        console.error('❌ Login error:', authError.message);
        throw new Error('Invalid email or password');
      }

      console.log('✅ User authenticated');

      // Get user from database
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (userError) {
        console.error('❌ User error:', userError.message);
        throw userError;
      }

      console.log('✅ User found');

      // Get company info
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', userData.company_id)
        .single();

      if (companyError) {
        console.error('❌ Company error:', companyError.message);
        throw companyError;
      }

      console.log('✅ Company found');

      // Create JWT token
      const token = jwt.sign(
        {
          userId: userData.id,
          email: userData.email,
          companyId: userData.company_id,
          role: userData.role
        },
        'your-secret-key-change-this',
        { expiresIn: '30d' }
      );

      console.log('✅ JWT token created');

      return {
        success: true,
        token: token,
        user: {
          id: userData.id,
          email: userData.email,
          firstName: userData.first_name,
          lastName: userData.last_name,
          role: userData.role,
          companyId: userData.company_id
        },
        company: companyData
      };

    } catch (error: any) {
      console.error('❌ Login failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export const authService = new AuthService();