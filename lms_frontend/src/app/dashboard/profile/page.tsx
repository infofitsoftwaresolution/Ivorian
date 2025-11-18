/**
 * User Profile Page
 * Page for users to view and edit their profile information
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { 
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  LockClosedIcon,
  CameraIcon,
  CheckCircleIcon,
  XCircleIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { apiClient } from '@/lib/api/client';

interface ProfileData {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  bio?: string;
  avatar_url?: string;
  organization_id?: number;
  organization_name?: string;
}

interface PasswordChangeData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export default function ProfilePage() {
  const { user, isLoading: authLoading, refreshUser } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

  const [profileData, setProfileData] = useState<ProfileData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    bio: '',
    avatar_url: '',
    organization_id: undefined,
    organization_name: undefined
  });

  const [passwordData, setPasswordData] = useState<PasswordChangeData>({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (!authLoading && user) {
      loadProfile();
    }
  }, [user, authLoading]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError('');

      // Load profile data from API
      const response = await apiClient.getUserProfile();
      const data = response.data;

      // Organization name is now included in the profile response
      setProfileData({
        first_name: data.first_name || user?.first_name || '',
        last_name: data.last_name || user?.last_name || '',
        email: data.email || user?.email || '',
        phone: data.phone || '',
        bio: data.bio || '',
        avatar_url: data.avatar_url || '',
        organization_id: data.organization_id || user?.organization_id,
        organization_name: data.organization_name
      });
    } catch (error: unknown) {
      console.error('Error loading profile:', error);
      // Fallback to user data from auth context
      if (user) {
        setProfileData({
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          email: user.email || '',
          phone: '',
          bio: '',
          avatar_url: '',
          organization_id: user.organization_id,
          organization_name: undefined // Will be fetched from profile API
        });
      }
      const errorMessage = error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : undefined;
      if (errorMessage) {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccessMessage('');

      // Validate required fields
      if (!profileData.first_name || !profileData.last_name || !profileData.email) {
        setError('Please fill in all required fields.');
        return;
      }

      // Update profile via API
      await apiClient.updateUserProfile({
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        email: profileData.email,
        phone: profileData.phone || null,
        bio: profileData.bio || null
      });

      // Refresh user data
      await refreshUser();

      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: unknown) {
      console.error('Error saving profile:', error);
      const errorMessage = error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : undefined;
      setError(errorMessage || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      setChangingPassword(true);
      setError('');
      setSuccessMessage('');

      // Validate passwords
      if (!passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password) {
        setError('Please fill in all password fields.');
        return;
      }

      if (passwordData.new_password !== passwordData.confirm_password) {
        setError('New passwords do not match.');
        return;
      }

      if (passwordData.new_password.length < 8) {
        setError('New password must be at least 8 characters long.');
        return;
      }

      // Change password via API
      await apiClient.updateUserProfile({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      });

      // Clear password fields
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });

      setSuccessMessage('Password changed successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: unknown) {
      console.error('Error changing password:', error);
      const errorMessage = error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : undefined;
      setError(errorMessage || 'Failed to change password. Please try again.');
    } finally {
      setChangingPassword(false);
    }
  };

  // Show loading while checking authentication or loading data
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">
            {authLoading ? 'Loading authentication...' : 'Loading profile...'}
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  // Get user initials for avatar
  const getInitials = () => {
    const first = profileData.first_name?.charAt(0) || user?.first_name?.charAt(0) || '';
    const last = profileData.last_name?.charAt(0) || user?.last_name?.charAt(0) || '';
    return `${first}${last}`.toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb />

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600">Manage your account information and preferences</p>
        </div>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <CheckCircleIcon className="h-5 w-5 text-green-400" />
            <p className="ml-3 text-sm text-green-800">{successMessage}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <XCircleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('profile')}
            className={`
              ${activeTab === 'profile'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center
            `}
          >
            <UserIcon className="h-5 w-5 mr-2" />
            Profile Information
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`
              ${activeTab === 'password'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center
            `}
          >
            <LockClosedIcon className="h-5 w-5 mr-2" />
            Change Password
          </button>
        </nav>
      </div>

      {/* Profile Information Tab */}
      {activeTab === 'profile' && (
        <div className="bg-white shadow rounded-lg">
          <div className="p-6">
            {/* Avatar Section */}
            <div className="flex items-center space-x-6 mb-8 pb-8 border-b border-gray-200">
              <div className="relative">
                {profileData.avatar_url ? (
                  <img
                    src={profileData.avatar_url}
                    alt={`${profileData.first_name} ${profileData.last_name}`}
                    className="h-24 w-24 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-24 w-24 rounded-full bg-indigo-100 flex items-center justify-center">
                    <span className="text-2xl font-semibold text-indigo-600">
                      {getInitials()}
                    </span>
                  </div>
                )}
                <label className="absolute bottom-0 right-0 p-2 bg-indigo-600 rounded-full text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      
                      try {
                        setError('');
                        setSuccessMessage('');
                        const response = await apiClient.uploadAvatar(file, (progress) => {
                          console.log(`Upload progress: ${progress}%`);
                        });
                        
                        // Handle different response structures
                        let avatarUrl: string | undefined;
                        if (response.data && typeof response.data === 'object') {
                          if ('url' in response.data && typeof response.data.url === 'string') {
                            avatarUrl = response.data.url;
                          } else if ('data' in response.data && response.data.data && typeof response.data.data === 'object' && 'url' in response.data.data && typeof response.data.data.url === 'string') {
                            avatarUrl = response.data.data.url;
                          }
                        } else if (typeof response.data === 'string') {
                          avatarUrl = response.data;
                        }
                        
                        if (avatarUrl) {
                          const url = avatarUrl;
                          setProfileData({ ...profileData, avatar_url: url });
                          await apiClient.updateUserProfile({ avatar_url: url });
                          await refreshUser();
                          setSuccessMessage('Avatar updated successfully!');
                          setTimeout(() => setSuccessMessage(''), 3000);
                        } else {
                          throw new Error('No URL in response');
                        }
                      } catch (error: unknown) {
                        console.error('Error uploading avatar:', error);
                        const errorMessage = error && typeof error === 'object' && 'response' in error
                          ? (error as { response?: { data?: { detail?: string } } }).response?.data?.detail
                          : undefined;
                        setError(errorMessage || 'Failed to upload avatar. Please try again.');
                      }
                    }}
                  />
                  <CameraIcon className="h-4 w-4" />
                </label>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {profileData.first_name} {profileData.last_name}
                </h3>
                <p className="text-sm text-gray-500">{profileData.email}</p>
                <p className="text-sm text-gray-500 capitalize mt-1">
                  {user.role?.replace('_', ' ')}
                </p>
                {profileData.organization_name && (
                  <p className="text-sm text-gray-500 mt-1 flex items-center">
                    <BuildingOfficeIcon className="h-4 w-4 mr-1" />
                    {profileData.organization_name}
                  </p>
                )}
              </div>
            </div>

            {/* Profile Form */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={profileData.first_name}
                    onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={profileData.last_name}
                    onChange={(e) => setProfileData({ ...profileData, last_name: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 relative">
                    <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      className="block w-full pl-10 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <div className="mt-1 relative">
                    <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="tel"
                      value={profileData.phone || ''}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      className="block w-full pl-10 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>
                {profileData.organization_name && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Organization</label>
                    <div className="mt-1 relative">
                      <BuildingOfficeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        value={profileData.organization_name}
                        disabled
                        className="block w-full pl-10 border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50 text-gray-600 cursor-not-allowed"
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">Your organization membership</p>
                  </div>
                )}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Bio</label>
                  <textarea
                    value={profileData.bio || ''}
                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                    rows={4}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Tell us about yourself..."
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Tab */}
      {activeTab === 'password' && (
        <div className="bg-white shadow rounded-lg">
          <div className="p-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
                <p className="text-sm text-gray-500 mb-6">
                  Enter your current password and choose a new secure password.
                </p>
              </div>

              <div className="space-y-6 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Current Password <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 relative">
                    <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="password"
                      value={passwordData.current_password}
                      onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                      className="block w-full pl-10 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    New Password <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 relative">
                    <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="password"
                      value={passwordData.new_password}
                      onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                      className="block w-full pl-10 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      required
                      minLength={8}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Must be at least 8 characters long</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Confirm New Password <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 relative">
                    <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="password"
                      value={passwordData.confirm_password}
                      onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                      className="block w-full pl-10 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      required
                      minLength={8}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-200">
                  <button
                    onClick={handleChangePassword}
                    disabled={changingPassword}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {changingPassword ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Changing...
                      </>
                    ) : (
                      'Change Password'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

