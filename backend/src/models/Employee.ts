import mongoose, { Document, Schema } from 'mongoose';

export interface IEmployee extends Document {
  employeeId: string;
  userId: mongoose.Types.ObjectId;
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: Date;
    gender: 'male' | 'female' | 'other';
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
    emergencyContact: {
      name: string;
      relationship: string;
      phone: string;
    };
  };
  professionalInfo: {
    department: string;
    position: string;
    employmentType: 'full-time' | 'part-time' | 'contract' | 'intern';
    startDate: Date;
    endDate?: Date;
    reportingManager?: mongoose.Types.ObjectId;
    workLocation: 'office' | 'remote' | 'hybrid';
    salary: {
      basic: number;
      allowances: number;
      currency: string;
    };
  };
  documents: {
    profilePicture?: string;
    resume?: string;
    idProof?: string;
    addressProof?: string;
    contracts?: string[];
  };
  status: 'active' | 'inactive' | 'terminated' | 'on-leave';
  createdAt: Date;
  updatedAt: Date;
  getFullName(): string;
  getTotalSalary(): number;
}

const employeeSchema = new Schema<IEmployee>({
  employeeId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  personalInfo: {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
    },
    dateOfBirth: {
      type: Date,
      required: [true, 'Date of birth is required'],
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: true,
    },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      country: { type: String, required: true, default: 'USA' },
    },
    emergencyContact: {
      name: { type: String, required: true },
      relationship: { type: String, required: true },
      phone: { type: String, required: true },
    },
  },
  professionalInfo: {
    department: {
      type: String,
      required: [true, 'Department is required'],
      enum: ['HR', 'Engineering', 'Marketing', 'Sales', 'Finance', 'Operations', 'Legal', 'IT'],
    },
    position: {
      type: String,
      required: [true, 'Position is required'],
    },
    employmentType: {
      type: String,
      enum: ['full-time', 'part-time', 'contract', 'intern'],
      default: 'full-time',
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
    },
    reportingManager: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
    },
    workLocation: {
      type: String,
      enum: ['office', 'remote', 'hybrid'],
      default: 'office',
    },
    salary: {
      basic: {
        type: Number,
        required: [true, 'Basic salary is required'],
        min: 0,
      },
      allowances: {
        type: Number,
        default: 0,
        min: 0,
      },
      currency: {
        type: String,
        default: 'USD',
      },
    },
  },
  documents: {
    profilePicture: String,
    resume: String,
    idProof: String,
    addressProof: String,
    contracts: [String],
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'terminated', 'on-leave'],
    default: 'active',
  },
}, {
  timestamps: true,
});

// Indexes for better performance
employeeSchema.index({ employeeId: 1 });
employeeSchema.index({ userId: 1 });
employeeSchema.index({ 'professionalInfo.department': 1 });
employeeSchema.index({ status: 1 });
employeeSchema.index({ 'personalInfo.email': 1 });

// Virtual for full name
employeeSchema.methods.getFullName = function (): string {
  return `${this.personalInfo.firstName} ${this.personalInfo.lastName}`;
};

// Virtual for total salary
employeeSchema.methods.getTotalSalary = function (): number {
  return this.professionalInfo.salary.basic + this.professionalInfo.salary.allowances;
};

// Pre-save middleware to generate employee ID
employeeSchema.pre('save', async function (next) {
  if (!this.employeeId) {
    const count = await mongoose.model('Employee').countDocuments();
    this.employeeId = `EMP${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

export default mongoose.model<IEmployee>('Employee', employeeSchema);