// src/app/dashboard/page.js
"use client";

import { useGetUser } from "../../components/hooks/auth/useGetUser";
import { TwoFAManagement } from "../../components/auth/TwoFAManagement";
import { ChangePassword } from "../../components/auth/ChangePassword";
import LogoutButton from "../../components/auth/LogoutButton";
import { Shield, User, Settings, Key } from "lucide-react";

export default function Dashboard() {
  const { user, isLoading, isError } = useGetUser();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading dashboard</p>
          <button
            onClick={() => window.location.href = '/auth'}
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">Welcome back, {user.full_name}!</p>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-4">
                <User className="h-6 w-6 text-gray-400 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Profile</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Full Name</label>
                  <p className="text-gray-900">{user.full_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-gray-900">{user.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Role</label>
                  <p className="text-gray-900 capitalize">{user.role}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">2FA Status</label>
                  <p className={`font-medium ${user.two_fa_enabled ? 'text-green-600' : 'text-gray-500'}`}>
                    {user.two_fa_enabled ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div className="lg:col-span-2 space-y-8">
            {/* Account Security Section */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-6">
                <Settings className="h-6 w-6 text-gray-400 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Account Security</h3>
              </div>
              
              <div className="space-y-4">
                {/* Password Change */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center">
                    <Key className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">Password</p>
                      <p className="text-sm text-gray-600">Update your account password</p>
                    </div>
                  </div>
                  <ChangePassword />
                </div>
              </div>
            </div>

            {/* Two-Factor Authentication Section */}
            <TwoFAManagement />

            {/* Activity Section */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-6">
                <Shield className="h-6 w-6 text-gray-400 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Security Activity</h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm text-gray-600">Last login</span>
                  <span className="text-sm font-medium text-gray-900">
                    {new Date().toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm text-gray-600">Account created</span>
                  <span className="text-sm font-medium text-gray-900">
                    {new Date(user.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-600">Profile updated</span>
                  <span className="text-sm font-medium text-gray-900">
                    {new Date(user.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                  <h4 className="font-medium text-gray-900">View Bookings</h4>
                  <p className="text-sm text-gray-600">Check your pet reservations</p>
                </button>
                <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                  <h4 className="font-medium text-gray-900">Manage Cats</h4>
                  <p className="text-sm text-gray-600">Add or edit your cats</p>
                </button>
                <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                  <h4 className="font-medium text-gray-900">Payment History</h4>
                  <p className="text-sm text-gray-600">View past transactions</p>
                </button>
                <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                  <h4 className="font-medium text-gray-900">Support</h4>
                  <p className="text-sm text-gray-600">Get help or contact us</p>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Security Tips */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Security Tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div className="flex items-start">
              <Shield className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
              <p>Enable 2FA for enhanced account security</p>
            </div>
            <div className="flex items-start">
              <Key className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
              <p>Use a strong, unique password</p>
            </div>
            <div className="flex items-start">
              <Shield className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
              <p>Keep your backup codes in a safe place</p>
            </div>
            <div className="flex items-start">
              <Key className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
              <p>Log out from shared devices</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}