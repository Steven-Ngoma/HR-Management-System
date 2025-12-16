import express from 'express';
import { body, query, validationResult } from 'express-validator';
import Payroll from '../models/Payroll';
import Employee from '../models/Employee';
import Attendance from '../models/Attendance';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get payroll records
router.get('/', authenticate, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('month').optional().isInt({ min: 1, max: 12 }),
  query('year').optional().isInt({ min: 2020 }),
  query('employeeId').optional().isMongoId(),
  query('status').optional().isIn(['draft', 'processed', 'paid', 'cancelled']),
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

    const user = req.user!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Build filter
    const filter: any = {};

    // If employee role, only show their own records
    if (user.role === 'employee') {
      const employee = await Employee.findOne({ userId: user._id });
      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee record not found',
        });
      }
      filter.employeeId = employee._id;
    } else if (req.query.employeeId) {
      filter.employeeId = req.query.employeeId;
    }

    if (req.query.month) {
      filter['payPeriod.month'] = parseInt(req.query.month as string);
    }

    if (req.query.year) {
      filter['payPeriod.year'] = parseInt(req.query.year as string);
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const payrollRecords = await Payroll.find(filter)
      .populate('employeeId', 'personalInfo.firstName personalInfo.lastName employeeId professionalInfo.department')
      .populate('processedBy', 'firstName lastName')
      .sort({ 'payPeriod.year': -1, 'payPeriod.month': -1 })
      .skip(skip)
      .limit(limit);

    const total = await Payroll.countDocuments(filter);

    res.json({
      success: true,
      data: {
        payroll: payrollRecords,
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

// Generate payroll for a specific month
router.post('/generate', authenticate, authorize('admin', 'hr'), [
  body('month').isInt({ min: 1, max: 12 }),
  body('year').isInt({ min: 2020 }),
  body('employeeIds').optional().isArray(),
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

    const { month, year, employeeIds } = req.body;
    const user = req.user!;

    // Build employee filter
    const employeeFilter: any = { status: 'active' };
    if (employeeIds && employeeIds.length > 0) {
      employeeFilter._id = { $in: employeeIds };
    }

    const employees = await Employee.find(employeeFilter);

    if (employees.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No active employees found',
      });
    }

    // Calculate pay period dates
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const generatedPayrolls = [];
    const errors: any[] = [];

    for (const employee of employees) {
      try {
        // Check if payroll already exists
        const existingPayroll = await Payroll.findOne({
          employeeId: employee._id,
          'payPeriod.month': month,
          'payPeriod.year': year,
        });

        if (existingPayroll) {
          errors.push({
            employeeId: employee.employeeId,
            message: 'Payroll already exists for this period',
          });
          continue;
        }

        // Get attendance data for the month
        const attendanceRecords = await Attendance.find({
          employeeId: employee._id,
          date: { $gte: startDate, $lte: endDate },
        });

        // Calculate working days and present days
        const workingDays = attendanceRecords.length;
        const presentDays = attendanceRecords.filter(
          att => ['present', 'late', 'half-day'].includes(att.status)
        ).length;

        // Calculate overtime hours
        const overtimeHours = attendanceRecords.reduce(
          (total, att) => total + (att.overtimeHours || 0), 0
        );

        // Calculate earnings
        const basicSalary = employee.professionalInfo.salary.basic;
        const allowances = employee.professionalInfo.salary.allowances;
        const overtimeRate = basicSalary / (30 * 8); // Assuming 30 days, 8 hours per day
        const overtimePay = overtimeHours * overtimeRate * 1.5; // 1.5x rate for overtime

        // Calculate deductions (simplified)
        const taxRate = 0.15; // 15% tax
        const socialSecurityRate = 0.062; // 6.2%
        const healthInsuranceRate = 0.05; // 5%

        const grossEarnings = basicSalary + allowances + overtimePay;
        const tax = grossEarnings * taxRate;
        const socialSecurity = grossEarnings * socialSecurityRate;
        const healthInsurance = grossEarnings * healthInsuranceRate;

        // Create payroll record
        const payroll = new Payroll({
          employeeId: employee._id,
          payPeriod: {
            startDate,
            endDate,
            month,
            year,
          },
          earnings: {
            basicSalary,
            allowances,
            overtime: overtimePay,
            bonus: 0,
            total: grossEarnings,
          },
          deductions: {
            tax,
            socialSecurity,
            healthInsurance,
            other: 0,
            total: tax + socialSecurity + healthInsurance,
          },
          netSalary: grossEarnings - (tax + socialSecurity + healthInsurance),
          workingDays,
          presentDays,
          overtimeHours,
          status: 'draft',
          processedBy: user._id,
        });

        await payroll.save();
        generatedPayrolls.push(payroll);

      } catch (error: any) {
        errors.push({
          employeeId: employee.employeeId,
          message: error.message,
        });
      }
    }

    res.json({
      success: true,
      message: `Payroll generated for ${generatedPayrolls.length} employees`,
      data: {
        generated: generatedPayrolls.length,
        errors: errors.length,
        payrolls: generatedPayrolls,
        errorDetails: errors,
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

// Get payroll by ID
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id)
      .populate('employeeId', 'personalInfo.firstName personalInfo.lastName employeeId professionalInfo')
      .populate('processedBy', 'firstName lastName');

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found',
      });
    }

    // Check if user can access this payroll data
    const user = req.user!;
    if (user.role === 'employee') {
      const employee = await Employee.findOne({ userId: user._id });
      if (!employee || payroll.employeeId._id.toString() !== employee._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }
    }

    res.json({
      success: true,
      data: { payroll },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Update payroll status
router.put('/:id/status', authenticate, authorize('admin', 'hr'), [
  body('status').isIn(['draft', 'processed', 'paid', 'cancelled']),
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

    const { status } = req.body;
    const user = req.user!;

    const payroll = await Payroll.findById(req.params.id);
    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll record not found',
      });
    }

    payroll.status = status;
    payroll.processedBy = user._id;

    await payroll.save();

    const updatedPayroll = await Payroll.findById(payroll._id)
      .populate('employeeId', 'personalInfo.firstName personalInfo.lastName employeeId')
      .populate('processedBy', 'firstName lastName');

    res.json({
      success: true,
      message: 'Payroll status updated successfully',
      data: { payroll: updatedPayroll },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Get payroll summary
router.get('/summary/stats', authenticate, authorize('admin', 'hr'), [
  query('month').optional().isInt({ min: 1, max: 12 }),
  query('year').optional().isInt({ min: 2020 }),
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

    const currentDate = new Date();
    const month = parseInt(req.query.month as string) || currentDate.getMonth() + 1;
    const year = parseInt(req.query.year as string) || currentDate.getFullYear();

    // Get payroll summary for the specified month
    const payrollSummary = await Payroll.aggregate([
      {
        $match: {
          'payPeriod.month': month,
          'payPeriod.year': year,
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalGrossEarnings: { $sum: '$earnings.total' },
          totalDeductions: { $sum: '$deductions.total' },
          totalNetSalary: { $sum: '$netSalary' },
        },
      },
    ]);

    // Get department-wise payroll
    const departmentPayroll = await Payroll.aggregate([
      {
        $match: {
          'payPeriod.month': month,
          'payPeriod.year': year,
        },
      },
      {
        $lookup: {
          from: 'employees',
          localField: 'employeeId',
          foreignField: '_id',
          as: 'employee',
        },
      },
      {
        $unwind: '$employee',
      },
      {
        $group: {
          _id: '$employee.professionalInfo.department',
          count: { $sum: 1 },
          totalPayroll: { $sum: '$netSalary' },
        },
      },
      {
        $sort: { totalPayroll: -1 },
      },
    ]);

    res.json({
      success: true,
      data: {
        period: { month, year },
        summary: payrollSummary,
        departmentBreakdown: departmentPayroll,
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