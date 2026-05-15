// frontend/src/components/Instructors/InstructorTable.jsx
import React from 'react';
import { 
  Users, 
  Edit, 
  Eye, 
  Trash2, 
  Phone, 
  Mail,
  Calendar,
  DollarSign,
  BadgeCheck,
  XCircle
} from 'lucide-react';
import { getStatusBadgeColor, getSalaryStatusBadgeColor, formatSalary } from '../../utils/instructorDataFormatter';

const InstructorTable = ({ 
  instructors, 
  loading, 
  onView, 
  onEdit, 
  onDelete,
  onViewSalary,
  currentUser 
}) => {
  const getStatusBadge = (status) => {
    const config = getStatusBadgeColor(status);
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getSalaryStatusBadge = (status) => {
    const config = getSalaryStatusBadgeColor(status);
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
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

  if (instructors.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No instructors</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by creating a new instructor.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-blue-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">
              Instructor
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">
              Department
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">
              Contact
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-900 uppercase tracking-wider">
              Salary
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
          {instructors.map((instructor) => (
            <tr key={instructor._id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="h-10 w-10 flex-shrink-0 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {instructor.user?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      {instructor.user?.name}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center">
                      <BadgeCheck className="w-3 h-3 mr-1 text-blue-500" />
                      {instructor.employeeId}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{instructor.department}</div>
                <div className="text-xs text-gray-500">{instructor.designation}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900 flex items-center">
                  <Mail className="w-4 h-4 mr-2 text-blue-500" />
                  {instructor.user?.email}
                </div>
                <div className="text-sm text-gray-500 flex items-center mt-1">
                  <Phone className="w-4 h-4 mr-2 text-blue-500" />
                  {instructor.phone}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {formatSalary(instructor.salary, instructor.salaryCurrency)}
                </div>
                <div className="mt-1">
                  {getSalaryStatusBadge(instructor.salaryStatus)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {getStatusBadge(instructor.status)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => onView(instructor)}
                    className="text-blue-600 hover:text-blue-900 transition-colors p-1 rounded"
                    title="View Instructor"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  
                  {currentUser?.role === 'admin' && (
                    <>
                      <button
                        onClick={() => onEdit(instructor)}
                        className="text-purple-600 hover:text-purple-900 transition-colors p-1 rounded"
                        title="Edit Instructor"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => onViewSalary(instructor)}
                        className="text-green-600 hover:text-green-900 transition-colors p-1 rounded"
                        title="Record Salary Payment"
                      >
                        <DollarSign className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => onDelete(instructor)}
                        className="text-red-600 hover:text-red-900 transition-colors p-1 rounded"
                        title="Delete Instructor"
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

export default InstructorTable;