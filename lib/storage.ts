import { Material, MaterialTransaction, Defect, Alert } from '@/types';

const STORAGE_KEYS = {
  MATERIALS: 'materials',
  TRANSACTIONS: 'transactions',
  DEFECTS: 'defects',
  ALERTS: 'alerts',
} as const;

// Generic storage functions
function getFromStorage<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

function saveToStorage<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
}

// Material functions
export function getMaterials(): Material[] {
  return getFromStorage<Material>(STORAGE_KEYS.MATERIALS);
}

export function saveMaterial(material: Material): void {
  const materials = getMaterials();
  const index = materials.findIndex(m => m.id === material.id);
  if (index >= 0) {
    materials[index] = material;
  } else {
    materials.push(material);
  }
  saveToStorage(STORAGE_KEYS.MATERIALS, materials);
}

export function deleteMaterial(id: string): void {
  const materials = getMaterials();
  saveToStorage(STORAGE_KEYS.MATERIALS, materials.filter(m => m.id !== id));
}

// Transaction functions
export function getTransactions(): MaterialTransaction[] {
  return getFromStorage<MaterialTransaction>(STORAGE_KEYS.TRANSACTIONS);
}

export function saveTransaction(transaction: MaterialTransaction): void {
  const transactions = getTransactions();
  transactions.push(transaction);
  saveToStorage(STORAGE_KEYS.TRANSACTIONS, transactions);
}

// Defect functions
export function getDefects(): Defect[] {
  return getFromStorage<Defect>(STORAGE_KEYS.DEFECTS);
}

export function saveDefect(defect: Defect): void {
  const defects = getDefects();
  const index = defects.findIndex(d => d.id === defect.id);
  if (index >= 0) {
    defects[index] = defect;
  } else {
    defects.push(defect);
  }
  saveToStorage(STORAGE_KEYS.DEFECTS, defects);
}

export function deleteDefect(id: string): void {
  const defects = getDefects();
  saveToStorage(STORAGE_KEYS.DEFECTS, defects.filter(d => d.id !== id));
}

// Alert functions
export function getAlerts(): Alert[] {
  return getFromStorage<Alert>(STORAGE_KEYS.ALERTS);
}

export function saveAlert(alert: Alert): void {
  const alerts = getAlerts();
  const index = alerts.findIndex(a => a.id === alert.id);
  if (index >= 0) {
    alerts[index] = alert;
  } else {
    alerts.push(alert);
  }
  saveToStorage(STORAGE_KEYS.ALERTS, alerts);
}

export function acknowledgeAlert(id: string): void {
  const alerts = getAlerts();
  const alert = alerts.find(a => a.id === id);
  if (alert) {
    alert.acknowledged = true;
    saveToStorage(STORAGE_KEYS.ALERTS, alerts);
  }
}

export function deleteAlert(id: string): void {
  const alerts = getAlerts();
  saveToStorage(STORAGE_KEYS.ALERTS, alerts.filter(a => a.id !== id));
}

// Utility function to generate IDs
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Import data function
export function importData(data: {
  materials?: Material[];
  transactions?: MaterialTransaction[];
  defects?: Defect[];
  alerts?: Alert[];
}): void {
  if (typeof window === 'undefined') return;
  
  if (data.materials) {
    saveToStorage(STORAGE_KEYS.MATERIALS, data.materials);
  }
  if (data.transactions) {
    saveToStorage(STORAGE_KEYS.TRANSACTIONS, data.transactions);
  }
  if (data.defects) {
    saveToStorage(STORAGE_KEYS.DEFECTS, data.defects);
  }
  if (data.alerts) {
    saveToStorage(STORAGE_KEYS.ALERTS, data.alerts);
  }
}

