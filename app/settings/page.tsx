'use client';

import { useEffect, useState } from 'react';
import { Database, Download, Upload, Trash2, Bell, Save, AlertCircle, RefreshCw, Users, Loader2, Mail, Send, CheckCircle, XCircle } from 'lucide-react';
import { 
  getMaterialsFromSupabase, 
  getTransactionsFromSupabase, 
  getDefectsFromSupabase, 
  getAlertsFromSupabase, 
  getUsersFromSupabase, 
  deleteUserFromSupabase 
} from '@/lib/supabase-storage';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import ConfirmModal from '@/components/ConfirmModal';
import AlertModal from '@/components/AlertModal';

const defaultNotificationSettings = {
  emailAlerts: false,
  emailRecipients: 'warehouseautocarpets@gmail.com',
  alertEmails: true,
  transactionEmails: false,
  defectEmails: true,
};

export default function SettingsPage() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'data' | 'notifications' | 'users'>('data');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState(defaultNotificationSettings);
  const [stats, setStats] = useState({ materials: 0, transactions: 0, defects: 0, alerts: 0 });
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [emailConfigured, setEmailConfigured] = useState(false);
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [testEmailStatus, setTestEmailStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Custom modal states
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  }>({ isOpen: false, title: '', message: '', type: 'info' });
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'danger' | 'warning' | 'success' | 'info';
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', type: 'warning', onConfirm: () => {} });

  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setAlertModal({ isOpen: true, title, message, type });
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void, type: 'danger' | 'warning' = 'warning') => {
    setConfirmModal({ isOpen: true, title, message, type, onConfirm });
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const savedNotifications = localStorage.getItem('notificationSettings');
      if (savedNotifications) {
        setNotificationSettings({ ...defaultNotificationSettings, ...JSON.parse(savedNotifications) });
      }
    } catch (error) {
      console.error('Failed to load settings from localStorage', error);
    }
    
    loadStats();
    checkEmailConfig();
  }, []);

  const checkEmailConfig = async () => {
    try {
      const res = await fetch('/api/email');
      const data = await res.json();
      setEmailConfigured(data.configured);
    } catch (error) {
      console.error('Failed to check email config:', error);
      setEmailConfigured(false);
    }
  };

  const handleTestEmail = async () => {
    if (!notificationSettings.emailRecipients) {
      showAlert('Missing Email', 'Please enter an email address first', 'warning');
      return;
    }

    setIsTestingEmail(true);
    setTestEmailStatus('idle');

    try {
      const res = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'alert',
          to: notificationSettings.emailRecipients,
          data: {
            materialCode: 'TEST-001',
            materialDescription: 'Test Material - Email Configuration',
            localQuantity: 100,
            sapQuantity: 95,
            variance: 5,
            severity: 'warning',
            createdAt: new Date().toISOString(),
          },
        }),
      });

      const result = await res.json();
      
      console.log('Email API response:', { status: res.status, result });
      
      if (result.success) {
        setTestEmailStatus('success');
        showAlert('Email Sent', 'Test email sent successfully!', 'success');
        setTimeout(() => setTestEmailStatus('idle'), 5000);
      } else {
        setTestEmailStatus('error');
        const errorMessage = result.error || `Server returned status ${res.status}`;
        console.error('Email send failed:', errorMessage);
        showAlert('Email Failed', `Failed to send test email: ${errorMessage}`, 'error');
        setTimeout(() => setTestEmailStatus('idle'), 5000);
      }
    } catch (error) {
      console.error('Test email error:', error);
      setTestEmailStatus('error');
      const errorMessage = error instanceof Error ? error.message : 'Network error or server unavailable';
      showAlert('Email Failed', `Failed to send test email: ${errorMessage}. Please check your RESEND_API_KEY configuration.`, 'error');
      setTimeout(() => setTestEmailStatus('idle'), 5000);
    } finally {
      setIsTestingEmail(false);
    }
  };

  const loadStats = async () => {
    setIsLoadingStats(true);
    const [materials, transactions, defects, alerts] = await Promise.all([
      getMaterialsFromSupabase(),
      getTransactionsFromSupabase(),
      getDefectsFromSupabase(),
      getAlertsFromSupabase()
    ]);
    setStats({
      materials: materials.length,
      transactions: transactions.length,
      defects: defects.length,
      alerts: alerts.length,
    });
    setIsLoadingStats(false);
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const [materials, transactions, defects, alerts] = await Promise.all([
        getMaterialsFromSupabase(),
        getTransactionsFromSupabase(),
        getDefectsFromSupabase(),
        getAlertsFromSupabase()
      ]);

      const data = {
        materials,
        transactions,
        defects,
        alerts,
        exportDate: new Date().toISOString(),
        version: '1.0.0',
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `autocarpets-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setTimeout(() => setIsExporting(false), 1000);
    } catch (error) {
      console.error('Export failed:', error);
      setIsExporting(false);
      showAlert('Export Failed', 'Export failed. Please try again.', 'error');
    }
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        if (!data.materials && !data.transactions && !data.defects && !data.alerts) {
          throw new Error('Invalid backup file format');
        }
        
        showConfirm(
          'Import Data',
          'This will replace all existing data. Are you sure?',
          () => {
            showAlert('Information', 'Data import to Supabase requires backend implementation. Please contact your administrator.', 'info');
          },
          'warning'
        );
        setIsImporting(false);
      } catch (error) {
        console.error('Import failed:', error);
        setIsImporting(false);
        showAlert('Import Failed', 'Invalid file format. Please check your backup file.', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleClearAllData = () => {
    showConfirm(
      'Clear All Data',
      'Are you absolutely sure? This will delete ALL data and cannot be undone!',
      () => {
        setIsClearing(true);
        showAlert('Information', 'Data clearing from Supabase requires backend implementation. Please contact your administrator.', 'info');
        setIsClearing(false);
      },
      'danger'
    );
  };

  const handleSaveSettings = () => {
    localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings));
    showAlert('Success', 'Settings saved successfully!', 'success');
  };

  const tabs = [
    { id: 'data', label: 'Data Management', icon: Database },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    ...(user?.role === 'admin' ? [{ id: 'users', label: 'User Management', icon: Users }] : []),
  ];

  // Theme-aware classes
  const bgMain = theme === 'dark' 
    ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-black' 
    : 'bg-gradient-to-br from-slate-50 via-white to-slate-100';
  const borderColor = theme === 'dark' ? 'border-slate-800/50' : 'border-slate-200';
  const textPrimary = theme === 'dark' ? 'text-white' : 'text-slate-900';
  const textSecondary = theme === 'dark' ? 'text-slate-400' : 'text-slate-600';
  const textMuted = theme === 'dark' ? 'text-slate-500' : 'text-slate-500';
  const bgCard = theme === 'dark' ? 'bg-slate-800' : 'bg-white';
  const borderCard = theme === 'dark' ? 'border-slate-700' : 'border-slate-200';

  return (
    <div className={`min-h-screen ${bgMain} transition-colors duration-300`}>
      {/* Header */}
      <div className={`border-b ${borderColor} transition-colors duration-300`}>
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className={`text-xl sm:text-2xl font-bold ${textPrimary} transition-colors duration-300`}>Settings</h1>
              <p className={`text-xs sm:text-sm ${textSecondary} mt-1 transition-colors duration-300`}>Manage system preferences and configurations</p>
            </div>
            <button
              onClick={handleSaveSettings}
              className="px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all flex items-center gap-2"
            >
              <Save size={16} />
              Save Settings
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8">
        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                    : theme === 'dark'
                      ? 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/50 border border-slate-700/50'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Data Management Tab */}
        {activeTab === 'data' && (
          <div className="space-y-6">
            {/* Data Statistics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {isLoadingStats ? (
                <div className="col-span-full flex justify-center py-12">
                  <Loader2 className="animate-spin text-amber-500" size={32} />
                </div>
              ) : (
                <>
                  <div className={`${bgCard} rounded-xl p-5 border ${borderCard} transition-colors duration-300`}>
                    <p className={`text-xs font-medium ${textMuted} mb-2 uppercase tracking-wide transition-colors duration-300`}>Materials</p>
                    <p className={`text-3xl font-bold ${textPrimary} transition-colors duration-300`}>{stats.materials}</p>
                  </div>
                  <div className={`${bgCard} rounded-xl p-5 border ${borderCard} transition-colors duration-300`}>
                    <p className={`text-xs font-medium ${textMuted} mb-2 uppercase tracking-wide transition-colors duration-300`}>Transactions</p>
                    <p className={`text-3xl font-bold ${textPrimary} transition-colors duration-300`}>{stats.transactions}</p>
                  </div>
                  <div className={`${bgCard} rounded-xl p-5 border ${borderCard} transition-colors duration-300`}>
                    <p className={`text-xs font-medium ${textMuted} mb-2 uppercase tracking-wide transition-colors duration-300`}>Defects</p>
                    <p className={`text-3xl font-bold ${textPrimary} transition-colors duration-300`}>{stats.defects}</p>
                  </div>
                  <div className={`${bgCard} rounded-xl p-5 border ${borderCard} transition-colors duration-300`}>
                    <p className={`text-xs font-medium ${textMuted} mb-2 uppercase tracking-wide transition-colors duration-300`}>Alerts</p>
                    <p className={`text-3xl font-bold ${textPrimary} transition-colors duration-300`}>{stats.alerts}</p>
                  </div>
                </>
              )}
            </div>

            {/* Database Status */}
            <div className={`${bgCard} rounded-xl p-5 border ${borderCard} transition-colors duration-300`}>
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${isSupabaseConfigured() ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                <div>
                  <p className={`text-sm font-medium ${textPrimary} transition-colors duration-300`}>
                    {isSupabaseConfigured() ? 'Supabase Connected' : 'Using Local Storage'}
                  </p>
                  <p className={`text-xs ${textMuted} transition-colors duration-300`}>
                    {isSupabaseConfigured() ? 'Data is synced to cloud database' : 'Data is stored locally in browser'}
                  </p>
                </div>
              </div>
            </div>

            {/* Export & Import */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Export Data */}
              <div className={`${bgCard} rounded-xl p-5 border ${borderCard} transition-colors duration-300`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-emerald-500/10 rounded-lg">
                    <Download className="text-emerald-400" size={20} />
                  </div>
                  <div>
                    <h3 className={`text-base font-semibold ${textPrimary} transition-colors duration-300`}>Export Data</h3>
                    <p className={`text-xs ${textMuted} transition-colors duration-300`}>Download backup as JSON</p>
                  </div>
                </div>
                <button
                  onClick={handleExportData}
                  disabled={isExporting}
                  className={`w-full px-4 py-2.5 rounded-lg transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 border ${
                    theme === 'dark'
                      ? 'bg-slate-700/50 text-white hover:bg-slate-600/50 border-slate-600/50'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300 border-slate-300'
                  }`}
                >
                  {isExporting ? (
                    <>
                      <RefreshCw className="animate-spin" size={16} />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download size={16} />
                      Export All Data
                    </>
                  )}
                </button>
              </div>

              {/* Import Data */}
              <div className={`${bgCard} rounded-xl p-5 border ${borderCard} transition-colors duration-300`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-blue-500/10 rounded-lg">
                    <Upload className="text-blue-400" size={20} />
                  </div>
                  <div>
                    <h3 className={`text-base font-semibold ${textPrimary} transition-colors duration-300`}>Import Data</h3>
                    <p className={`text-xs ${textMuted} transition-colors duration-300`}>Restore from backup file</p>
                  </div>
                </div>
                <label className={`w-full px-4 py-2.5 rounded-lg transition-colors font-medium flex items-center justify-center gap-2 cursor-pointer border ${
                  theme === 'dark'
                    ? 'bg-slate-700/50 text-white hover:bg-slate-600/50 border-slate-600/50'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300 border-slate-300'
                }`}>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportData}
                    className="hidden"
                    disabled={isImporting}
                  />
                  {isImporting ? (
                    <>
                      <RefreshCw className="animate-spin" size={16} />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      Import Backup
                    </>
                  )}
                </label>
              </div>
            </div>

            {/* Clear All Data */}
            <div className={`${theme === 'dark' ? 'bg-red-950/30' : 'bg-red-50'} rounded-xl p-5 border ${theme === 'dark' ? 'border-red-900/50' : 'border-red-200'} transition-colors duration-300`}>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-red-500/10 rounded-lg">
                    <AlertCircle className="text-red-400" size={20} />
                  </div>
                  <div>
                    <h3 className={`text-base font-semibold ${textPrimary} transition-colors duration-300`}>Danger Zone</h3>
                    <p className={`text-xs ${textSecondary} transition-colors duration-300`}>Permanently delete all data from the system</p>
                  </div>
                </div>
                <button
                  onClick={handleClearAllData}
                  disabled={isClearing}
                  className="px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
                >
                  {isClearing ? (
                    <>
                      <RefreshCw className="animate-spin" size={16} />
                      Clearing...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      Clear All Data
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            {/* Email Configuration Status */}
            <div className={`rounded-xl p-5 border transition-colors duration-300 ${
              emailConfigured 
                ? theme === 'dark' 
                  ? 'bg-emerald-950/30 border-emerald-900/50' 
                  : 'bg-emerald-50 border-emerald-200'
                : theme === 'dark'
                  ? 'bg-amber-950/30 border-amber-900/50'
                  : 'bg-amber-50 border-amber-200'
            }`}>
              <div className="flex items-center gap-3">
                {emailConfigured ? (
                  <CheckCircle className="text-emerald-400 shrink-0" size={24} />
                ) : (
                  <AlertCircle className="text-amber-400 shrink-0" size={24} />
                )}
                <div>
                  <p className={`font-semibold transition-colors duration-300 ${
                    emailConfigured 
                      ? theme === 'dark' ? 'text-emerald-300' : 'text-emerald-700'
                      : theme === 'dark' ? 'text-amber-300' : 'text-amber-700'
                  }`}>
                    {emailConfigured ? 'Email Service Connected' : 'Email Service Not Configured'}
                  </p>
                  <p className={`text-sm ${textSecondary} transition-colors duration-300`}>
                    {emailConfigured 
                      ? 'Email notifications are ready to send' 
                      : 'Set RESEND_API_KEY in environment variables to enable email notifications'}
                  </p>
                </div>
              </div>
            </div>

            {/* Email Notifications Settings */}
            <div className={`${bgCard} rounded-xl p-6 border ${borderCard} transition-colors duration-300`}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-500/10 rounded-lg">
                    <Mail className="text-amber-400" size={20} />
                  </div>
                  <div>
                    <h3 className={`text-lg font-semibold ${textPrimary} transition-colors duration-300`}>Email Notifications</h3>
                    <p className={`text-sm ${textMuted} transition-colors duration-300`}>Receive alerts via email</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationSettings.emailAlerts}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, emailAlerts: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className={`w-11 h-6 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500 transition-colors duration-300 ${
                    theme === 'dark' ? 'bg-slate-700' : 'bg-slate-300'
                  }`}></div>
                </label>
              </div>

              {notificationSettings.emailAlerts && (
                <div className={`space-y-5 pt-5 border-t ${theme === 'dark' ? 'border-slate-700/50' : 'border-slate-200'} transition-colors duration-300`}>
                  {/* Email Recipients */}
                  <div>
                    <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} mb-2 transition-colors duration-300`}>Email Address</label>
                    <input
                      type="email"
                      value={notificationSettings.emailRecipients}
                      onChange={(e) => setNotificationSettings({ ...notificationSettings, emailRecipients: e.target.value })}
                      placeholder="warehouseautocarpets@gmail.com"
                      className={`w-full px-4 py-3 border rounded-xl ${textPrimary} placeholder-slate-500 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all ${
                        theme === 'dark' 
                          ? 'bg-slate-900/50 border-slate-600/50' 
                          : 'bg-slate-50 border-slate-300'
                      }`}
                    />
                  </div>

                  {/* Notification Types */}
                  <div>
                    <p className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'} mb-3 transition-colors duration-300`}>Notification Types</p>
                    <div className="space-y-3">
                      <label className={`flex items-center gap-3 cursor-pointer p-3 rounded-lg transition-colors ${
                        theme === 'dark' 
                          ? 'bg-slate-900/30 hover:bg-slate-900/50' 
                          : 'bg-slate-100 hover:bg-slate-200'
                      }`}>
                        <input
                          type="checkbox"
                          checked={notificationSettings.alertEmails}
                          onChange={(e) => setNotificationSettings({ ...notificationSettings, alertEmails: e.target.checked })}
                          className={`w-4 h-4 text-amber-500 rounded focus:ring-amber-500 ${
                            theme === 'dark' 
                              ? 'bg-slate-700 border-slate-600' 
                              : 'bg-white border-slate-300'
                          }`}
                        />
                        <div>
                          <span className={`text-sm ${textPrimary} font-medium transition-colors duration-300`}>SAP Mismatch Alerts</span>
                          <p className={`text-xs ${textMuted} transition-colors duration-300`}>Get notified when inventory doesn't match SAP</p>
                        </div>
                      </label>

                      <label className={`flex items-center gap-3 cursor-pointer p-3 rounded-lg transition-colors ${
                        theme === 'dark' 
                          ? 'bg-slate-900/30 hover:bg-slate-900/50' 
                          : 'bg-slate-100 hover:bg-slate-200'
                      }`}>
                        <input
                          type="checkbox"
                          checked={notificationSettings.transactionEmails}
                          onChange={(e) => setNotificationSettings({ ...notificationSettings, transactionEmails: e.target.checked })}
                          className={`w-4 h-4 text-amber-500 rounded focus:ring-amber-500 ${
                            theme === 'dark' 
                              ? 'bg-slate-700 border-slate-600' 
                              : 'bg-white border-slate-300'
                          }`}
                        />
                        <div>
                          <span className={`text-sm ${textPrimary} font-medium transition-colors duration-300`}>Transaction Notifications</span>
                          <p className={`text-xs ${textMuted} transition-colors duration-300`}>Receiving and issuance activities</p>
                        </div>
                      </label>

                      <label className={`flex items-center gap-3 cursor-pointer p-3 rounded-lg transition-colors ${
                        theme === 'dark' 
                          ? 'bg-slate-900/30 hover:bg-slate-900/50' 
                          : 'bg-slate-100 hover:bg-slate-200'
                      }`}>
                        <input
                          type="checkbox"
                          checked={notificationSettings.defectEmails}
                          onChange={(e) => setNotificationSettings({ ...notificationSettings, defectEmails: e.target.checked })}
                          className={`w-4 h-4 text-amber-500 rounded focus:ring-amber-500 ${
                            theme === 'dark' 
                              ? 'bg-slate-700 border-slate-600' 
                              : 'bg-white border-slate-300'
                          }`}
                        />
                        <div>
                          <span className={`text-sm ${textPrimary} font-medium transition-colors duration-300`}>Defect Reports</span>
                          <p className={`text-xs ${textMuted} transition-colors duration-300`}>New defects reported in the system</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Test Email Button */}
                  <div className="pt-2">
                    <button
                      onClick={handleTestEmail}
                      disabled={isTestingEmail || !emailConfigured || !notificationSettings.emailRecipients}
                      className={`px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all ${
                        testEmailStatus === 'success' 
                          ? 'bg-emerald-600 text-white'
                          : testEmailStatus === 'error'
                          ? 'bg-red-600 text-white'
                          : theme === 'dark'
                            ? 'bg-slate-700 text-white hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed'
                            : 'bg-slate-300 text-slate-700 hover:bg-slate-400 disabled:opacity-50 disabled:cursor-not-allowed'
                      }`}
                    >
                      {isTestingEmail ? (
                        <>
                          <Loader2 className="animate-spin" size={16} />
                          Sending...
                        </>
                      ) : testEmailStatus === 'success' ? (
                        <>
                          <CheckCircle size={16} />
                          Email Sent!
                        </>
                      ) : testEmailStatus === 'error' ? (
                        <>
                          <XCircle size={16} />
                          Failed
                        </>
                      ) : (
                        <>
                          <Send size={16} />
                          Send Test Email
                        </>
                      )}
                    </button>
                    {!emailConfigured && (
                      <p className="text-xs text-amber-400 mt-2">Configure RESEND_API_KEY to enable email testing</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* User Management Tab - Admin Only */}
        {activeTab === 'users' && user?.role === 'admin' && (
          <div className="space-y-6">
            {/* User List */}
            <div className={`${bgCard} rounded-xl p-6 border ${borderCard} transition-colors duration-300`}>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-amber-500/10 rounded-lg">
                  <Users className="text-amber-400" size={20} />
                </div>
                <div>
                  <h3 className={`text-lg font-semibold ${textPrimary} transition-colors duration-300`}>Registered Users</h3>
                  <p className={`text-sm ${textMuted} transition-colors duration-300`}>View and manage user accounts</p>
                </div>
              </div>
              <UserList />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// User List Component
function UserList() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteUserModal, setDeleteUserModal] = useState<{ isOpen: boolean; userId: string; userEmail: string }>({
    isOpen: false,
    userId: '',
    userEmail: '',
  });
  const [userAlertModal, setUserAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  }>({ isOpen: false, title: '', message: '', type: 'info' });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    if (isSupabaseConfigured()) {
      const data = await getUsersFromSupabase();
      setUsers(data);
    } else {
      const savedUsers = JSON.parse(localStorage.getItem('users') || '[]');
      setUsers(savedUsers);
    }
    setIsLoading(false);
  };

  const handleDeleteClick = (userId: string, userEmail: string) => {
    setDeleteUserModal({ isOpen: true, userId, userEmail });
  };

  const handleDeleteConfirm = async () => {
    const { userId } = deleteUserModal;
    setDeleteUserModal({ isOpen: false, userId: '', userEmail: '' });
    
    if (isSupabaseConfigured()) {
      const success = await deleteUserFromSupabase(userId);
      if (success) {
        await loadUsers();
      } else {
        setUserAlertModal({ isOpen: true, title: 'Error', message: 'Failed to delete user. Please try again.', type: 'error' });
      }
    } else {
      const updatedUsers = users.filter(u => u.id !== userId);
      localStorage.setItem('users', JSON.stringify(updatedUsers));
      setUsers(updatedUsers);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'manager': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'staff': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="animate-spin text-amber-500" size={32} />
      </div>
    );
  }

  const { theme } = useTheme();
  const textPrimary = theme === 'dark' ? 'text-white' : 'text-slate-900';
  const textSecondary = theme === 'dark' ? 'text-slate-400' : 'text-slate-600';
  const textMuted = theme === 'dark' ? 'text-slate-500' : 'text-slate-500';
  const bgCard = theme === 'dark' ? 'bg-slate-900/50' : 'bg-slate-50';
  const borderCard = theme === 'dark' ? 'border-slate-700/50' : 'border-slate-200';

  if (users.length === 0) {
    return (
      <div className="text-center py-8">
        <Users className={`mx-auto ${textMuted} mb-3 transition-colors duration-300`} size={32} />
        <p className={`text-sm ${textSecondary} transition-colors duration-300`}>No users found</p>
        <p className={`text-xs ${textMuted} mt-1 transition-colors duration-300`}>Create a user account to get started</p>
      </div>
    );
  }

  return (
    <>
      {/* Delete User Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteUserModal.isOpen}
        onClose={() => setDeleteUserModal({ isOpen: false, userId: '', userEmail: '' })}
        onConfirm={handleDeleteConfirm}
        title="Delete User"
        message={`Are you sure you want to delete user "${deleteUserModal.userEmail}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />

      {/* User Alert Modal */}
      <AlertModal
        isOpen={userAlertModal.isOpen}
        onClose={() => setUserAlertModal({ ...userAlertModal, isOpen: false })}
        title={userAlertModal.title}
        message={userAlertModal.message}
        type={userAlertModal.type}
      />

      <div className="space-y-3">
        {users.map((u) => (
          <div key={u.id} className={`flex items-center justify-between p-4 ${bgCard} rounded-xl border ${borderCard} transition-colors duration-300`}>
            <div className="flex items-center gap-3 min-w-0">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border transition-colors duration-300 ${
                theme === 'dark' 
                  ? 'bg-gradient-to-br from-slate-700 to-slate-800 border-slate-600/50' 
                  : 'bg-gradient-to-br from-slate-200 to-slate-300 border-slate-300'
              }`}>
                <span className={`${textPrimary} font-medium transition-colors duration-300`}>{u.name?.charAt(0)?.toUpperCase() || '?'}</span>
              </div>
              <div className="min-w-0">
                <p className={`${textPrimary} font-medium truncate transition-colors duration-300`}>{u.name}</p>
                <p className={`${textMuted} text-sm truncate transition-colors duration-300`}>{u.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${getRoleBadgeColor(u.role)}`}>
                {u.role?.toUpperCase()}
              </span>
              <button
                onClick={() => handleDeleteClick(u.id, u.email)}
                className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                title="Delete user"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
