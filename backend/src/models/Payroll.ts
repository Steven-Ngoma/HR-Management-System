import mongoose, { Document, Schema } from 'mongoose';

export interface IPayroll extends Document {
  employeeId: mongoose.Types.ObjectId;
  payPeriod: {
    startDate: Date;
    endDate: Date;
    month: number;
    year: number;
  };
  earnings: {
    basicSalary: number;
    allowances: number;
    overtime: number;
    bonus: number;
    total: number;
  };
  deductions: {
    tax: number;
    socialSecurity: number;
    healthInsurance: number;
    other: number;
    total: number;
  };
  netSalary: number;
  workingDays: number;
  presentDays: number;
  overtimeHours: number;
  status: 'draft' | 'processed' | 'paid' | 'cancelled';
  processedBy: mongoose.Types.ObjectId;
  processedAt?: Date;
  paidAt?: Date;
  payslipUrl?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  calculateNetSalary(): number;
  generatePayslipNumber(): string;
}

const payrollSchema = new Schema<IPayroll>({
  employeeId: {
    type: Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
  },
  payPeriod: {
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
      min: 2020,
    },
  },
  earnings: {
    basicSalary: {
      type: Number,
      required: true,
      min: 0,
    },
    allowances: {
      type: Number,
      default: 0,
      min: 0,
    },
    overtime: {
      type: Number,
      default: 0,
      min: 0,
    },
    bonus: {
      type: Number,
      default: 0,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  deductions: {
    tax: {
      type: Number,
      default: 0,
      min: 0,
    },
    socialSecurity: {
      type: Number,
      default: 0,
      min: 0,
    },
    healthInsurance: {
      type: Number,
      default: 0,
      min: 0,
    },
    other: {
      type: Number,
      default: 0,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  netSalary: {
    type: Number,
    required: true,
    min: 0,
  },
  workingDays: {
    type: Number,
    required: true,
    min: 0,
    max: 31,
  },
  presentDays: {
    type: Number,
    required: true,
    min: 0,
    max: 31,
  },
  overtimeHours: {
    type: Number,
    default: 0,
    min: 0,
  },
  status: {
    type: String,
    enum: ['draft', 'processed', 'paid', 'cancelled'],
    default: 'draft',
  },
  processedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  processedAt: {
    type: Date,
  },
  paidAt: {
    type: Date,
  },
  payslipUrl: {
    type: String,
  },
  notes: {
    type: String,
    maxlength: 1000,
  },
}, {
  timestamps: true,
});

// Compound index for unique payroll per employee per month/year
payrollSchema.index({ 
  employeeId: 1, 
  'payPeriod.month': 1, 
  'payPeriod.year': 1 
}, { unique: true });

payrollSchema.index({ status: 1 });
payrollSchema.index({ 'payPeriod.year': 1, 'payPeriod.month': 1 });

// Method to calculate net salary
payrollSchema.methods.calculateNetSalary = function(): number {
  return this.earnings.total - this.deductions.total;
};

// Method to generate payslip number
payrollSchema.methods.generatePayslipNumber = function(): string {
  const year = this.payPeriod.year;
  const month = String(this.payPeriod.month).padStart(2, '0');
  const employeeId = this.employeeId.toString().slice(-4);
  return `PAY${year}${month}${employeeId}`;
};

// Pre-save middleware to calculate totals
payrollSchema.pre('save', function(next) {
  // Calculate total earnings
  this.earnings.total = 
    this.earnings.basicSalary + 
    this.earnings.allowances + 
    this.earnings.overtime + 
    this.earnings.bonus;
  
  // Calculate total deductions
  this.deductions.total = 
    this.deductions.tax + 
    this.deductions.socialSecurity + 
    this.deductions.healthInsurance + 
    this.deductions.other;
  
  // Calculate net salary
  this.netSalary = this.calculateNetSalary();
  
  // Set processed date if status is processed
  if (this.status === 'processed' && !this.processedAt) {
    this.processedAt = new Date();
  }
  
  // Set paid date if status is paid
  if (this.status === 'paid' && !this.paidAt) {
    this.paidAt = new Date();
  }
  
  next();
});

export default mongoose.model<IPayroll>('Payroll', payrollSchema);