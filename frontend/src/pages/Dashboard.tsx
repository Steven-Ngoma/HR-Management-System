import { Users, Clock, DollarSign, TrendingUp } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const Dashboard = () => {
  const { user, isHR } = useAuth();

  const stats = [
    {
      name: 'Total Employees',
      value: '156',
      change: '+12%',
      changeType: 'increase',
      icon: Users,
    },
    {
      name: 'Present Today',
      value: '142',
      change: '91%',
      changeType: 'neutral',
      icon: Clock,
    },
    {
      name: 'Monthly Payroll',
      value: '$284,500',
      change: '+5.2%',
      changeType: 'increase',
      icon: DollarSign,
    },
    {
      name: 'Productivity',
      value: '94.2%',
      change: '+2.1%',
      changeType: 'increase',
      icon: TrendingUp,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Here's what's happening with your {isHR ? 'organization' : 'work'} today.
        </p>
      </div>

      {/* Stats Grid */}
      {isHR && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.name} className="card">
                <div className="card-content">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Icon className="h-8 w-8 text-primary-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          {stat.name}
                        </dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900">
                            {stat.value}
                          </div>
                          <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                            stat.changeType === 'increase' 
                              ? 'text-green-600' 
                              : stat.changeType === 'decrease'
                              ? 'text-red-600'
                              : 'text-gray-500'
                          }`}>
                            {stat.change}
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Today's Attendance */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Today's Attendance</h3>
          </div>
          <div className="card-content">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Check In</span>
                <span className="text-sm font-medium text-gray-900">9:15 AM</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Status</span>
                <span className="badge badge-success">Present</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Working Hours</span>
                <span className="text-sm font-medium text-gray-900">7h 45m</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
          </div>
          <div className="card-content">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-2 w-2 bg-green-400 rounded-full mt-2"></div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-900">Checked in at 9:15 AM</p>
                  <p className="text-xs text-gray-500">2 minutes ago</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-2 w-2 bg-blue-400 rounded-full mt-2"></div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-900">Payslip generated for November</p>
                  <p className="text-xs text-gray-500">1 day ago</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-2 w-2 bg-yellow-400 rounded-full mt-2"></div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-900">Profile updated</p>
                  <p className="text-xs text-gray-500">3 days ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Upcoming Events</h3>
        </div>
        <div className="card-content">
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <span className="text-sm font-medium text-primary-600">15</span>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900">Team Meeting</p>
                <p className="text-sm text-gray-500">December 15, 2024 at 2:00 PM</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-sm font-medium text-green-600">20</span>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900">Holiday - Christmas</p>
                <p className="text-sm text-gray-500">December 20, 2024</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;