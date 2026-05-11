import { Router, Request, Response } from 'express';
import { authService } from '../services/authService.';

const router = Router();

// POST /api/auth/register-owner
router.post('/register-owner', async (req: Request, res: Response) => {
  try {
    console.log('📝 Register owner request received');
    
    const { email, password, firstName, lastName, companyName } = req.body;

    if (!email || !password || !firstName || !lastName || !companyName) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, firstName, lastName, and companyName are required!'
      });
    }

    const result = await authService.registerOwner(email, password, firstName, lastName, companyName);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    console.log('✅ Owner registration successful');
    return res.status(201).json({
      success: true,
      user: result.user,
      company: result.company,
      message: 'Owner registered successfully'
    });

  } catch (error: any) {
    console.error('❌ Server error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    console.log('📥 Login request received');
    
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password required'
      });
    }

    const result = await authService.login(email, password);

    if (!result.success) {
      return res.status(401).json({
        success: false,
        error: result.error
      });
    }

    console.log('✅ Login successful');
    return res.json({
      success: true,
      token: result.token,
      user: result.user,
      company: result.company
    });

  } catch (error: any) {
    console.error('❌ Server error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

export default router;