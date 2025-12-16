import express from 'express';
import { body, query, validationResult } from 'express-validator';
import Employee from '../models/Employee';
import User from '../models/User';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get all employees with pagination and filtering
router.get('/', authenticate, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('department').optional().isString(),
  query('status').optional().isIn(['active', 'inactive', 'terminated', 'on-leave']),
  query('search').optional().isString(),
], async (req: AuthRequest, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter: any = {};
    
    if (req.query.department) {
      filter['professionalInfo.department'] = req.query.department;
    }
    
    if (req.query.status) {
      filter.status = req.query.status;
    }

    // Search functionality
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search as string, 'i');
      filter.$or = [
        { 'personalInfo.firstName': searchRegex },
        { 'personalInfo.lastName': searchRegex },
        { 'personalInfo.email': searchRegex },
        { employeeId: searchRegex },
        { 'professionalInfo.position': searchRegex },
      ];
    }

    const employees = await Employee.find(filter)
      .populate('userId', 'email isActive lastLogin')
      .populate('professionalInfo.reportingManager', 'personalInfo.firstName personalInfo.lastName employeeId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Employee.countDocuments(filter);

    res.json({
      success: true,
      data: {
        employees,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
          limit,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Get employee by ID
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate('userId', 'email isActive lastLogin createdAt')
      .populate('professionalInfo.reportingManager', 'personalInfo.firstName personalInfo.lastName employeeId');

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    // Check if user can access this employee data
    const user = req.user!;
    if (user.role === 'employee' && employee.userId.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    res.json({
      success: true,
      data: { employee },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Create new employee
router.post('/', authenticate, authorize('admin', 'hr'), [
  body('personalInfo.firstName').trim().isLength({ min: 1 }),
  body('personalInfo.lastName').trim().isLength({ min: 1 }),
  body('personalInfo.email').isEmail().normalizeEmail(),
  body('personalInfo.phone').isLength({ min: 10 }),
  body('personalInfo.dateOfBirth').isISO8601(),
  body('personalInfo.gender').isIn(['male', 'female', 'other']),
  body('professionalInfo.department').isIn(['HR', 'Engineering', 'Marketing', 'Sales', 'Finance', 'Operations', 'Legal', 'IT']),
  body('professionalInfo.position').trim().isLength({ min: 1 }),
  body('professionalInfo.startDate').isISO8601(),
  body('professionalInfo.salary.basic').isNumeric({ min: 0 }),
], async (req: AuthRequest, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { personalInfo, professionalInfo, createUserAccount = true } = req.body;

    let userId = null;

    // Create user account if requested
    if (createUserAccount) {
      // Check if user already exists
      const existingUser = await User.findOne({ email: personalInfo.email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User already exists with this email',
        });
      }

      // Create user account
      const user = new User({
        email: personalInfo.email,
        password: 'temp123456', // Temporary password
        firstName: personalInfo.firstName,
        lastName: personalInfo.lastName,
        role: 'employee',
      });

      await user.save();
      userId = user._id;
    }

    // Create employee
    const employee = new Employee({
      userId,
      personalInfo,
      professionalInfo,
    });

    await employee.save();

    // Update user with employee ID
    if (userId) {
      await User.findByIdAndUpdate(userId, { employeeId: employee.employeeId });
    }

    const populatedEmployee = await Employee.findById(employee._id)
      .populate('userId', 'email isActive')
      .populate('professionalInfo.reportingManager', 'personalInfo.firstName personalInfo.lastName employeeId');

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: { employee: populatedEmployee },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Update employee
router.put('/:id', authenticate, authorize('admin', 'hr'), async (req: AuthRequest, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    const updatedEmployee = await Employee.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('userId', 'email isActive')
     .populate('professionalInfo.reportingManager', 'personalInfo.firstName personalInfo.lastName employeeId');

    res.json({
      success: true,
      message: 'Employee updated successfully',
      data: { employee: updatedEmployee },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Delete employee
router.delete('/:id', authenticate, authorize('admin'), async (req: AuthRequest, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    // Soft delete - update status to terminated
    await Employee.findByIdAndUpdate(req.params.id, { status: 'terminated' });

    // Deactivate user account if exists
    if (employee.userId) {
      await User.findByIdAndUpdate(employee.userId, { isActive: false });
    }

    res.json({
      success: true,
      message: 'Employee deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Get employee statistics
router.get('/stats/overview', authenticate, authorize('admin', 'hr'), async (req: AuthRequest, res) => {
  try {
    const totalEmployees = await Employee.countDocuments();
    const activeEmployees = await Employee.countDocuments({ status: 'active' });
    const inactiveEmployees = await Employee.countDocuments({ status: 'inactive' });
    const terminatedEmployees = await Employee.countDocuments({ status: 'terminated' });

    // Department-wise count
    const departmentStats = await Employee.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$professionalInfo.department', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Employment type stats
    const employmentTypeStats = await Employee.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$professionalInfo.employmentType', count: { $sum: 1 } } },
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          total: totalEmployees,
          active: activeEmployees,
          inactive: inactiveEmployees,
          terminated: terminatedEmployees,
        },
        departmentStats,
        employmentTypeStats,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

export default router;