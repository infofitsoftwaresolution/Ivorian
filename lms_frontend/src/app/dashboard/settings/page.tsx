/**
 * User Settings Page
 * Page for users to manage their personal settings and preferences
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { 
  CogIcon,
  BellIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  UserCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { apiClient } from '@/lib/api/client';

interface NotificationSettings {
  email_notifications: boolean;
  course_updates: boolean;
  assignment_deadlines: boolean;
  new_messages: boolean;
  announcements: boolean;
  marketing_emails: boolean;
  push_notifications: boolean;
}

interface PrivacySettings {
  profile_visibility: 'public' | 'private' | 'organization';
  show_email: boolean;
  show_phone: boolean;
  allow_messaging: boolean;
  data_sharing: boolean;
}

interface PreferencesSettings {
  language: string;
  timezone: string;
  theme: 'light' | 'dark' | 'system';
  date_format: string;
  time_format: '12h' | '24h';
}

interface AccountSettings {
  delete_account: boolean;
  export_data: boolean;
}

type SettingsTab = 'notifications' | 'privacy' | 'preferences' | 'account';

export default function UserSettingsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>('notifications');
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    email_notifications: true,
    course_updates: true,
    assignment_deadlines: true,
    new_messages: true,
    announcements: true,
    marketing_emails: false,
    push_notifications: true
  });

  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    profile_visibility: 'organization',
    show_email: false,
    show_phone: false,
    allow_messaging: true,
    data_sharing: false
  });

  const [preferencesSettings, setPreferencesSettings] = useState<PreferencesSettings>({
    language: 'en',
    timezone: 'UTC',
    theme: 'system',
    date_format: 'MM/DD/YYYY',
    time_format: '12h'
  });

  const [accountSettings, setAccountSettings] = useState<AccountSettings>({
    delete_account: false,
    export_data: false
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (!authLoading && user) {
      loadSettings();
    }
  }, [user, authLoading]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError('');

      // TODO: Replace with actual API call
      // const response = await apiClient.getUserSettings();
      // setNotificationSettings(response.data.notifications);
      // setPrivacySettings(response.data.privacy);
      // setPreferencesSettings(response.data.preferences);

      // Mock data for now
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error: unknown) {
      console.error('Error loading settings:', error);
      const errorMessage = error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : undefined;
      setError(errorMessage || 'Failed to load settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccessMessage('');

      // TODO: Replace with actual API call
      // await apiClient.updateUserSettings({
      //   notifications: notificationSettings,
      //   privacy: privacySettings,
      //   preferences: preferencesSettings
      // });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setSuccessMessage('Settings saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: unknown) {
      console.error('Error saving settings:', error);
      const errorMessage = error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { data?: { detail?: string } } }).response?.data?.detail
        : undefined;
      setError(errorMessage || 'Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'notifications' as SettingsTab, name: 'Notifications', icon: BellIcon },
    { id: 'privacy' as SettingsTab, name: 'Privacy', icon: ShieldCheckIcon },
    { id: 'preferences' as SettingsTab, name: 'Preferences', icon: GlobeAltIcon },
    { id: 'account' as SettingsTab, name: 'Account', icon: UserCircleIcon }
  ];

  // Show loading while checking authentication or loading data
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">
            {authLoading ? 'Loading authentication...' : 'Loading settings...'}
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

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb />

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage your preferences and account settings</p>
        </div>
        <button
          onClick={handleSave}
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
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  ${activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center
                `}
              >
                <Icon className="h-5 w-5 mr-2" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Settings Content */}
      <div className="bg-white shadow rounded-lg">
        <div className="p-6">
          {/* Notifications Settings */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Email Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Email Notifications</label>
                      <p className="text-sm text-gray-500">Receive notifications via email</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNotificationSettings({ ...notificationSettings, email_notifications: !notificationSettings.email_notifications })}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                        notificationSettings.email_notifications ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          notificationSettings.email_notifications ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {notificationSettings.email_notifications && (
                    <div className="ml-6 space-y-4 border-l-2 border-gray-200 pl-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Course Updates</label>
                          <p className="text-sm text-gray-500">Get notified about course updates</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setNotificationSettings({ ...notificationSettings, course_updates: !notificationSettings.course_updates })}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                            notificationSettings.course_updates ? 'bg-indigo-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              notificationSettings.course_updates ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Assignment Deadlines</label>
                          <p className="text-sm text-gray-500">Reminders for upcoming deadlines</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setNotificationSettings({ ...notificationSettings, assignment_deadlines: !notificationSettings.assignment_deadlines })}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                            notificationSettings.assignment_deadlines ? 'bg-indigo-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              notificationSettings.assignment_deadlines ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-gray-700">New Messages</label>
                          <p className="text-sm text-gray-500">Notifications for new messages</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setNotificationSettings({ ...notificationSettings, new_messages: !notificationSettings.new_messages })}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                            notificationSettings.new_messages ? 'bg-indigo-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              notificationSettings.new_messages ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Announcements</label>
                          <p className="text-sm text-gray-500">Platform and course announcements</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setNotificationSettings({ ...notificationSettings, announcements: !notificationSettings.announcements })}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                            notificationSettings.announcements ? 'bg-indigo-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              notificationSettings.announcements ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Marketing Emails</label>
                          <p className="text-sm text-gray-500">Promotional and marketing content</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setNotificationSettings({ ...notificationSettings, marketing_emails: !notificationSettings.marketing_emails })}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                            notificationSettings.marketing_emails ? 'bg-indigo-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              notificationSettings.marketing_emails ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Push Notifications</label>
                      <p className="text-sm text-gray-500">Browser push notifications</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNotificationSettings({ ...notificationSettings, push_notifications: !notificationSettings.push_notifications })}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                        notificationSettings.push_notifications ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          notificationSettings.push_notifications ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Privacy Settings */}
          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Visibility</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Who can see your profile?</label>
                    <select
                      value={privacySettings.profile_visibility}
                      onChange={(e) => setPrivacySettings({ ...privacySettings, profile_visibility: e.target.value as 'public' | 'private' | 'organization' })}
                      className="block w-full md:w-64 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="public">Public - Everyone</option>
                      <option value="organization">Organization - Members only</option>
                      <option value="private">Private - Only me</option>
                    </select>
                  </div>

                  <div className="pt-4 border-t border-gray-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Show Email</label>
                        <p className="text-sm text-gray-500">Display your email on your profile</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPrivacySettings({ ...privacySettings, show_email: !privacySettings.show_email })}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                          privacySettings.show_email ? 'bg-indigo-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            privacySettings.show_email ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Show Phone</label>
                        <p className="text-sm text-gray-500">Display your phone number on your profile</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPrivacySettings({ ...privacySettings, show_phone: !privacySettings.show_phone })}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                          privacySettings.show_phone ? 'bg-indigo-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            privacySettings.show_phone ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Allow Messaging</label>
                        <p className="text-sm text-gray-500">Let others send you messages</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPrivacySettings({ ...privacySettings, allow_messaging: !privacySettings.allow_messaging })}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                          privacySettings.allow_messaging ? 'bg-indigo-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            privacySettings.allow_messaging ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Data Sharing</label>
                        <p className="text-sm text-gray-500">Allow data sharing for analytics</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPrivacySettings({ ...privacySettings, data_sharing: !privacySettings.data_sharing })}
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                          privacySettings.data_sharing ? 'bg-indigo-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            privacySettings.data_sharing ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Preferences Settings */}
          {activeTab === 'preferences' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Language & Region</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Language</label>
                    <select
                      value={preferencesSettings.language}
                      onChange={(e) => setPreferencesSettings({ ...preferencesSettings, language: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                      <option value="zh">Chinese</option>
                      <option value="ja">Japanese</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Timezone</label>
                    <select
                      value={preferencesSettings.timezone}
                      onChange={(e) => setPreferencesSettings({ ...preferencesSettings, timezone: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">Eastern Time (ET)</option>
                      <option value="America/Chicago">Central Time (CT)</option>
                      <option value="America/Denver">Mountain Time (MT)</option>
                      <option value="America/Los_Angeles">Pacific Time (PT)</option>
                      <option value="Europe/London">London (GMT)</option>
                      <option value="Europe/Paris">Paris (CET)</option>
                      <option value="Asia/Tokyo">Tokyo (JST)</option>
                      <option value="Asia/Shanghai">Shanghai (CST)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Display Preferences</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Theme</label>
                    <select
                      value={preferencesSettings.theme}
                      onChange={(e) => setPreferencesSettings({ ...preferencesSettings, theme: e.target.value as 'light' | 'dark' | 'system' })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="system">System</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date Format</label>
                    <select
                      value={preferencesSettings.date_format}
                      onChange={(e) => setPreferencesSettings({ ...preferencesSettings, date_format: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Time Format</label>
                    <select
                      value={preferencesSettings.time_format}
                      onChange={(e) => setPreferencesSettings({ ...preferencesSettings, time_format: e.target.value as '12h' | '24h' })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="12h">12-hour</option>
                      <option value="24h">24-hour</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Account Settings */}
          {activeTab === 'account' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Account Actions</h3>
                <div className="space-y-6">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Export Your Data</h4>
                    <p className="text-sm text-gray-500 mb-4">
                      Download a copy of your account data including courses, progress, and settings.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        // TODO: Implement data export
                        alert('Data export feature will be available soon.');
                      }}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Export Data
                    </button>
                  </div>

                  <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                    <h4 className="text-sm font-medium text-red-900 mb-2">Delete Account</h4>
                    <p className="text-sm text-red-700 mb-4">
                      Permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                          // TODO: Implement account deletion
                          alert('Account deletion feature will be available soon.');
                        }
                      }}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

