/**
 * System Settings Page
 * Super Admin page for managing platform settings
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { 
  CogIcon,
  GlobeAltIcon,
  EnvelopeIcon,
  CreditCardIcon,
  ShieldCheckIcon,
  BellIcon,
  ServerIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Breadcrumb from '@/components/ui/Breadcrumb';
// import { apiClient } from '@/lib/api/client'; // TODO: Uncomment when API is ready

interface PlatformSettings {
  app_name: string;
  app_version: string;
  support_email: string;
  support_phone: string;
  website_url: string;
  maintenance_mode: boolean;
  registration_enabled: boolean;
  email_verification_required: boolean;
}

interface EmailSettings {
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_tls: boolean;
  from_email: string;
  from_name: string;
}

interface PaymentSettings {
  stripe_enabled: boolean;
  stripe_public_key: string;
  currency: string;
  default_plan_price: number;
}

interface SecuritySettings {
  session_timeout: number;
  max_login_attempts: number;
  password_min_length: number;
  require_strong_password: boolean;
  two_factor_enabled: boolean;
}

type SettingsTab = 'general' | 'email' | 'payment' | 'security' | 'notifications' | 'advanced';

export default function SettingsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

  // Settings state
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>({
    app_name: 'InfoFit Labs LMS',
    app_version: '1.0.0',
    support_email: 'support@infofitlabs.com',
    support_phone: '+1-555-0123',
    website_url: 'https://infofitlabs.com',
    maintenance_mode: false,
    registration_enabled: true,
    email_verification_required: true
  });

  const [emailSettings, setEmailSettings] = useState<EmailSettings>({
    smtp_host: 'smtp.gmail.com',
    smtp_port: 587,
    smtp_user: '',
    smtp_tls: true,
    from_email: 'noreply@infofitlabs.com',
    from_name: 'InfoFit Labs LMS'
  });

  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    stripe_enabled: false,
    stripe_public_key: '',
    currency: 'USD',
    default_plan_price: 99.99
  });

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    session_timeout: 30,
    max_login_attempts: 5,
    password_min_length: 8,
    require_strong_password: true,
    two_factor_enabled: false
  });

  // Check if user is super admin or organization admin
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (!authLoading && user && user.role !== 'super_admin' && user.role !== 'organization_admin') {
      router.push('/dashboard');
    }
  }, [user, router, authLoading]);

  useEffect(() => {
    if (!authLoading && (user?.role === 'super_admin' || user?.role === 'organization_admin')) {
      loadSettings();
    }
  }, [user, authLoading]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError('');

      // TODO: Replace with actual API call
      // const response = await apiClient.getPlatformSettings();
      // setPlatformSettings(response.data.platform);
      // setEmailSettings(response.data.email);
      // setPaymentSettings(response.data.payment);
      // setSecuritySettings(response.data.security);

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
      // await apiClient.updatePlatformSettings({
      //   platform: platformSettings,
      //   email: emailSettings,
      //   payment: paymentSettings,
      //   security: securitySettings
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
    { id: 'general' as SettingsTab, name: 'General', icon: GlobeAltIcon },
    { id: 'email' as SettingsTab, name: 'Email', icon: EnvelopeIcon },
    { id: 'payment' as SettingsTab, name: 'Payment', icon: CreditCardIcon },
    { id: 'security' as SettingsTab, name: 'Security', icon: ShieldCheckIcon },
    { id: 'notifications' as SettingsTab, name: 'Notifications', icon: BellIcon },
    { id: 'advanced' as SettingsTab, name: 'Advanced', icon: ServerIcon }
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

  // Don't render if not super admin or organization admin
  if (!user || (user.role !== 'super_admin' && user.role !== 'organization_admin')) {
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
          <h1 className="text-2xl font-bold text-gray-900">
            {user?.role === 'super_admin' ? 'System Settings' : 'Organization Settings'}
          </h1>
          <p className="text-gray-600">
            {user?.role === 'super_admin' 
              ? 'Manage platform configuration and preferences'
              : 'Manage your organization settings and preferences'}
          </p>
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
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Platform Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">App Name</label>
                    <input
                      type="text"
                      value={platformSettings.app_name}
                      onChange={(e) => setPlatformSettings({ ...platformSettings, app_name: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">App Version</label>
                    <input
                      type="text"
                      value={platformSettings.app_version}
                      onChange={(e) => setPlatformSettings({ ...platformSettings, app_version: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Support Email</label>
                    <input
                      type="email"
                      value={platformSettings.support_email}
                      onChange={(e) => setPlatformSettings({ ...platformSettings, support_email: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Support Phone</label>
                    <input
                      type="text"
                      value={platformSettings.support_phone}
                      onChange={(e) => setPlatformSettings({ ...platformSettings, support_phone: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Website URL</label>
                    <input
                      type="url"
                      value={platformSettings.website_url}
                      onChange={(e) => setPlatformSettings({ ...platformSettings, website_url: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Platform Features</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Maintenance Mode</label>
                      <p className="text-sm text-gray-500">Enable to put the platform in maintenance mode</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPlatformSettings({ ...platformSettings, maintenance_mode: !platformSettings.maintenance_mode })}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                        platformSettings.maintenance_mode ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          platformSettings.maintenance_mode ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Registration Enabled</label>
                      <p className="text-sm text-gray-500">Allow new users to register</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPlatformSettings({ ...platformSettings, registration_enabled: !platformSettings.registration_enabled })}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                        platformSettings.registration_enabled ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          platformSettings.registration_enabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Email Verification Required</label>
                      <p className="text-sm text-gray-500">Require users to verify their email address</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPlatformSettings({ ...platformSettings, email_verification_required: !platformSettings.email_verification_required })}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                        platformSettings.email_verification_required ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          platformSettings.email_verification_required ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Email Settings */}
          {activeTab === 'email' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">SMTP Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">SMTP Host</label>
                    <input
                      type="text"
                      value={emailSettings.smtp_host}
                      onChange={(e) => setEmailSettings({ ...emailSettings, smtp_host: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">SMTP Port</label>
                    <input
                      type="number"
                      value={emailSettings.smtp_port}
                      onChange={(e) => setEmailSettings({ ...emailSettings, smtp_port: parseInt(e.target.value) })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">SMTP Username</label>
                    <input
                      type="text"
                      value={emailSettings.smtp_user}
                      onChange={(e) => setEmailSettings({ ...emailSettings, smtp_user: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">From Email</label>
                    <input
                      type="email"
                      value={emailSettings.from_email}
                      onChange={(e) => setEmailSettings({ ...emailSettings, from_email: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">From Name</label>
                    <input
                      type="text"
                      value={emailSettings.from_name}
                      onChange={(e) => setEmailSettings({ ...emailSettings, from_name: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={emailSettings.smtp_tls}
                      onChange={(e) => setEmailSettings({ ...emailSettings, smtp_tls: e.target.checked })}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-700">Enable TLS/SSL</label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payment Settings */}
          {activeTab === 'payment' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Gateway</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Enable Stripe</label>
                      <p className="text-sm text-gray-500">Enable Stripe payment processing</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPaymentSettings({ ...paymentSettings, stripe_enabled: !paymentSettings.stripe_enabled })}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                        paymentSettings.stripe_enabled ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          paymentSettings.stripe_enabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                  {paymentSettings.stripe_enabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-200">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Stripe Public Key</label>
                        <input
                          type="text"
                          value={paymentSettings.stripe_public_key}
                          onChange={(e) => setPaymentSettings({ ...paymentSettings, stripe_public_key: e.target.value })}
                          placeholder="pk_test_..."
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Currency</label>
                        <select
                          value={paymentSettings.currency}
                          onChange={(e) => setPaymentSettings({ ...paymentSettings, currency: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="USD">USD ($)</option>
                          <option value="EUR">EUR (€)</option>
                          <option value="GBP">GBP (£)</option>
                          <option value="INR">INR (₹)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Default Plan Price</label>
                        <input
                          type="number"
                          step="0.01"
                          value={paymentSettings.default_plan_price}
                          onChange={(e) => setPaymentSettings({ ...paymentSettings, default_plan_price: parseFloat(e.target.value) })}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Authentication & Security</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Session Timeout (minutes)</label>
                    <input
                      type="number"
                      value={securitySettings.session_timeout}
                      onChange={(e) => setSecuritySettings({ ...securitySettings, session_timeout: parseInt(e.target.value) })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Max Login Attempts</label>
                    <input
                      type="number"
                      value={securitySettings.max_login_attempts}
                      onChange={(e) => setSecuritySettings({ ...securitySettings, max_login_attempts: parseInt(e.target.value) })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Password Min Length</label>
                    <input
                      type="number"
                      value={securitySettings.password_min_length}
                      onChange={(e) => setSecuritySettings({ ...securitySettings, password_min_length: parseInt(e.target.value) })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Require Strong Password</label>
                      <p className="text-sm text-gray-500">Enforce password complexity requirements</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSecuritySettings({ ...securitySettings, require_strong_password: !securitySettings.require_strong_password })}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                        securitySettings.require_strong_password ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          securitySettings.require_strong_password ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Two-Factor Authentication</label>
                      <p className="text-sm text-gray-500">Enable 2FA for enhanced security</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSecuritySettings({ ...securitySettings, two_factor_enabled: !securitySettings.two_factor_enabled })}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                        securitySettings.two_factor_enabled ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          securitySettings.two_factor_enabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Settings */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h3>
                <p className="text-sm text-gray-500">Configure system-wide notification settings</p>
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Notification settings will be available soon.</p>
                </div>
              </div>
            </div>
          )}

          {/* Advanced Settings */}
          {activeTab === 'advanced' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Advanced Configuration</h3>
                <p className="text-sm text-gray-500">System-level settings and configurations</p>
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Advanced settings will be available soon.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

