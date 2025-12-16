import { useState } from 'react';
import { Clock, Calendar, MapPin } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const Attendance = () => {
  const { user, isHR } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Mock attendance data
  const todayAttendance = {
    checkIn: '09:15:00',
    checkOut: null,
    status: 'present',
    workingHours: '7:45',
  };

  const recentAttendance = [
    {
      date: '2024-12-13',
      checkIn: '09:15:00',
      checkOut: '18:00:00',
      workingHours: '8:45',
      status: 'present',
    },
    {
      date: '2024-12-12',
      checkIn: '09:30:00',
      checkOut: '18:15:00',
      status: 'late',
      workingHours: '8:45',
    },
    {
      date: '2024-12-11',
      checkIn: '09:00:00',
      checkOut: '17:30:00',
      status: 'present',
      workingHours: '8:30',
    },
  ];

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      present: 'badge-success',
      late: 'badge-warning',
      absent: 'badge-danger',
      'half-day': 'badge-info',
    };
    return statusClasses[status as keyof typeof statusClasses] || 'badge-info';
  };

  const handleCheckIn = () => {
    // Handle check-in logic
    console.log('Check in');
  };

  const handleCheckOut = () => {
    // Handle check-out logic
    console.log('Check out');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
        <p className="mt-1 text-sm text-gray-500">
          Track your daily attendance and working hours
        </p>
      </div>

      {/* Today's Attendance Card */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Today's Attendance</h3>
          <p className="text-sm text-gray-500">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        <div className="card-content">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Check In/Out Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">Check In</span>
                </div>
                <span className="text-lg font-semibold text-gray-900">
                  {todayAttendance.checkIn || '--:--'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">Check Out</span>
                </div>
                <span className="text-lg font-semibold text-gray-900">
                  {todayAttendance.checkOut || '--:--'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">Status</span>
                </div>
                <span className={`badge ${getStatusBadge(todayAttendance.status)}`}>
                  {todayAttendance.status}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">Working Hours</span>
                </div>
                <span className="text-lg font-semibold text-gray-900">
                  {todayAttendance.workingHours}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">
                  {currentTime.toLocaleTimeString()}
                </div>
                <div className="text-sm text-gray-500">Current Time</div>
              </div>
              
              <div className="space-y-3">
                {!todayAttendance.checkIn ? (
                  <button
                    onClick={handleCheckIn}
                    className="w-full btn-primary"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Check In
                  </button>
                ) : !todayAttendance.checkOut ? (
                  <button
                    onClick={handleCheckOut}
                    className="w-full btn-danger"
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Check Out
                  </button>
                ) : (
                  <div className="text-center text-sm text-gray-500">
                    You have completed your work for today
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Attendance */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Recent Attendance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-head">Date</th>
                <th className="table-head">Check In</th>
                <th className="table-head">Check Out</th>
                <th className="table-head">Working Hours</th>
                <th className="table-head">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentAttendance.map((record, index) => (
                <tr key={index} className="table-row">
                  <td className="table-cell">
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(record.date).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="table-cell">
                    <span className="text-sm text-gray-900">{record.checkIn}</span>
                  </td>
                  <td className="table-cell">
                    <span className="text-sm text-gray-900">{record.checkOut}</span>
                  </td>
                  <td className="table-cell">
                    <span className="text-sm text-gray-900">{record.workingHours}</span>
                  </td>
                  <td className="table-cell">
                    <span className={`badge ${getStatusBadge(record.status)}`}>
                      {record.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="card-content">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">22</div>
              <div className="text-sm text-gray-500">Present Days</div>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-content">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">3</div>
              <div className="text-sm text-gray-500">Late Days</div>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-content">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">1</div>
              <div className="text-sm text-gray-500">Absent Days</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Attendance;