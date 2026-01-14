export interface Material {
  id: string;
  materialCode: string;
  description: string;
  category: string;
  unit: string;
  quantity: number;
  location: string;
  lastUpdated: string;
  sapQuantity?: number;
  reorderThreshold?: number; // Threshold for reorder alerts
}

export interface MaterialTransaction {
  id: string;
  materialCode: string;
  materialDescription: string;
  transactionType: 'receiving' | 'issuance';
  quantity: number;
  unit: string;
  date: string;
  user: string;
  reference: string;
  notes?: string;
}

export interface Defect {
  id: string;
  materialCode: string;
  materialDescription: string;
  defectType: string;
  quantity: number;
  unit: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  reportedBy: string;
  reportedDate: string;
  status: 'open' | 'in-progress' | 'resolved';
  resolutionNotes?: string;
}

export interface Alert {
  id: string;
  type: 'mismatch' | 'low-stock' | 'discrepancy' | 'defect' | 'transaction';
  materialCode: string;
  materialDescription: string;
  message: string;
  localQuantity: number;
  sapQuantity: number;
  variance: number;
  severity: 'warning' | 'error' | 'critical';
  createdAt: string;
  acknowledged: boolean;
  relatedId?: string; // ID of related transaction/defect
}

export interface DashboardMetrics {
  totalMaterials: number;
  totalTransactions: number;
  totalDefects: number;
  activeAlerts: number;
  recentActivities: Array<{
    type: string;
    description: string;
    timestamp: string;
  }>;
}






