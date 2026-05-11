import { Router } from 'express';
import { EmployeeController } from '../controllers/employeeController';

const router = Router();

// Get all employees for a company
router.get('/', EmployeeController.getEmployees);

// Get single employee
router.get('/:id', EmployeeController.getEmployee);

// Create employee
router.post('/', EmployeeController.createEmployee);

// Update employee
router.put('/:id', EmployeeController.updateEmployee);

// Delete employee
router.delete('/:id', EmployeeController.deleteEmployee);

// Invite employee
router.post('/invite', EmployeeController.inviteEmployee);

export default router;