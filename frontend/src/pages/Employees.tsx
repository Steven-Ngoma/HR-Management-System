import { useState } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const Employees = () => {
  const { isHR } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data for demonstration
  const employees = [
    {
      id: '1',
      employeeId: 'EMP001',
      name: 'John Doe',
      email: 'john.doe@company.com',
      department: 'Engineering',
      position: 'Senior Developer',
      status: 'active',
      joinDate: '2023-01-15',
    },
    {
      id: '2',
      employeeId: 'EMP002',
      name: 'Jane Smith',
      email: 'jane.smith@company.com',
      department: 'HR',
      position: 'HR Manager',
      status: 'active',
      joinDate: '2022-08-20',
    },
    {
      id: '3',
      employeeId: 'EMP003',
      name: 'Mike Johnson',
      email: 'mike.johnson@company.com',
      department: 'Marketing',
      position: 'Marketing Specialist',
      status: 'active',
      joinDate: '2023-03-10',
    },
  ];

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      active: 'badge-success',
      inactive: 'badge-warning',
      terminated: 'badge-danger',
    };
    return statusClasses[status as keyof typeof statusClasses] || 'badge-info';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your organization's employees
          </p>
        </div>
        {isHR && (
          <button className="btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            Add Employee
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-content">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select className="input">
                <option value="">All Departments</option>
                <option value="engineering">Engineering</option>
                <option value="hr">HR</option>
                <option value="marketing">Marketing</option>
                <option value="sales">Sales</option>
              </select>
              <select className="input">
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="terminated">Terminated</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Employee List */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-head">Employee</th>
                <th className="table-head">Department</th>
                <th className="table-head">Position</th>
                <th className="table-head">Status</th>
                <th className="table-head">Join Date</th>
                {isHR && <th className="table-head">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee.id} className="table-row">
                  <td className="table-cell">
                    <div>
                      <div className="font-medium text-gray-900">{employee.name}</div>
                      <div className="text-sm text-gray-500">{employee.email}</div>
                      <div className="text-xs text-gray-400">{employee.employeeId}</div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className="text-sm text-gray-900">{employee.department}</span>
                  </td>
                  <td className="table-cell">
                    <span className="text-sm text-gray-900">{employee.position}</span>
                  </td>
                  <td className="table-cell">
                    <span className={`badge ${getStatusBadge(employee.status)}`}>
                      {employee.status}
                    </span>
                  </td>
                  <td className="table-cell">
                    <span className="text-sm text-gray-900">
                      {new Date(employee.joinDate).toLocaleDateString()}
                    </span>
                  </td>
                  {isHR && (
                    <td className="table-cell">
                      <div className="flex space-x-2">
                        <button className="text-primary-600 hover:text-primary-900 text-sm">
                          Edit
                        </button>
                        <button className="text-red-600 hover:text-red-900 text-sm">
                          Delete
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-700">
          Showing 1 to 3 of 3 results
        </div>
        <div className="flex space-x-2">
          <button className="btn-outline" disabled>
            Previous
          </button>
          <button className="btn-outline" disabled>
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default Employees;