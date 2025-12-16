import express from 'express';
import { body, query, validationResult } from 'express-validator';
import Attendance from '../models/Attendance';
import Employee from '../models/Employee';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Clock in
router.post('/checkin', authenticate, [
  body('location').optional().isString(),
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
    const { location } = req.body;

    // Get employee record
    const employee = await Employee.findOne({ userId: user._id });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee record not found',
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already checked in today
    const existingAttendance = await Attendance.findOne({
      employeeId: employee._id,
      date: today,
    });

    if (existingAttendance && existingAttendance.checkIn) {
      return res.status(400).json({
        success: false,
        message: 'Already checked in today',
        data: { attendance: existingAttendance },
      });
    }

    const checkInTime = new Date();
    
    // Create or update attendance record
    const attendance = existingAttendance || new Attendance({
      employeeId: employee._id,
      date: today,
    });

    attendance.checkIn = checkInTime;
    attendance.status = 'present';
    
    if (location) {
      attendance.location = {
        checkInLocation: location,
      };
    }

    await attendance.save();

    res.json({
      success: true,
      message: 'Checked in successfully',
      data: { attendance },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Clock out
router.post('/checkout', authenticate, [
  body('location').optional().isString(),
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
    const { location } = req.body;

    // Get employee record
    const employee = await Employee.findOne({ userId: user._id });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee record not found',
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find today's attendance record
    const attendance = await Attendance.findOne({
      employeeId: employee._id,
      date: today,
    });

    if (!attendance || !attendance.checkIn) {
      return res.status(400).json({
        success: false,
        message: 'No check-in record found for today',
      });
    }

    if (attendance.checkOut) {
      return res.status(400).json({
        success: false,
        message: 'Already checked out today',
        data: { attendance },
      });
    }

    attendance.checkOut = new Date();
    
    if (location) {
      attendance.location = {
        ...attendance.location,
        checkOutLocation: location,
      };
    }

    await attendance.save();

    res.json({
      success: true,
      message: 'Checked out successfully',
      data: { attendance },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// Get attendance records
router.get('/', authenticate, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('employeeId').optional().isMongoId(),
  query('status').optional().isIn(['present', 'absent', 'late', 'half-day', 'holiday', 'leave']),
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

    // Date range filter
    if (req.query.startDate || req.query.endDate) {
      filter.date = {};
      if (req.query.startDate) {
        filter.date.$gte = new Date(req.query.startDate as string);
      }
      if (req.query.endDate) {
        filter.date.$lte = new Date(req.query.endDate as string);
      }
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const attendanceRecords = await Attendance.find(filter)
      .populate('employeeId', 'personalInfo.firstName personalInfo.lastName employeeId')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Attendance.countDocuments(filter);

    res.json({
      success: true,
      data: {
        attendance: attendanceRecords,
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

// Get today's attendance status
router.get('/today', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = req.user!;

    // Get employee record
    const employee = await Employee.findOne({ userId: user._id });
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee record not found',
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      employeeId: employee._id,
      date: today,
    });

    res.json({
      success: true,
      data: {
        attendance: attendance || null,
        canCheckIn: !attendance || !attendance.checkIn,
        canCheckOut: attendance && attendance.checkIn && !attendance.checkOut,
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

// Get attendance report
router.get('/report', authenticate, authorize('admin', 'hr'), [
  query('startDate').isISO8601(),
  query('endDate').isISO8601(),
  query('department').optional().isString(),
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

    const { startDate, endDate, department } = req.query;

    // Build employee filter
    const employeeFilter: any = { status: 'active' };
    if (department) {
      employeeFilter['professionalInfo.department'] = department;
    }

    const employees = await Employee.find(employeeFilter);
    const employeeIds = employees.map(emp => emp._id);

    // Get attendance data
    const attendanceData = await Attendance.aggregate([
      {
        $match: {
          employeeId: { $in: employeeIds },
          date: {
            $gte: new Date(startDate as string),
            $lte: new Date(endDate as string),
          },
        },
      },
      {
        $group: {
          _id: '$employeeId',
          totalDays: { $sum: 1 },
          presentDays: {
            $sum: {
              $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0],
            },
          },
          lateDays: {
            $sum: {
              $cond: [{ $eq: ['$status', 'late'] }, 1, 0],
            },
          },
          absentDays: {
            $sum: {
              $cond: [{ $eq: ['$status', 'absent'] }, 1, 0],
            },
          },
          totalWorkingHours: { $sum: '$workingHours' },
          totalOvertimeHours: { $sum: '$overtimeHours' },
        },
      },
    ]);

    // Combine with employee data
    const report = employees.map(employee => {
      const attendance = attendanceData.find(
        att => att._id.toString() === employee._id.toString()
      );

      return {
        employee: {
          id: employee._id,
          employeeId: employee.employeeId,
          name: employee.getFullName(),
          department: employee.professionalInfo.department,
          position: employee.professionalInfo.position,
        },
        attendance: attendance || {
          totalDays: 0,
          presentDays: 0,
          lateDays: 0,
          absentDays: 0,
          totalWorkingHours: 0,
          totalOvertimeHours: 0,
        },
      };
    });

    res.json({
      success: true,
      data: {
        report,
        summary: {
          totalEmployees: employees.length,
          dateRange: { startDate, endDate },
          department: department || 'All Departments',
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

// Mark attendance manually (for HR/Admin)
router.post('/mark', authenticate, authorize('admin', 'hr'), [
  body('employeeId').isMongoId(),
  body('date').isISO8601(),
  body('status').isIn(['present', 'absent', 'late', 'half-day', 'holiday', 'leave']),
  body('notes').optional().isString(),
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

    const { employeeId, date, status, notes } = req.body;

    // Check if employee exists
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found',
      });
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    // Check if attendance already exists
    let attendance = await Attendance.findOne({
      employeeId,
      date: attendanceDate,
    });

    if (attendance) {
      // Update existing record
      attendance.status = status;
      if (notes) attendance.notes = notes;
    } else {
      // Create new record
      attendance = new Attendance({
        employeeId,
        date: attendanceDate,
        status,
        notes,
      });
    }

    await attendance.save();

    const populatedAttendance = await Attendance.findById(attendance._id)
      .populate('employeeId', 'personalInfo.firstName personalInfo.lastName employeeId');

    res.json({
      success: true,
      message: 'Attendance marked successfully',
      data: { attendance: populatedAttendance },
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