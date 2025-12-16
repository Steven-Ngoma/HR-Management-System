import mongoose, { Document, Schema } from 'mongoose';

export interface IAttendance extends Document {
  employeeId: mongoose.Types.ObjectId;
  date: Date;
  checkIn: Date;
  checkOut?: Date;
  breakTime: {
    start?: Date;
    end?: Date;
    duration: number; // in minutes
  }[];
  workingHours: number; // in hours
  overtimeHours: number; // in hours
  status: 'present' | 'absent' | 'late' | 'half-day' | 'holiday' | 'leave';
  notes?: string;
  location?: {
    checkInLocation: string;
    checkOutLocation?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  calculateWorkingHours(): number;
  isLate(): boolean;
}

const attendanceSchema = new Schema<IAttendance>({
  employeeId: {
    type: Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  checkIn: {
    type: Date,
    required: function(this: IAttendance) {
      return this.status === 'present' || this.status === 'late' || this.status === 'half-day';
    },
  },
  checkOut: {
    type: Date,
  },
  breakTime: [{
    start: Date,
    end: Date,
    duration: {
      type: Number,
      default: 0,
    },
  }],
  workingHours: {
    type: Number,
    default: 0,
    min: 0,
    max: 24,
  },
  overtimeHours: {
    type: Number,
    default: 0,
    min: 0,
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'half-day', 'holiday', 'leave'],
    required: true,
  },
  notes: {
    type: String,
    maxlength: 500,
  },
  location: {
    checkInLocation: String,
    checkOutLocation: String,
  },
}, {
  timestamps: true,
});

// Compound index for unique attendance per employee per day
attendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: 1 });
attendanceSchema.index({ status: 1 });

// Method to calculate working hours
attendanceSchema.methods.calculateWorkingHours = function(): number {
  if (!this.checkIn || !this.checkOut) return 0;
  
  const checkInTime = new Date(this.checkIn).getTime();
  const checkOutTime = new Date(this.checkOut).getTime();
  const totalMinutes = (checkOutTime - checkInTime) / (1000 * 60);
  
  // Subtract break time
  const totalBreakMinutes = this.breakTime.reduce((total: number, breakPeriod: any) => {
    return total + (breakPeriod.duration || 0);
  }, 0);
  
  const workingMinutes = totalMinutes - totalBreakMinutes;
  return Math.max(0, workingMinutes / 60); // Convert to hours
};

// Method to check if employee is late
attendanceSchema.methods.isLate = function(): boolean {
  if (!this.checkIn) return false;
  
  const checkInTime = new Date(this.checkIn);
  const standardStartTime = new Date(this.checkIn);
  standardStartTime.setHours(9, 0, 0, 0); // Assuming 9 AM start time
  
  return checkInTime > standardStartTime;
};

// Pre-save middleware to calculate working hours and overtime
attendanceSchema.pre('save', function(next) {
  if (this.checkIn && this.checkOut) {
    this.workingHours = this.calculateWorkingHours();
    
    // Calculate overtime (assuming 8 hours is standard)
    const standardHours = 8;
    this.overtimeHours = Math.max(0, this.workingHours - standardHours);
    
    // Update status based on check-in time
    if (this.isLate()) {
      this.status = 'late';
    } else if (this.workingHours < 4) {
      this.status = 'half-day';
    } else {
      this.status = 'present';
    }
  }
  
  next();
});

export default mongoose.model<IAttendance>('Attendance', attendanceSchema);