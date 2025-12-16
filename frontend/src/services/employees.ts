import api from './api';
import { Employee, EmployeeFormData, EmployeeFilters, ApiResponse, PaginationData } from '../types';

export const employeeService = {
  // Get all employees with pagination and filters
  getEmployees: async (filters: EmployeeFilters = {}): Promise<{
    employees: Employee[];
    pagination: PaginationData;
  }> => {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, value.toString());
      }
    });

    const response = await api.get<ApiResponse<{
      employees: Employee[];
      pagination: PaginationData;
    }>>(`/employees?${params.toString()}`);
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Failed to fetch employees');
  },

  // Get employee by ID
  getEmployee: async (id: string): Promise<Employee> => {
    const response = await api.get<ApiResponse<{ employee: Employee }>>(`/employees/${id}`);
    
    if (response.data.success && response.data.data) {
      return response.data.data.employee;
    }
    
    throw new Error(response.data.message || 'Failed to fetch employee');
  },

  // Create new employee
  createEmployee: async (employeeData: EmployeeFormData): Promise<Employee> => {
    const response = await api.post<ApiResponse<{ employee: Employee }>>('/employees', employeeData);
    
    if (response.data.success && response.data.data) {
      return response.data.data.employee;
    }
    
    throw new Error(response.data.message || 'Failed to create employee');
  },

  // Update employee
  updateEmployee: async (id: string, employeeData: Partial<EmployeeFormData>): Promise<Employee> => {
    const response = await api.put<ApiResponse<{ employee: Employee }>>(`/employees/${id}`, employeeData);
    
    if (response.data.success && response.data.data) {
      return response.data.data.employee;
    }
    
    throw new Error(response.data.message || 'Failed to update employee');
  },

  // Delete employee (soft delete)
  deleteEmployee: async (id: string): Promise<void> => {
    const response = await api.delete<ApiResponse<void>>(`/employees/${id}`);
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to delete employee');
    }
  },

  // Get employee statistics
  getEmployeeStats: async (): Promise<{
    overview: {
      total: number;
      active: number;
      inactive: number;
      terminated: number;
    };
    departmentStats: { _id: string; count: number }[];
    employmentTypeStats: { _id: string; count: number }[];
  }> => {
    const response = await api.get<ApiResponse<{
      overview: {
        total: number;
        active: number;
        inactive: number;
        terminated: number;
      };
      departmentStats: { _id: string; count: number }[];
      employmentTypeStats: { _id: string; count: number }[];
    }>>('/employees/stats/overview');
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Failed to fetch employee statistics');
  },
};