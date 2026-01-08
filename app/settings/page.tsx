'use client';

import { useEffect, useState } from 'react';
import { Settings as SettingsIcon, Database, Download, Upload, Trash2, Bell, Zap, Globe, Save, AlertCircle, RefreshCw, Users, UserPlus, Loader2 } from 'lucide-react';
import { 
  getMaterialsFromSupabase, 
  getTransactionsFromSupabase, 
  getDefectsFromSupabase, 
  getAlertsFromSupabase, 
  getUsersFromSupabase, 
  deleteUserFromSupabase 
} from '@/lib/supabase-storage';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

const defaultNotificationSettings = {
  emailAlerts: false,
  smsAlerts: false,
  pushNotifications: true,
  alertFrequency: 'realtime',
};

const defaultSapSettings = {
  enabled: false,
  serverUrl: '',
  username: '',
  password: '',
  syncInterval: '30',
};

const defaultSystemSettings = {
  autoRefresh: true,
  refreshInterval: '5',
  theme: 'dark',
  language: 'en',
};

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'data' | 'system' | 'notifications' | 'sap' | 'users'>('data');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState(defaultNotificationSettings);
  const [sapSettings, setSapSettings] = useState(defaultSapSettings);
  const [systemSettings, setSystemSettings] = useState(defaultSystemSettings);
  const [stats, setStats] = useState({ materials: 0, transactions: 0, defects: 0, alerts: 0 });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Load saved settings on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const savedNotifications = localStorage.getItem('notificationSettings');
      if (savedNotifications) {
        setNotificationSettings({ ...defaultNotificationSettings, ...JSON.parse(savedNotifications) });
      }
      const savedSap = localStorage.getItem('sapSettings');
      if (savedSap) {
        setSapSettings({ ...defaultSapSettings, ...JSON.parse(savedSap) });
      }
      const savedSystem = localStorage.getItem('systemSettings');
      if (savedSystem) {
        setSystemSettings({ ...defaultSystemSettings, ...JSON.parse(savedSystem) });
      }
    } catch (error) {
      console.error('Failed to load settings from localStorage', error);
    }
    
    loadStats();
  }, []);

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
      a.download = `material-ims-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setTimeout(() => setIsExporting(false), 1000);
    } catch (error) {
      console.error('Export failed:', error);
      setIsExporting(false);
      alert('Export failed. Please try again.');
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
        
        if (confirm('This will replace all existing data. Are you sure?')) {
          // Note: For Supabase, you would need to implement batch insert/upsert operations
          // For now, we show a message about the limitation
          alert('Data import to Supabase requires backend implementation. Please contact your administrator.');
        }
        setIsImporting(false);
      } catch (error) {
        console.error('Import failed:', error);
        setIsImporting(false);
        alert('Invalid file format. Please check your backup file.');
      }
    };
    reader.readAsText(file);
  };

  const handleClearAllData = () => {
    if (confirm('Are you absolutely sure? This will delete ALL data and cannot be undone!')) {
      setIsClearing(true);
      // Note: For Supabase, you would need to implement proper data deletion
      alert('Data clearing from Supabase requires backend implementation. Please contact your administrator.');
      setIsClearing(false);
    }
  };

  const handleSaveSettings = () => {
    // Save settings to localStorage
    localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings));
    localStorage.setItem('sapSettings', JSON.stringify(sapSettings));
    localStorage.setItem('systemSettings', JSON.stringify(systemSettings));
    alert('Settings saved successfully!');
  };

  const tabs = [
    { id: 'data', label: 'Data Management', icon: Database },
    { id: 'system', label: 'System', icon: SettingsIcon },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'sap', label: 'SAP Integration', icon: Zap },
    ...(user?.role === 'admin' ? [{ id: 'users', label: 'User Management', icon: Users }] : []),
  ];

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-8 py-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-xl font-semibold text-white">Settings</h1>
            <p className="text-sm text-slate-400 mt-1">Manage your system preferences and configurations</p>
          </div>
          <button
            onClick={handleSaveSettings}
            className="px-4 py-2 text-sm font-medium text-white bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-2"
          >
            <Save size={16} />
            Save All Settings
          </button>
        </div>
      </div>

      <div className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Tabs */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800 rounded-lg border border-slate-700 p-4">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-slate-700 text-white border border-slate-600'
                          : 'text-slate-300 hover:bg-slate-700 hover:text-white border border-transparent'
                      }`}
                    >
                      <Icon size={18} />
                      <span className="text-sm font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
              
              {/* Supabase Status */}
              <div className="mt-4 pt-4 border-t border-slate-700">
                <div className="px-4 py-2">
                  <p className="text-xs text-slate-500 mb-2">Database Status</p>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isSupabaseConfigured() ? 'bg-emerald-500' : 'bg-slate-500'}`}></div>
                    <span className="text-xs text-slate-400">
                      {isSupabaseConfigured() ? 'Supabase Connected' : 'Using LocalStorage'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Data Management Tab */}
            {activeTab === 'data' && (
              <div className="space-y-6">
                <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
                  <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                    <Database className="text-slate-400" size={24} />
                    Data Management
                  </h2>

                  {/* Data Statistics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {isLoadingStats ? (
                      <div className="col-span-4 flex justify-center py-8">
                        <Loader2 className="animate-spin text-amber-500" size={32} />
                      </div>
                    ) : (
                      <>
                        <div className="bg-slate-900 rounded-lg p-6 border border-slate-700">
                          <p className="text-xs font-medium text-slate-400 mb-2 uppercase tracking-wide">Materials</p>
                          <p className="text-3xl font-bold text-white">{stats.materials}</p>
                        </div>
                        <div className="bg-slate-900 rounded-lg p-6 border border-slate-700">
                          <p className="text-xs font-medium text-slate-400 mb-2 uppercase tracking-wide">Transactions</p>
                          <p className="text-3xl font-bold text-white">{stats.transactions}</p>
                        </div>
                        <div className="bg-slate-900 rounded-lg p-6 border border-slate-700">
                          <p className="text-xs font-medium text-slate-400 mb-2 uppercase tracking-wide">Defects</p>
                          <p className="text-3xl font-bold text-white">{stats.defects}</p>
                        </div>
                        <div className="bg-slate-900 rounded-lg p-6 border border-slate-700">
                          <p className="text-xs font-medium text-slate-400 mb-2 uppercase tracking-wide">Alerts</p>
                          <p className="text-3xl font-bold text-white">{stats.alerts}</p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Export Data */}
                  <div className="bg-slate-900 rounded-lg p-5 border border-slate-700 mb-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-medium text-white mb-1">Export Data</h3>
                        <p className="text-sm text-slate-400">Download all your data as a JSON backup file</p>
                      </div>
                      <Download className="text-slate-400" size={24} />
                    </div>
                    <button
                      onClick={handleExportData}
                      disabled={isExporting}
                      className="w-full px-4 py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 border border-slate-700"
                    >
                      {isExporting ? (
                        <>
                          <RefreshCw className="animate-spin" size={18} />
                          Exporting...
                        </>
                      ) : (
                        <>
                          <Download size={18} />
                          Export All Data
                        </>
                      )}
                    </button>
                  </div>

                  {/* Import Data */}
                  <div className="bg-slate-900 rounded-lg p-5 border border-slate-700 mb-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-medium text-white mb-1">Import Data</h3>
                        <p className="text-sm text-slate-400">Restore data from a previously exported backup file</p>
                      </div>
                      <Upload className="text-slate-400" size={24} />
                    </div>
                    <label className="w-full px-4 py-3 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors font-medium flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 border border-slate-700">
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImportData}
                        className="hidden"
                        disabled={isImporting}
                      />
                      {isImporting ? (
                        <>
                          <RefreshCw className="animate-spin" size={18} />
                          Importing...
                        </>
                      ) : (
                        <>
                          <Upload size={18} />
                          Import Backup File
                        </>
                      )}
                    </label>
                  </div>

                  {/* Clear All Data */}
                  <div className="bg-slate-900 rounded-lg p-5 border border-rose-700">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-medium text-white mb-1 flex items-center gap-2">
                          <AlertCircle className="text-rose-400" size={20} />
                          Clear All Data
                        </h3>
                        <p className="text-sm text-slate-400">Permanently delete all data from the system</p>
                      </div>
                      <Trash2 className="text-rose-400" size={24} />
                    </div>
                    <button
                      onClick={handleClearAllData}
                      disabled={isClearing}
                      className="w-full px-4 py-3 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 border border-rose-700"
                    >
                      {isClearing ? (
                        <>
                          <RefreshCw className="animate-spin" size={18} />
                          Clearing...
                        </>
                      ) : (
                        <>
                          <Trash2 size={18} />
                          Clear All Data
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* System Settings Tab */}
            {activeTab === 'system' && (
              <div className="space-y-6">
                <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
                  <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                    <SettingsIcon className="text-slate-400" size={24} />
                    System Preferences
                  </h2>

                  <div className="space-y-6">
                    {/* Auto Refresh */}
                    <div className="bg-slate-900 rounded-lg p-5 border border-slate-700">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-1">Auto Refresh</h3>
                          <p className="text-sm text-slate-400">Automatically refresh data at regular intervals</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={systemSettings.autoRefresh}
                            onChange={(e) => setSystemSettings({ ...systemSettings, autoRefresh: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                        </label>
                      </div>
                      {systemSettings.autoRefresh && (
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-slate-300 mb-2">Refresh Interval (seconds)</label>
                          <select
                            value={systemSettings.refreshInterval}
                            onChange={(e) => setSystemSettings({ ...systemSettings, refreshInterval: e.target.value })}
                            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                          >
                            <option value="5">5 seconds</option>
                            <option value="10">10 seconds</option>
                            <option value="30">30 seconds</option>
                            <option value="60">1 minute</option>
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Theme */}
                    <div className="bg-slate-900 rounded-lg p-6 border border-slate-700">
                      <div className="mb-4">
                        <h3 className="text-lg font-medium text-white mb-1">Theme</h3>
                        <p className="text-sm text-slate-400">Choose your preferred color theme</p>
                      </div>
                      <select
                        value={systemSettings.theme}
                        onChange={(e) => setSystemSettings({ ...systemSettings, theme: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        disabled
                      >
                        <option value="dark">Dark (Current)</option>
                        <option value="light">Light (Coming Soon)</option>
                        <option value="auto">Auto (Coming Soon)</option>
                      </select>
                      <p className="text-xs text-slate-500 mt-2">Light theme and auto theme coming in future updates</p>
                    </div>

                    {/* Language */}
                    <div className="bg-slate-900 rounded-lg p-6 border border-slate-700">
                      <div className="mb-4">
                        <h3 className="text-lg font-medium text-white mb-1 flex items-center gap-2">
                          <Globe className="text-slate-400" size={18} />
                          Language
                        </h3>
                        <p className="text-sm text-slate-400">Select your preferred language</p>
                      </div>
                      <select
                        value={systemSettings.language}
                        onChange={(e) => setSystemSettings({ ...systemSettings, language: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        disabled
                      >
                        <option value="en">English</option>
                        <option value="es">Spanish (Coming Soon)</option>
                        <option value="fr">French (Coming Soon)</option>
                      </select>
                      <p className="text-xs text-slate-500 mt-2">Multi-language support coming in future updates</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
                  <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                    <Bell className="text-slate-400" size={24} />
                    Notification Preferences
                  </h2>

                  <div className="space-y-4">
                    {/* Email Alerts */}
                    <div className="bg-slate-900 rounded-lg p-6 border border-slate-700">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-medium text-white mb-1">Email Alerts</h3>
                          <p className="text-sm text-slate-400">Receive alerts via email</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notificationSettings.emailAlerts}
                            onChange={(e) => setNotificationSettings({ ...notificationSettings, emailAlerts: e.target.checked })}
                            className="sr-only peer"
                            disabled
                          />
                          <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500 opacity-50"></div>
                        </label>
                      </div>
                      <p className="text-xs text-slate-500 mt-2">Email notifications coming in future updates</p>
                    </div>

                    {/* SMS Alerts */}
                    <div className="bg-slate-900 rounded-lg p-6 border border-slate-700">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-medium text-white mb-1">SMS Alerts</h3>
                          <p className="text-sm text-slate-400">Receive alerts via SMS</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notificationSettings.smsAlerts}
                            onChange={(e) => setNotificationSettings({ ...notificationSettings, smsAlerts: e.target.checked })}
                            className="sr-only peer"
                            disabled
                          />
                          <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500 opacity-50"></div>
                        </label>
                      </div>
                      <p className="text-xs text-slate-500 mt-2">SMS notifications coming in future updates</p>
                    </div>

                    {/* Push Notifications */}
                    <div className="bg-slate-900 rounded-lg p-6 border border-slate-700">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-medium text-white mb-1">Push Notifications</h3>
                          <p className="text-sm text-slate-400">Receive browser push notifications</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notificationSettings.pushNotifications}
                            onChange={(e) => setNotificationSettings({ ...notificationSettings, pushNotifications: e.target.checked })}
                            className="sr-only peer"
                            disabled
                          />
                          <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500 opacity-50"></div>
                        </label>
                      </div>
                      <p className="text-xs text-slate-500 mt-2">Push notifications coming in future updates</p>
                    </div>

                    {/* Alert Frequency */}
                    <div className="bg-slate-900 rounded-lg p-6 border border-slate-700">
                      <div className="mb-4">
                        <h3 className="text-lg font-medium text-white mb-1">Alert Frequency</h3>
                        <p className="text-sm text-slate-400">How often to receive notifications</p>
                      </div>
                      <select
                        value={notificationSettings.alertFrequency}
                        onChange={(e) => setNotificationSettings({ ...notificationSettings, alertFrequency: e.target.value })}
                        className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      >
                        <option value="realtime">Real-time</option>
                        <option value="hourly">Hourly Summary</option>
                        <option value="daily">Daily Summary</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SAP Integration Tab */}
            {activeTab === 'sap' && (
              <div className="space-y-6">
                <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
                  <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                    <Zap className="text-slate-400" size={24} />
                    SAP Integration
                  </h2>

                  <div className="space-y-6">
                    {/* Enable SAP */}
                    <div className="bg-slate-900 rounded-lg p-6 border border-slate-700">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-medium text-white mb-1">Enable SAP Integration</h3>
                          <p className="text-sm text-slate-400">Connect to SAP ERP system for real-time synchronization</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={sapSettings.enabled}
                            onChange={(e) => setSapSettings({ ...sapSettings, enabled: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                        </label>
                      </div>
                    </div>

                    {sapSettings.enabled && (
                      <>
                        {/* Server URL */}
                        <div className="bg-slate-900 rounded-lg p-6 border border-slate-700">
                          <label className="block text-sm font-medium text-white mb-2">SAP Server URL</label>
                          <input
                            type="text"
                            value={sapSettings.serverUrl}
                            onChange={(e) => setSapSettings({ ...sapSettings, serverUrl: e.target.value })}
                            placeholder="https://sap-server.example.com"
                            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                          />
                        </div>

                        {/* Username */}
                        <div className="bg-slate-900 rounded-lg p-6 border border-slate-700">
                          <label className="block text-sm font-medium text-white mb-2">Username</label>
                          <input
                            type="text"
                            value={sapSettings.username}
                            onChange={(e) => setSapSettings({ ...sapSettings, username: e.target.value })}
                            placeholder="SAP Username"
                            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                          />
                        </div>

                        {/* Password */}
                        <div className="bg-slate-900 rounded-lg p-6 border border-slate-700">
                          <label className="block text-sm font-medium text-white mb-2">Password</label>
                          <input
                            type="password"
                            value={sapSettings.password}
                            onChange={(e) => setSapSettings({ ...sapSettings, password: e.target.value })}
                            placeholder="SAP Password"
                            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                          />
                        </div>

                        {/* Sync Interval */}
                        <div className="bg-slate-900 rounded-lg p-6 border border-slate-700">
                          <label className="block text-sm font-medium text-white mb-2">Sync Interval (seconds)</label>
                          <select
                            value={sapSettings.syncInterval}
                            onChange={(e) => setSapSettings({ ...sapSettings, syncInterval: e.target.value })}
                            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                          >
                            <option value="30">30 seconds</option>
                            <option value="60">1 minute</option>
                            <option value="300">5 minutes</option>
                            <option value="600">10 minutes</option>
                          </select>
                        </div>

                        {/* Connection Status */}
                        <div className="bg-slate-900 rounded-lg p-6 border border-slate-700">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-lg font-medium text-white mb-1">Connection Status</h3>
                              <p className="text-sm text-slate-400">Current SAP connection status</p>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-700/50 rounded-lg border border-slate-600/50">
                              <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                              <span className="text-sm font-medium text-slate-300">Not Connected</span>
                            </div>
                          </div>
                          <p className="text-xs text-slate-500 mt-3">SAP integration is currently in development. Configuration will be available in future updates.</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* User Management Tab - Admin Only */}
            {activeTab === 'users' && user?.role === 'admin' && (
              <div className="space-y-6">
                <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
                  <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                    <Users className="text-slate-400" size={24} />
                    User Management
                  </h2>

                  {/* Create New User */}
                  <div className="bg-slate-900 rounded-lg p-5 border border-slate-700 mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-medium text-white mb-1">Create New User</h3>
                        <p className="text-sm text-slate-400">Add a new user account to the system</p>
                      </div>
                      <UserPlus className="text-slate-400" size={24} />
                    </div>
                    <Link
                      href="/register"
                      className="w-full px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg hover:from-amber-600 hover:to-orange-700 transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      <UserPlus size={18} />
                      Create User Account
                    </Link>
                  </div>

                  {/* User List */}
                  <div className="bg-slate-900 rounded-lg p-5 border border-slate-700">
                    <h3 className="text-lg font-medium text-white mb-4">Registered Users</h3>
                    <UserList />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// User List Component
function UserList() {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    if (isSupabaseConfigured()) {
      const data = await getUsersFromSupabase();
      setUsers(data);
    } else {
      // Fallback to localStorage
      const savedUsers = JSON.parse(localStorage.getItem('users') || '[]');
      setUsers(savedUsers);
    }
    setIsLoading(false);
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (confirm(`Are you sure you want to delete user "${userEmail}"?`)) {
      if (isSupabaseConfigured()) {
        const success = await deleteUserFromSupabase(userId);
        if (success) {
          await loadUsers();
        } else {
          alert('Failed to delete user. Please try again.');
        }
      } else {
        // Fallback to localStorage
        const updatedUsers = users.filter(u => u.id !== userId);
        localStorage.setItem('users', JSON.stringify(updatedUsers));
        setUsers(updatedUsers);
      }
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

  if (users.length === 0) {
    return (
      <div className="text-center py-8">
        <Users className="mx-auto text-slate-600 mb-3" size={32} />
        <p className="text-sm text-slate-400">No users found</p>
        <p className="text-xs text-slate-500 mt-1">Create a user account to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {users.map((u) => (
        <div key={u.id} className="flex items-center justify-between p-4 bg-slate-800 rounded-lg border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
              <span className="text-white font-medium">{u.name?.charAt(0)?.toUpperCase() || '?'}</span>
            </div>
            <div>
              <p className="text-white font-medium">{u.name}</p>
              <p className="text-slate-400 text-sm">{u.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-medium px-2 py-1 rounded-full border ${getRoleBadgeColor(u.role)}`}>
              {u.role?.toUpperCase()}
            </span>
            <button
              onClick={() => handleDeleteUser(u.id, u.email)}
              className="p-2 text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
              title="Delete user"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
