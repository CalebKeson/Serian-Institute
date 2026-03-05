// src/components/Students/StudentTable.jsx
import React from 'react';
import { 
  Users, 
  Edit, 
  Eye, 
  Trash2, 
  Phone, 
  Mail,
  Calendar,
  BadgeCheck,
  XCircle
} from 'lucide-react';

const StudentTable = ({ 
  students, 
  loading, 
  onView, 
  onEdit, 
  onDelete,
  currentUser 
}) => {
  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', icon: BadgeCheck },
      inactive: { color: 'bg-gray-100 text-gray-800', icon: XCircle },
      suspended: { color: 'bg-red-100 text-red-800', icon: XCircle },
      graduated: { color: 'bg-purple-100 text-purple-800', icon: BadgeCheck }
    };
    
    const config = statusConfig[status] || statusConfig.inactive;
    const IconComponent = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <IconComponent className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-4 border-b border-gray-200">
            <div className="rounded-full bg-gray-200 h-10 w-10"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No students</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by creating a new student.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-blue-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">
              Student
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">
              Contact
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">
              Enrollment
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">
              Status
            </th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-blue-900 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {students.map((student) => (
            <tr key={student._id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="h-10 w-10 flex-shrink-0 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {student.user?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      {student.user?.name}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center">
                      <BadgeCheck className="w-3 h-3 mr-1 text-blue-500" />
                      {student.studentId}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900 flex items-center">
                  <Mail className="w-4 h-4 mr-2 text-blue-500" />
                  {student.user?.email}
                </div>
                <div className="text-sm text-gray-500 flex items-center mt-1">
                  <Phone className="w-4 h-4 mr-2 text-blue-500" />
                  {student.phone}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                  {formatDate(student.enrollmentDate)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {getStatusBadge(student.status)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => onView(student)}
                    className="text-blue-600 hover:text-blue-900 transition-colors p-1 rounded"
                    title="View Student"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  
                  {currentUser?.role === 'admin' && (
                    <>
                      <button
                        onClick={() => onEdit(student)}
                        className="text-purple-600 hover:text-purple-900 transition-colors p-1 rounded"
                        title="Edit Student"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => onDelete(student)}
                        className="text-red-600 hover:text-red-900 transition-colors p-1 rounded"
                        title="Delete Student"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StudentTable;