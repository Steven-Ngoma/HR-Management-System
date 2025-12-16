import { useState } from 'react';
import { Download, Eye, DollarSign, Calendar } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const Payroll = () => {
  const { user, isHR } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Mock payroll data
  const payrollRecords = [
    {
      id: '1',
      month: 'December',
      year: 2024,
      basicSalary: 5000,
      allowances: 1000,
      overtime: 500,
      bonus: 200,
      grossSalary: 6700,
      tax: 1005,
      socialSecurity: 415.34,
      healthInsurance: 335,
      totalDeductions: 1755.34,
      netSalary: 4944.66,
      status: 'paid',
      paidDate: '2024-12-01',
    },
    {
      id: '2',
      month: 'November',
      year: 2024,
      basicSalary: 5000,
      allowances: 1000,
      overtime: 300,
      bonus: 0,
      grossSalary: 6300,
      tax: 945,
      socialSecurity: 390.6,
      healthInsurance: 315,
      totalDeductions: 1650.6,
      netSalary: 4649.4,
      status: 'paid',
      paidDate: '2024-11-01',
    },
  ];

  const currentPayroll = payrollRecords[0];

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      draft: 'badge-warning',
      processed: 'badge-info',
      paid: 'badge-success',
      cancelled: 'badge-danger',
    };
    return statusClasses[status as keyof typeof statusClasses] || 'badge-info';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payroll</h1>
          <p className="mt-1 text-sm text-gray-500">
            View your salary details and payslips
          </p>
        </div>
        {isHR && (
          <button className="btn-primary">
            <DollarSign className="h-4 w-4 mr-2" />
            Generate Payroll
          </button>
        )}
      </div>

      {/* Current Month Payroll */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Current Payroll - {currentPayroll.month} {currentPayroll.year}
            </h3>
            <span className={`badge ${getStatusBadge(currentPayroll.status)}`}>
              {currentPayroll.status}
            </span>
          </div>
        </div>
        <div className="card-content">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Earnings */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Earnings</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Basic Salary</span>
                  <span className="font-medium">${currentPayroll.basicSalary.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Allowances</span>
                  <span className="font-medium">${currentPayroll.allowances.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Overtime</span>
                  <span className="font-medium">${currentPayroll.overtime.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Bonus</span>
                  <span className="font-medium">${currentPayroll.bonus.toLocaleString()}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between font-medium">
                    <span>Gross Salary</span>
                    <span>${currentPayroll.grossSalary.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Deductions */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Deductions</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium">${currentPayroll.tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Social Security</span>
                  <span className="font-medium">${currentPayroll.socialSecurity.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Health Insurance</span>
                  <span className="font-medium">${currentPayroll.healthInsurance.toLocaleString()}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between font-medium">
                    <span>Total Deductions</span>
                    <span>${currentPayroll.totalDeductions.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Net Salary */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Net Salary</h4>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  ${currentPayroll.netSalary.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500 mt-2">
                  Paid on {new Date(currentPayroll.paidDate).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Actions</h4>
              <div className="space-y-2">
                <button className="w-full btn-outline">
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </button>
                <button className="w-full btn-primary">
                  <Download className="h-4 w-4 mr-2" />
                  Download Payslip
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payroll History */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Payroll History</h3>
            <div className="flex space-x-2">
              <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="input"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(0, i).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>
              <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="input"
              >
                <option value={2024}>2024</option>
                <option value={2023}>2023</option>
              </select>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-head">Period</th>
                <th className="table-head">Gross Salary</th>
                <th className="table-head">Deductions</th>
                <th className="table-head">Net Salary</th>
                <th className="table-head">Status</th>
                <th className="table-head">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payrollRecords.map((record) => (
                <tr key={record.id} className="table-row">
                  <td className="table-cell">
                    <div>
                      <div className="font-medium text-gray-900">
                        {record.month} {record.year}
                      </div>
                      {record.paidDate && (
                        <div className="text-sm text-gray-500">
                          Paid: {new Date(record.paidDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className="text-sm font-medium text-gray-900">
                      ${record.grossSalary.toLocaleString()}
                    </span>
                  </td>
                  <td className="table-cell">
                    <span className="text-sm text-gray-900">
                      ${record.totalDeductions.toLocaleString()}
                    </span>
                  </td>
                  <td className="table-cell">
                    <span className="text-sm font-medium text-green-600">
                      ${record.netSalary.toLocaleString()}
                    </span>
                  </td>
                  <td className="table-cell">
                    <span className={`badge ${getStatusBadge(record.status)}`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="flex space-x-2">
                      <button className="text-primary-600 hover:text-primary-900 text-sm">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="text-primary-600 hover:text-primary-900 text-sm">
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Salary Breakdown Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Earnings Breakdown</h3>
          </div>
          <div className="card-content">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-600">Basic Salary (74.6%)</span>
                </div>
                <span className="text-sm font-medium">${currentPayroll.basicSalary.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-600">Allowances (14.9%)</span>
                </div>
                <span className="text-sm font-medium">${currentPayroll.allowances.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-600">Overtime (7.5%)</span>
                </div>
                <span className="text-sm font-medium">${currentPayroll.overtime.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-600">Bonus (3.0%)</span>
                </div>
                <span className="text-sm font-medium">${currentPayroll.bonus.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Deductions Breakdown</h3>
          </div>
          <div className="card-content">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-600">Tax (57.3%)</span>
                </div>
                <span className="text-sm font-medium">${currentPayroll.tax.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-600">Social Security (23.7%)</span>
                </div>
                <span className="text-sm font-medium">${currentPayroll.socialSecurity.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-indigo-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-600">Health Insurance (19.1%)</span>
                </div>
                <span className="text-sm font-medium">${currentPayroll.healthInsurance.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payroll;