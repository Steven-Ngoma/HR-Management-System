export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'hr' | 'employee';
  employeeId?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

export interface Employee {
  _id: string;
  employeeId: string;
  userId: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
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
    startDate: string;
    endDate?: string;
    reportingManager?: Employee;
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
  createdAt: string;
  updatedAt: string;
}

export interface Attendance {
  _id: string;
  employeeId: Employee | string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  breakTime: {
    start?: string;
    end?: string;
    duration: number;
  }[];
  workingHours: number;
  overtimeHours: number;
  status: 'present' | 'absent' | 'late' | 'half-day' | 'holiday' | 'leave';
  notes?: string;
  location?: {
    checkInLocation?: string;
    checkOutLocation?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Payroll {
  _id: string;
  employeeId: Employee | string;
  payPeriod: {
    startDate: string;
    endDate: string;
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
  processedBy?: User;
  processedAt?: string;
  paidAt?: string;
  payslipUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  employees: {
    total: number;
    newThisMonth: number;
  };
  attendance: {
    today: {
      present: number;
      absent: number;
      late: number;
      onLeave: number;
    };
    totalCheckedIn: number;
  };
  payroll: {
    _id: string;
    count: number;
    totalAmount: number;
  }[];
  departments: {
    _id: string;
    count: number;
  }[];
  recentEmployees: Employee[];
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: any[];
}

export interface PaginationData {
  current: number;
  pages: number;
  total: number;
  limit: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: 'admin' | 'hr' | 'employee';
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface EmployeeFormData {
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
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
    startDate: string;
    workLocation: 'office' | 'remote' | 'hybrid';
    salary: {
      basic: number;
      allowances: number;
      currency: string;
    };
  };
  createUserAccount?: boolean;
}

export interface AttendanceFilters {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  employeeId?: string;
  status?: 'present' | 'absent' | 'late' | 'half-day' | 'holiday' | 'leave';
}

export interface EmployeeFilters {
  page?: number;
  limit?: number;
  department?: string;
  status?: 'active' | 'inactive' | 'terminated' | 'on-leave';
  search?: string;
}

export interface PayrollFilters {
  page?: number;
  limit?: number;
  month?: number;
  year?: number;
  employeeId?: string;
  status?: 'draft' | 'processed' | 'paid' | 'cancelled';
}