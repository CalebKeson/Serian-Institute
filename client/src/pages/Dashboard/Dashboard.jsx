// src/pages/Dashboard/Dashboard.jsx
import React from "react";
import Layout from "../../components/Layout/Layout";
import { useAuthStore } from "../../stores/authStore";
import { Link } from "react-router";

const Dashboard = () => {
  const { user } = useAuthStore();

  const stats = [
    { name: "Total Students", value: "0", change: "+0%", color: "blue" },
    { name: "Total Courses", value: "0", change: "+0%", color: "green" },
    { name: "Active Teachers", value: "0", change: "+0%", color: "purple" },
    { name: "Today's Attendance", value: "0%", change: "+0%", color: "orange" },
  ];

  const recentActivity = [
    {
      id: 1,
      action: "New student registered",
      time: "2 minutes ago",
      type: "student",
    },
    { id: 2, action: "Course updated", time: "1 hour ago", type: "course" },
    {
      id: 3,
      action: "Attendance marked",
      time: "3 hours ago",
      type: "attendance",
    },
  ];

  return (
    <Layout>
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-gray-600 mt-2">
          Here's what's happening at Serian Institute today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stat.value}
                </p>
              </div>
              <div className={`p-3 rounded-lg bg-${stat.color}-50`}>
                <span className={`text-${stat.color}-600 font-semibold`}>
                  {stat.change}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Activity
          </h2>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-sm">📝</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.action}
                  </p>
                  <p className="text-sm text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <Link
              to="/students/add"
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-colors text-center"
            >
              <div className="text-2xl mb-2">👨‍🎓</div>
              <span className="text-sm font-medium">Add Student</span>
            </Link>

            <Link
              to="/courses/add"
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-green-500 hover:text-green-500 transition-colors text-center"
            >
              <div className="text-2xl mb-2">📚</div>
              <span className="text-sm font-medium">Create Course</span>
            </Link>

            <Link
              to="/courses"
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-purple-500 hover:text-purple-500 transition-colors text-center"
            >
              <div className="text-2xl mb-2">✅</div>
              <span className="text-sm font-medium">Mark Attendance</span>
            </Link>

            <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-orange-500 hover:text-orange-500 transition-colors text-center">
              <div className="text-2xl mb-2">🎯</div>
              <span className="text-sm font-medium">Enter Grades</span>
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
