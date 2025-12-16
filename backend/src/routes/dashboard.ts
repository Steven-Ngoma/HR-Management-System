import express from 'express';
import { query, validationResult } from 'express-validator';
import Employee from '../models/Employee';
import Attendance from '../models/Attendance';
import Payroll from '../models/Payroll';
import User from '../models/User';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get dashboard overview statistics
router.get('/overview', authenticate, authorize('admin', 'hr'), async (req: AuthRequest, res) => {
  try {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Employee statistics
    const totalEmployees = await Employee.countDocuments({ status: 'active' });
    const newEmployeesThisMonth = await Employee.countDocuments({
      status: 'active',
      createdAt: {
        $gte: new Date(currentYear, currentMonth - 1, 1),
        $lt: new Date(currentYear, currentMonth, 1),
      },
    });

    // Attendance statistics for today
    const todayAttendance = await Attendance.aggregate([
      {
        $match: {
          date: today,
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const attendanceStats = {
      present: 0,
      absent: 0,
      late: 0,
      onLeave: 0,
    };

    todayAttendance.forEach(stat => {
      switch (stat._id) {
        case 'present':
          attendanceStats.present = stat.count;
          break;
        case 'absent':
          attendanceStats.absent = stat.count;
          break;
        case 'late':
          attendanceStats.late = stat.count;
          break;
        case 'leave':
          attendanceStats.onLeave = stat.count;
          break;
      }
    });

    // Payroll statistics for current month
    const payrollStats = await Payroll.aggregate([
      {
        $match: {
          'payPeriod.month': currentMonth,
          'payPeriod.year': currentYear,
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$netSalary' },
        },
      },
    ]);

    // Department distribution
    const departmentStats = await Employee.aggregate([
      {
        $match: { status: 'active' },
      },
      {
        $group: {
          _id: '$professionalInfo.department',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    // Recent activities (last 10 employees)
    const recentEmployees = await Employee.find({ status: 'active' })
      .populate('userId', 'createdAt')
      .sort({ createdAt: -1 })
      .limit(10)
      .select('personalInfo.firstName personalInfo.lastName employeeId professionalInfo.department createdAt');

    res.json({
      success: true,
      data: {
        employees: {
          total: totalEmployees,
          newThisMonth: newEmployeesThisMonth,
        },
        attendance: {
          today: attendanceStats,
          totalCheckedIn: attendanceStats.present + attendanceStats.late,
        },
        payroll: payrollStats,
        departments: departmentStats,
        recentEmployees,
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

// Get attendance trends
router.get('/attendance-trends', authenticate, authorize('admin', 'hr'), [
  query('days').optional().isInt({ min: 7, max: 90 }),
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

    const days = parseInt(req.query.days as string) || 30;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const attendanceTrends = await Attendance.aggregate([
      {
        $match: {
          date: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
      {
        $group: {
          _id: {
            date: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$date',
              },
            },
            status: '$status',
          },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: '$_id.date',
          statusCounts: {
            $push: {
              status: '$_id.status',
              count: '$count',
            },
          },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    res.json({
      success: true,
      data: {
        trends: attendanceTrends,
        period: {
          startDate,
          endDate,
          days,
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

// Get employee performance metrics
router.get('/employee-metrics', authenticate, authorize('admin', 'hr'), [
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

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const employeeMetrics = await Employee.aggregate([
      {
        $match: { status: 'active' },
      },
      {
        $lookup: {
          from: 'attendances',
          let: { employeeId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$employeeId', '$$employeeId'] },
                date: { $gte: startDate, $lte: endDate },
              },
            },
          ],
          as: 'attendance',
        },
      },
      {
        $addFields: {
          totalDays: { $size: '$attendance' },
          presentDays: {
            $size: {
              $filter: {
                input: '$attendance',
                cond: { $in: ['$$this.status', ['present', 'late']] },
              },
            },
          },
          lateDays: {
            $size: {
              $filter: {
                input: '$attendance',
                cond: { $eq: ['$$this.status', 'late'] },
              },
            },
          },
          totalWorkingHours: {
            $sum: '$attendance.workingHours',
          },
          totalOvertimeHours: {
            $sum: '$attendance.overtimeHours',
          },
        },
      },
      {
        $addFields: {
          attendanceRate: {
            $cond: [
              { $eq: ['$totalDays', 0] },
              0,
              { $multiply: [{ $divide: ['$presentDays', '$totalDays'] }, 100] },
            ],
          },
          punctualityRate: {
            $cond: [
              { $eq: ['$presentDays', 0] },
              100,
              {
                $multiply: [
                  { $divide: [{ $subtract: ['$presentDays', '$lateDays'] }, '$presentDays'] },
                  100,
                ],
              },
            ],
          },
        },
      },
      {
        $project: {
          employeeId: 1,
          'personalInfo.firstName': 1,
          'personalInfo.lastName': 1,
          'professionalInfo.department': 1,
          'professionalInfo.position': 1,
          totalDays: 1,
          presentDays: 1,
          lateDays: 1,
          totalWorkingHours: 1,
          totalOvertimeHours: 1,
          attendanceRate: { $round: ['$attendanceRate', 2] },
          punctualityRate: { $round: ['$punctualityRate', 2] },
        },
      },
      {
        $sort: { attendanceRate: -1 },
      },
    ]);

    res.json({
      success: true,
      data: {
        metrics: employeeMetrics,
        period: { month, year },
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

// Get payroll analytics
router.get('/payroll-analytics', authenticate, authorize('admin', 'hr'), [
  query('months').optional().isInt({ min: 1, max: 12 }),
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

    const months = parseInt(req.query.months as string) || 6;
    const currentDate = new Date();
    const endMonth = currentDate.getMonth() + 1;
    const endYear = currentDate.getFullYear();

    // Generate month range
    const monthRange = [];
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(endYear, endMonth - 1 - i, 1);
      monthRange.push({
        month: date.getMonth() + 1,
        year: date.getFullYear(),
      });
    }

    const payrollAnalytics = await Payroll.aggregate([
      {
        $match: {
          $or: monthRange.map(({ month, year }) => ({
            'payPeriod.month': month,
            'payPeriod.year': year,
          })),
        },
      },
      {
        $group: {
          _id: {
            month: '$payPeriod.month',
            year: '$payPeriod.year',
          },
          totalEmployees: { $sum: 1 },
          totalGrossEarnings: { $sum: '$earnings.total' },
          totalDeductions: { $sum: '$deductions.total' },
          totalNetSalary: { $sum: '$netSalary' },
          averageSalary: { $avg: '$netSalary' },
        },
      },
      {
        $sort: {
          '_id.year': 1,
          '_id.month': 1,
        },
      },
    ]);

    // Department-wise payroll for current month
    const departmentPayroll = await Payroll.aggregate([
      {
        $match: {
          'payPeriod.month': endMonth,
          'payPeriod.year': endYear,
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
          employeeCount: { $sum: 1 },
          totalPayroll: { $sum: '$netSalary' },
          averageSalary: { $avg: '$netSalary' },
        },
      },
      {
        $sort: { totalPayroll: -1 },
      },
    ]);

    res.json({
      success: true,
      data: {
        monthlyTrends: payrollAnalytics,
        departmentBreakdown: departmentPayroll,
        period: {
          months,
          endMonth,
          endYear,
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

// Get user activity summary (for employee dashboard)
router.get('/my-summary', authenticate, async (req: AuthRequest, res) => {
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

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Today's attendance
    const todayAttendance = await Attendance.findOne({
      employeeId: employee._id,
      date: today,
    });

    // This month's attendance summary
    const monthStart = new Date(currentYear, currentMonth - 1, 1);
    const monthEnd = new Date(currentYear, currentMonth, 0);

    const monthlyAttendance = await Attendance.aggregate([
      {
        $match: {
          employeeId: employee._id,
          date: { $gte: monthStart, $lte: monthEnd },
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalHours: { $sum: '$workingHours' },
          totalOvertime: { $sum: '$overtimeHours' },
        },
      },
    ]);

    // Current month payroll
    const currentPayroll = await Payroll.findOne({
      employeeId: employee._id,
      'payPeriod.month': currentMonth,
      'payPeriod.year': currentYear,
    });

    // Recent attendance (last 7 days)
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    
    const recentAttendance = await Attendance.find({
      employeeId: employee._id,
      date: { $gte: weekStart },
    }).sort({ date: -1 });

    res.json({
      success: true,
      data: {
        employee: {
          id: employee._id,
          employeeId: employee.employeeId,
          name: employee.getFullName(),
          department: employee.professionalInfo.department,
          position: employee.professionalInfo.position,
        },
        todayAttendance,
        monthlyAttendance,
        currentPayroll,
        recentAttendance,
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