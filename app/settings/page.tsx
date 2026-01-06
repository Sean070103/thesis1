'use client';

import { useEffect, useState } from 'react';
import { Settings as SettingsIcon, Database, Download, Upload, Trash2, Bell, Zap, Globe, Save, AlertCircle, RefreshCw } from 'lucide-react';
import { getMaterials, getTransactions, getDefects, getAlerts, importData } from '@/lib/storage';

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
  const [activeTab, setActiveTab] = useState<'data' | 'system' | 'notifications' | 'sap'>('data');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState(defaultNotificationSettings);
  const [sapSettings, setSapSettings] = useState(defaultSapSettings);
  const [systemSettings, setSystemSettings] = useState(defaultSystemSettings);

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
  }, []);

  const handleExportData = () => {
    setIsExporting(true);
    try {
      const data = {
        materials: getMaterials(),
        transactions: getTransactions(),
        defects: getDefects(),
        alerts: getAlerts(),
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
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        if (!data.materials && !data.transactions && !data.defects && !data.alerts) {
          throw new Error('Invalid backup file format');
        }
        
        if (confirm('This will replace all existing data. Are you sure?')) {
          importData({
            materials: data.materials,
            transactions: data.transactions,
            defects: data.defects,
            alerts: data.alerts,
          });
          
          setTimeout(() => {
            setIsImporting(false);
            alert('Data imported successfully! The page will reload.');
            window.location.reload();
          }, 1000);
        } else {
          setIsImporting(false);
        }
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
      try {
        localStorage.clear();
        setTimeout(() => {
          setIsClearing(false);
          alert('All data has been cleared. The page will reload.');
          window.location.reload();
        }, 1000);
      } catch (error) {
        console.error('Clear failed:', error);
        setIsClearing(false);
        alert('Failed to clear data. Please try again.');
      }
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
  ];

  const stats = {
    materials: getMaterials().length,
    transactions: getTransactions().length,
    defects: getDefects().length,
    alerts: getAlerts().length,
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="bg-gradient-to-r from-black via-slate-950 to-black border-b border-slate-800/50 px-8 py-7 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white">Settings</h1>
            </div>
            <p className="text-slate-400 text-sm">Manage your system preferences and configurations</p>
          </div>
          <button
            onClick={handleSaveSettings}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 flex items-center gap-2"
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
            <div className="bg-gradient-to-br from-slate-900 to-slate-900/50 rounded-xl border border-slate-800/50 p-4 shadow-lg">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                        isActive
                          ? 'bg-slate-800/80 text-white shadow-lg border border-slate-700/50'
                          : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                      }`}
                    >
                      <Icon size={18} />
                      <span className="text-sm font-semibold">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Data Management Tab */}
            {activeTab === 'data' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-slate-900 to-slate-900/50 rounded-xl border border-slate-800/50 p-6 shadow-lg">
                  <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Database className="text-amber-400" size={24} />
                    Data Management
                  </h2>

                  {/* Data Statistics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/30">
                      <p className="text-xs text-slate-400 mb-1">Materials</p>
                      <p className="text-2xl font-bold text-white">{stats.materials}</p>
                    </div>
                    <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/30">
                      <p className="text-xs text-slate-400 mb-1">Transactions</p>
                      <p className="text-2xl font-bold text-white">{stats.transactions}</p>
                    </div>
                    <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/30">
                      <p className="text-xs text-slate-400 mb-1">Defects</p>
                      <p className="text-2xl font-bold text-white">{stats.defects}</p>
                    </div>
                    <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/30">
                      <p className="text-xs text-slate-400 mb-1">Alerts</p>
                      <p className="text-2xl font-bold text-white">{stats.alerts}</p>
                    </div>
                  </div>

                  {/* Export Data */}
                  <div className="bg-slate-800/30 rounded-lg p-5 border border-slate-700/30 mb-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-1">Export Data</h3>
                        <p className="text-sm text-slate-400">Download all your data as a JSON backup file</p>
                      </div>
                      <Download className="text-amber-400" size={24} />
                    </div>
                    <button
                      onClick={handleExportData}
                      disabled={isExporting}
                      className="w-full px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
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
                  <div className="bg-slate-800/30 rounded-lg p-5 border border-slate-700/30 mb-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-1">Import Data</h3>
                        <p className="text-sm text-slate-400">Restore data from a previously exported backup file</p>
                      </div>
                      <Upload className="text-emerald-400" size={24} />
                    </div>
                    <label className="w-full px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50">
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
                  <div className="bg-slate-800/30 rounded-lg p-5 border border-rose-700/30">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
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
                      className="w-full px-4 py-3 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-lg hover:from-rose-600 hover:to-rose-700 transition-all font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
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
                <div className="bg-gradient-to-br from-slate-900 to-slate-900/50 rounded-xl border border-slate-800/50 p-6 shadow-lg">
                  <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <SettingsIcon className="text-amber-400" size={24} />
                    System Preferences
                  </h2>

                  <div className="space-y-6">
                    {/* Auto Refresh */}
                    <div className="bg-slate-800/30 rounded-lg p-5 border border-slate-700/30">
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
                    <div className="bg-slate-800/30 rounded-lg p-5 border border-slate-700/30">
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold text-white mb-1">Theme</h3>
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
                    <div className="bg-slate-800/30 rounded-lg p-5 border border-slate-700/30">
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
                          <Globe className="text-amber-400" size={18} />
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
                <div className="bg-gradient-to-br from-slate-900 to-slate-900/50 rounded-xl border border-slate-800/50 p-6 shadow-lg">
                  <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Bell className="text-amber-400" size={24} />
                    Notification Preferences
                  </h2>

                  <div className="space-y-4">
                    {/* Email Alerts */}
                    <div className="bg-slate-800/30 rounded-lg p-5 border border-slate-700/30">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-1">Email Alerts</h3>
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
                    <div className="bg-slate-800/30 rounded-lg p-5 border border-slate-700/30">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-1">SMS Alerts</h3>
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
                    <div className="bg-slate-800/30 rounded-lg p-5 border border-slate-700/30">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-1">Push Notifications</h3>
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
                    <div className="bg-slate-800/30 rounded-lg p-5 border border-slate-700/30">
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold text-white mb-1">Alert Frequency</h3>
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
                <div className="bg-gradient-to-br from-slate-900 to-slate-900/50 rounded-xl border border-slate-800/50 p-6 shadow-lg">
                  <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Zap className="text-amber-400" size={24} />
                    SAP Integration
                  </h2>

                  <div className="space-y-6">
                    {/* Enable SAP */}
                    <div className="bg-slate-800/30 rounded-lg p-5 border border-slate-700/30">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-1">Enable SAP Integration</h3>
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
                        <div className="bg-slate-800/30 rounded-lg p-5 border border-slate-700/30">
                          <label className="block text-sm font-semibold text-white mb-2">SAP Server URL</label>
                          <input
                            type="text"
                            value={sapSettings.serverUrl}
                            onChange={(e) => setSapSettings({ ...sapSettings, serverUrl: e.target.value })}
                            placeholder="https://sap-server.example.com"
                            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                          />
                        </div>

                        {/* Username */}
                        <div className="bg-slate-800/30 rounded-lg p-5 border border-slate-700/30">
                          <label className="block text-sm font-semibold text-white mb-2">Username</label>
                          <input
                            type="text"
                            value={sapSettings.username}
                            onChange={(e) => setSapSettings({ ...sapSettings, username: e.target.value })}
                            placeholder="SAP Username"
                            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                          />
                        </div>

                        {/* Password */}
                        <div className="bg-slate-800/30 rounded-lg p-5 border border-slate-700/30">
                          <label className="block text-sm font-semibold text-white mb-2">Password</label>
                          <input
                            type="password"
                            value={sapSettings.password}
                            onChange={(e) => setSapSettings({ ...sapSettings, password: e.target.value })}
                            placeholder="SAP Password"
                            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                          />
                        </div>

                        {/* Sync Interval */}
                        <div className="bg-slate-800/30 rounded-lg p-5 border border-slate-700/30">
                          <label className="block text-sm font-semibold text-white mb-2">Sync Interval (seconds)</label>
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
                        <div className="bg-slate-800/30 rounded-lg p-5 border border-slate-700/30">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-lg font-semibold text-white mb-1">Connection Status</h3>
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
          </div>
        </div>
      </div>
    </div>
  );
}

