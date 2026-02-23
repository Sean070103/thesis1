import { getSupabase, isSupabaseConfigured } from './supabase';
import { Material, MaterialTransaction, Defect, Alert } from '@/types';
import { IVMS_MATERIALS, IVMS_TRANSACTIONS, IVMS_DEFECTS } from '@/data/ivms-data';
import bcrypt from 'bcryptjs';

let _ivmsSeeded = false;
let _ivmsTransactionsSeeded = false;

// Helper to get localStorage data safely
const getFromStorage = <T>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const saveToStorage = <T>(key: string, data: T): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

// ============================================
// MATERIALS
// ============================================

async function seedIvmsDataIfEmpty(): Promise<void> {
  if (_ivmsSeeded || typeof window === 'undefined') return;
  const supabase = getSupabase();
  let materialsEmpty = false;
  if (!supabase) {
    const stored = getFromStorage<Material[]>('materials', []);
    materialsEmpty = stored.length === 0;
  } else {
    const { data } = await supabase.from('materials').select('id').limit(1);
    materialsEmpty = !data || data.length === 0;
  }
  if (!materialsEmpty) {
    _ivmsSeeded = true;
    return;
  }
  _ivmsSeeded = true;
  _ivmsTransactionsSeeded = true;
  for (const row of IVMS_MATERIALS) {
    const material: Material = {
      id: generateId(),
      materialCode: row.materialCode,
      description: row.description,
      category: row.category,
      unit: row.unit,
      quantity: row.quantity,
      location: row.location,
      sapQuantity: row.sapQuantity,
      reorderThreshold: row.reorderThreshold,
      lastUpdated: new Date().toISOString(),
    };
    await saveMaterialToSupabase(material);
  }
  for (const row of IVMS_TRANSACTIONS) {
    const transaction: MaterialTransaction = {
      id: generateId(),
      materialCode: row.materialCode,
      materialDescription: row.materialDescription,
      transactionType: row.transactionType,
      quantity: row.quantity,
      unit: row.unit,
      date: row.date,
      user: row.user,
      reference: row.reference,
      notes: row.notes,
    };
    await saveTransactionToSupabase(transaction);
  }
}

/**
 * Replace all materials and transactions with IVMS 2026 data.
 * Call this to show full 2026 transaction history (e.g. when you still see old 2025 data).
 */
export async function replaceDataWithIvms2026(): Promise<{ success: boolean; message: string }> {
  if (typeof window === 'undefined') return { success: false, message: 'Cannot run on server' };
  const supabase = getSupabase();
  try {
    _ivmsSeeded = false;
    _ivmsTransactionsSeeded = false;
    if (!supabase) {
      saveToStorage('materials', []);
      saveToStorage('transactions', []);
    } else {
      const { data: txRows } = await supabase.from('material_transactions').select('id');
      const txIds = (txRows || []).map((r: { id: string }) => r.id);
      if (txIds.length > 0) {
        const chunk = 100;
        for (let i = 0; i < txIds.length; i += chunk) {
          await supabase.from('material_transactions').delete().in('id', txIds.slice(i, i + chunk));
        }
      }
      const { data: matRows } = await supabase.from('materials').select('id');
      const matIds = (matRows || []).map((r: { id: string }) => r.id);
      if (matIds.length > 0) {
        const chunk = 100;
        for (let i = 0; i < matIds.length; i += chunk) {
          await supabase.from('materials').delete().in('id', matIds.slice(i, i + chunk));
        }
      }
    }
    await seedIvmsDataIfEmpty();
    return { success: true, message: 'IVMS 2026 data loaded. Transaction history now shows 2026.' };
  } catch (e) {
    console.error(e);
    return { success: false, message: e instanceof Error ? e.message : 'Failed to load IVMS data' };
  }
}

async function seedIvmsTransactionsIfEmpty(): Promise<void> {
  if (_ivmsTransactionsSeeded || typeof window === 'undefined') return;
  const supabase = getSupabase();
  let transactionsEmpty = false;
  if (!supabase) {
    const stored = getFromStorage<MaterialTransaction[]>('transactions', []);
    transactionsEmpty = stored.length === 0;
  } else {
    const { data } = await supabase.from('material_transactions').select('id').limit(1);
    transactionsEmpty = !data || data.length === 0;
  }
  if (!transactionsEmpty) {
    _ivmsTransactionsSeeded = true;
    return;
  }
  _ivmsTransactionsSeeded = true;
  for (const row of IVMS_TRANSACTIONS) {
    const transaction: MaterialTransaction = {
      id: generateId(),
      materialCode: row.materialCode,
      materialDescription: row.materialDescription,
      transactionType: row.transactionType,
      quantity: row.quantity,
      unit: row.unit,
      date: row.date,
      user: row.user,
      reference: row.reference,
      notes: row.notes,
    };
    await saveTransactionToSupabase(transaction);
  }
}

const IVMS_2026_DEFAULT_FLAG = 'ivms_2026_default_loaded';
const IVMS_2026_QUANTITIES_SYNCED_FLAG = 'ivms_2026_quantities_synced_v2';

function dedupeTransactions(list: MaterialTransaction[]): MaterialTransaction[] {
  const seen = new Set<string>();
  const result: MaterialTransaction[] = [];

  for (const t of list) {
    const key = [
      t.materialCode,
      t.transactionType,
      t.quantity,
      t.unit,
      t.date,
      t.reference,
      t.user,
    ].join('|');

    if (!seen.has(key)) {
      seen.add(key);
      result.push(t);
    }
  }

  return result;
}

async function syncIvmsQuantitiesFromSheet(): Promise<void> {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem(IVMS_2026_QUANTITIES_SYNCED_FLAG)) return;

  const supabase = getSupabase();

  if (!supabase) {
    // LocalStorage mode: update existing materials array
    const materials = getFromStorage<Material[]>('materials', []);
    let changed = false;

    for (const ivms of IVMS_MATERIALS) {
      const index = materials.findIndex(m => m.materialCode === ivms.materialCode);
      if (index >= 0 && materials[index].quantity !== ivms.quantity) {
        materials[index].quantity = ivms.quantity;
        materials[index].lastUpdated = new Date().toISOString();
        changed = true;
      }
    }

    if (changed) {
      saveToStorage('materials', materials);
    }
  } else {
    // Supabase mode: push quantities for the IVMS material codes
    for (const ivms of IVMS_MATERIALS) {
      await supabase
        .from('materials')
        .update({
          quantity: ivms.quantity,
          last_updated: new Date().toISOString(),
        })
        .eq('material_code', ivms.materialCode);
    }
  }

  try {
    localStorage.setItem(IVMS_2026_QUANTITIES_SYNCED_FLAG, '1');
  } catch {
    // ignore quota errors
  }
}

export async function getMaterialsFromSupabase(): Promise<Material[]> {
  if (typeof window !== 'undefined' && !localStorage.getItem(IVMS_2026_DEFAULT_FLAG)) {
    await replaceDataWithIvms2026();
    try {
      localStorage.setItem(IVMS_2026_DEFAULT_FLAG, '1');
    } catch (_) {}
  }

  const supabase = getSupabase();

  // One-time sync so Material Records quantities match IVMS summary sheet
  await syncIvmsQuantitiesFromSheet();
  
  if (!supabase) {
    let list = getFromStorage<Material[]>('materials', []);
    if (list.length === 0) {
      await seedIvmsDataIfEmpty();
      list = getFromStorage<Material[]>('materials', []);
    }
    return list;
  }

  const { data, error } = await supabase
    .from('materials')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching materials:', error);
    return getFromStorage<Material[]>('materials', []);
  }

  const list = (data || []).map(m => ({
    id: m.id,
    materialCode: m.material_code,
    description: m.description,
    category: m.category,
    unit: m.unit,
    quantity: Number(m.quantity),
    location: m.location,
    sapQuantity: m.sap_quantity ? Number(m.sap_quantity) : undefined,
    reorderThreshold: m.reorder_threshold ? Number(m.reorder_threshold) : undefined,
    lastUpdated: m.last_updated,
  }));

  if (list.length === 0) {
    await seedIvmsDataIfEmpty();
    const { data: retry } = await supabase.from('materials').select('*').order('created_at', { ascending: false });
    return (retry || []).map(m => ({
      id: m.id,
      materialCode: m.material_code,
      description: m.description,
      category: m.category,
      unit: m.unit,
      quantity: Number(m.quantity),
      location: m.location,
      sapQuantity: m.sap_quantity ? Number(m.sap_quantity) : undefined,
      reorderThreshold: m.reorder_threshold ? Number(m.reorder_threshold) : undefined,
      lastUpdated: m.last_updated,
    }));
  }
  return list;
}

export async function saveMaterialToSupabase(material: Material): Promise<boolean> {
  const supabase = getSupabase();
  
  // Fallback to localStorage if Supabase not configured
  if (!supabase) {
    const materials = getFromStorage<Material[]>('materials', []);
    const index = materials.findIndex(m => m.id === material.id);
    if (index >= 0) {
      materials[index] = { ...material, lastUpdated: new Date().toISOString() };
    } else {
      materials.push({ ...material, lastUpdated: new Date().toISOString() });
    }
    saveToStorage('materials', materials);
    return true;
  }

  const materialData = {
    material_code: material.materialCode,
    description: material.description,
    category: material.category,
    unit: material.unit,
    quantity: material.quantity,
    location: material.location,
    sap_quantity: material.sapQuantity,
    reorder_threshold: material.reorderThreshold,
    last_updated: new Date().toISOString(),
  };

  // Check if material exists
  const { data: existing } = await supabase
    .from('materials')
    .select('id')
    .eq('id', material.id)
    .single();

  let error;

  if (existing) {
    // Update existing material
    const result = await supabase
      .from('materials')
      .update(materialData)
      .eq('id', material.id);
    error = result.error;
  } else {
    // Insert new material
    const result = await supabase
      .from('materials')
      .insert({
        id: material.id,
        ...materialData,
      });
    error = result.error;
  }

  if (error) {
    console.error('Error saving material:', error);
    return false;
  }
  return true;
}

export async function deleteMaterialFromSupabase(id: string): Promise<boolean> {
  const supabase = getSupabase();
  
  // Fallback to localStorage if Supabase not configured
  if (!supabase) {
    const materials = getFromStorage<Material[]>('materials', []);
    const filtered = materials.filter(m => m.id !== id);
    saveToStorage('materials', filtered);
    return true;
  }

  const { error } = await supabase
    .from('materials')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting material:', error);
    return false;
  }
  return true;
}

export async function seedMaterialsToSupabase(): Promise<void> {
  const initialMaterials: Omit<Material, 'id' | 'lastUpdated'>[] = [
    {
      materialCode: 'RM-01-06-0021',
      description: 'BI PIPE 1MM x RP OD 25.4MM x 20" SCHED',
      category: 'Raw Materials',
      unit: 'PCS',
      quantity: 0,
      location: 'Warehouse',
      sapQuantity: 0,
    },
    {
      materialCode: 'RM-01-06-0059',
      description: 'PE TRANS POLYBAG UV CUSHION (20 x 53 x 26 mic)',
      category: 'Raw Materials',
      unit: 'PCS',
      quantity: 0,
      location: 'Warehouse',
      sapQuantity: 0,
    },
    {
      materialCode: 'RM-01-06-0060',
      description: 'PE TRANS SLT ONE SIDE UV BACK REST (10 x 100 x 26 mic)',
      category: 'Raw Materials',
      unit: 'PCS',
      quantity: 0,
      location: 'Warehouse',
      sapQuantity: 0,
    },
    {
      materialCode: 'RM-01-06-0079',
      description: 'MS PLATE 2MM BACK REST ER BRKT – LITE ACE',
      category: 'Raw Materials',
      unit: 'PCS',
      quantity: 0,
      location: 'Warehouse',
      sapQuantity: 0,
    },
    {
      materialCode: 'RM-01-06-0080',
      description: 'MS PLATE 2MM MID LEG BRKT (RH / LH) – LITE ACE',
      category: 'Raw Materials',
      unit: 'PCS',
      quantity: 0,
      location: 'Warehouse',
      sapQuantity: 0,
    },
    {
      materialCode: 'RM-01-06-0054',
      description: 'FOAM 25MM BACK REST UV Lite Ace (158.75mm x 2235.22mm)',
      category: 'Raw Materials',
      unit: 'PCS',
      quantity: 0,
      location: 'Warehouse',
      sapQuantity: 0,
    },
    {
      materialCode: 'RM-01-06-0055',
      description: 'FOAM 50MM SEAT CUSHION UV Lite Ace (349.25mm x 1117.6mm)',
      category: 'Raw Materials',
      unit: 'PCS',
      quantity: 0,
      location: 'Warehouse',
      sapQuantity: 0,
    },
    {
      materialCode: 'RM-01-06-0056',
      description: 'FOAM 5MM SC UV Lite Ace (101.6mm x 2908.3mm)',
      category: 'Raw Materials',
      unit: 'PCS',
      quantity: 0,
      location: 'Warehouse',
      sapQuantity: 0,
    },
    {
      materialCode: 'RM-01-06-0057',
      description: 'FOAM 5MM BR UV Lite Ace (88.9mm x 4699mm)',
      category: 'Raw Materials',
      unit: 'PCS',
      quantity: 0,
      location: 'Warehouse',
      sapQuantity: 0,
    },
    {
      materialCode: 'RM-01-06-0058',
      description: 'TRICOT 8MM (SC / BR) UV Lite Ace (340mm x 1140mm)',
      category: 'Raw Materials',
      unit: 'PCS',
      quantity: 0,
      location: 'Warehouse',
      sapQuantity: 0,
    },
  ];

  const supabase = getSupabase();
  
  // Fallback to localStorage if Supabase not configured
  if (!supabase) {
    const existingMaterials = getFromStorage<Material[]>('materials', []);
    const existingCodes = new Set(existingMaterials.map(m => m.materialCode));
    const newMaterials = initialMaterials
      .filter(m => !existingCodes.has(m.materialCode))
      .map(m => ({
        ...m,
        id: generateId(),
        lastUpdated: new Date().toISOString(),
      }));
    
    if (newMaterials.length > 0) {
      saveToStorage('materials', [...existingMaterials, ...newMaterials]);
    }
    return;
  }

  // Insert only if not exists (using material_code as unique)
  for (const material of initialMaterials) {
    const { data: existing } = await supabase
      .from('materials')
      .select('id')
      .eq('material_code', material.materialCode)
      .single();

    if (!existing) {
      await supabase.from('materials').insert({
        material_code: material.materialCode,
        description: material.description,
        category: material.category,
        unit: material.unit,
        quantity: material.quantity,
        location: material.location,
        sap_quantity: material.sapQuantity,
      });
    }
  }
}

// ============================================
// TRANSACTIONS
// ============================================

export async function getTransactionsFromSupabase(): Promise<MaterialTransaction[]> {
  const supabase = getSupabase();
  
  if (!supabase) {
    let list = getFromStorage<MaterialTransaction[]>('transactions', []);
    if (list.length === 0) {
      await seedIvmsDataIfEmpty();
      await seedIvmsTransactionsIfEmpty();
      list = getFromStorage<MaterialTransaction[]>('transactions', []);
    }
    return dedupeTransactions(list);
  }

  const { data, error } = await supabase
    .from('material_transactions')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching transactions:', error);
    return getFromStorage<MaterialTransaction[]>('transactions', []);
  }

  const list = (data || []).map(t => ({
    id: t.id,
    materialCode: t.material_code,
    materialDescription: t.material_description,
    transactionType: t.transaction_type as 'receiving' | 'issuance',
    quantity: Number(t.quantity),
    unit: t.unit,
    date: t.date,
    user: t.user_name,
    reference: t.reference,
    notes: t.notes,
  }));

  if (list.length === 0) {
    await seedIvmsDataIfEmpty();
    await seedIvmsTransactionsIfEmpty();
    const { data: retry } = await supabase.from('material_transactions').select('*').order('date', { ascending: false });
    return dedupeTransactions((retry || []).map(t => ({
      id: t.id,
      materialCode: t.material_code,
      materialDescription: t.material_description,
      transactionType: t.transaction_type as 'receiving' | 'issuance',
      quantity: Number(t.quantity),
      unit: t.unit,
      date: t.date,
      user: t.user_name,
      reference: t.reference,
      notes: t.notes,
    })));
  }
  return dedupeTransactions(list);
}

export async function saveTransactionToSupabase(transaction: MaterialTransaction): Promise<boolean> {
  const supabase = getSupabase();
  
  if (!supabase) {
    const transactions = getFromStorage<MaterialTransaction[]>('transactions', []);
    transactions.unshift(transaction);
    saveToStorage('transactions', transactions);
    return true;
  }

  const { error } = await supabase
    .from('material_transactions')
    .insert({
      id: transaction.id,
      material_code: transaction.materialCode,
      material_description: transaction.materialDescription,
      transaction_type: transaction.transactionType,
      quantity: transaction.quantity,
      unit: transaction.unit,
      date: transaction.date,
      user_name: transaction.user,
      reference: transaction.reference,
      notes: transaction.notes,
    });

  if (error) {
    console.error('Error saving transaction:', error);
    return false;
  }
  return true;
}

export async function deleteTransactionFromSupabase(transaction: MaterialTransaction): Promise<boolean> {
  const supabase = getSupabase();
  
  if (!supabase) {
    const transactions = getFromStorage<MaterialTransaction[]>('transactions', []);
    const filtered = transactions.filter(t => t.id !== transaction.id);
    saveToStorage('transactions', filtered);
    
    // Reverse the quantity change
    const materials = getFromStorage<Material[]>('materials', []);
    const index = materials.findIndex(m => m.materialCode === transaction.materialCode);
    if (index >= 0) {
      // Reverse: if it was receiving, subtract; if it was issuance, add back
      const currentQuantity = materials[index].quantity;
      materials[index].quantity = transaction.transactionType === 'receiving' 
        ? Math.max(0, currentQuantity - transaction.quantity)
        : currentQuantity + transaction.quantity;
      materials[index].lastUpdated = new Date().toISOString();
      saveToStorage('materials', materials);
    }
    return true;
  }

  // Delete from Supabase
  const { error: deleteError } = await supabase
    .from('material_transactions')
    .delete()
    .eq('id', transaction.id);

  if (deleteError) {
    console.error('Error deleting transaction:', deleteError);
    return false;
  }

  // Reverse the quantity change in materials
  const { data: material, error: fetchError } = await supabase
    .from('materials')
    .select('quantity')
    .eq('material_code', transaction.materialCode)
    .single();

  if (!fetchError && material) {
    const currentQuantity = Number(material.quantity);
    // Reverse: if it was receiving, subtract; if it was issuance, add back
    const newQuantity = transaction.transactionType === 'receiving' 
      ? Math.max(0, currentQuantity - transaction.quantity)
      : currentQuantity + transaction.quantity;

    await supabase
      .from('materials')
      .update({ 
        quantity: newQuantity,
        last_updated: new Date().toISOString()
      })
      .eq('material_code', transaction.materialCode);
  }

  return true;
}

export async function updateTransactionInSupabase(transaction: MaterialTransaction, oldTransaction: MaterialTransaction): Promise<boolean> {
  const supabase = getSupabase();
  
  if (!supabase) {
    const transactions = getFromStorage<MaterialTransaction[]>('transactions', []);
    const index = transactions.findIndex(t => t.id === transaction.id);
    if (index >= 0) {
      transactions[index] = transaction;
      saveToStorage('transactions', transactions);
      
      // Update material quantity: reverse old, apply new
      const materials = getFromStorage<Material[]>('materials', []);
      const matIndex = materials.findIndex(m => m.materialCode === transaction.materialCode);
      if (matIndex >= 0) {
        let quantity = materials[matIndex].quantity;
        
        // Reverse old transaction
        if (oldTransaction.transactionType === 'receiving') {
          quantity = Math.max(0, quantity - oldTransaction.quantity);
        } else {
          quantity += oldTransaction.quantity;
        }
        
        // Apply new transaction
        if (transaction.transactionType === 'receiving') {
          quantity += transaction.quantity;
        } else {
          quantity = Math.max(0, quantity - transaction.quantity);
        }
        
        materials[matIndex].quantity = quantity;
        materials[matIndex].lastUpdated = new Date().toISOString();
        saveToStorage('materials', materials);
      }
    }
    return true;
  }

  const { error } = await supabase
    .from('material_transactions')
    .update({
      material_code: transaction.materialCode,
      material_description: transaction.materialDescription,
      transaction_type: transaction.transactionType,
      quantity: transaction.quantity,
      unit: transaction.unit,
      user_name: transaction.user,
      notes: transaction.notes,
    })
    .eq('id', transaction.id);

  if (error) {
    console.error('Error updating transaction:', error);
    return false;
  }

  // Update material quantity: reverse old, apply new
  const { data: material, error: fetchError } = await supabase
    .from('materials')
    .select('quantity')
    .eq('material_code', transaction.materialCode)
    .single();

  if (!fetchError && material) {
    let quantity = Number(material.quantity);
    
    // Reverse old transaction
    if (oldTransaction.transactionType === 'receiving') {
      quantity = Math.max(0, quantity - oldTransaction.quantity);
    } else {
      quantity += oldTransaction.quantity;
    }
    
    // Apply new transaction
    if (transaction.transactionType === 'receiving') {
      quantity += transaction.quantity;
    } else {
      quantity = Math.max(0, quantity - transaction.quantity);
    }

    await supabase
      .from('materials')
      .update({ 
        quantity,
        last_updated: new Date().toISOString()
      })
      .eq('material_code', transaction.materialCode);
  }

  return true;
}

export async function updateMaterialQuantity(
  materialCode: string, 
  quantityChange: number, 
  transactionType: 'receiving' | 'issuance'
): Promise<boolean> {
  const supabase = getSupabase();
  
  if (!supabase) {
    const materials = getFromStorage<Material[]>('materials', []);
    const index = materials.findIndex(m => m.materialCode === materialCode);
    if (index >= 0) {
      const currentQuantity = materials[index].quantity;
      materials[index].quantity = transactionType === 'receiving' 
        ? currentQuantity + quantityChange 
        : Math.max(0, currentQuantity - quantityChange);
      materials[index].lastUpdated = new Date().toISOString();
      saveToStorage('materials', materials);
    }
    return true;
  }

  // Get current material
  const { data: material, error: fetchError } = await supabase
    .from('materials')
    .select('quantity')
    .eq('material_code', materialCode)
    .single();

  if (fetchError || !material) {
    console.error('Error fetching material for quantity update:', fetchError);
    return false;
  }

  const currentQuantity = Number(material.quantity);
  const newQuantity = transactionType === 'receiving' 
    ? currentQuantity + quantityChange 
    : Math.max(0, currentQuantity - quantityChange);

  const { error: updateError } = await supabase
    .from('materials')
    .update({ 
      quantity: newQuantity,
      last_updated: new Date().toISOString()
    })
    .eq('material_code', materialCode);

  if (updateError) {
    console.error('Error updating material quantity:', updateError);
    return false;
  }
  return true;
}

// ============================================
// DEFECTS
// ============================================

export async function getDefectsFromSupabase(): Promise<Defect[]> {
  const supabase = getSupabase();

  if (!supabase) {
    return getFromStorage<Defect[]>('defects', []);
  }

  // Try with created_at first (common column name), fallback to no order
  let data, error;
  
  const result = await supabase
    .from('defects')
    .select('*')
    .order('created_at', { ascending: false });
  
  data = result.data;
  error = result.error;

  // If table doesn't exist or other error, fallback to localStorage
  if (error) {
    console.error('Error fetching defects:', error);
    return getFromStorage<Defect[]>('defects', []);
  }

  return (data || []).map(d => ({
    id: d.id,
    materialCode: d.material_code,
    materialDescription: d.material_description,
    defectType: d.defect_type,
    quantity: Number(d.quantity),
    unit: d.unit,
    severity: d.severity as 'low' | 'medium' | 'high' | 'critical',
    description: d.description,
    reportedBy: d.reported_by,
    reportedDate: d.reported_date || d.created_at,
    status: d.status as 'open' | 'in-progress' | 'resolved',
    resolutionNotes: d.resolution_notes,
  }));
}

export async function saveDefectToSupabase(defect: Defect): Promise<boolean> {
  const supabase = getSupabase();
  
  if (!supabase) {
    const defects = getFromStorage<Defect[]>('defects', []);
    const index = defects.findIndex(d => d.id === defect.id);
    if (index >= 0) {
      defects[index] = defect;
    } else {
      defects.unshift(defect);
    }
    saveToStorage('defects', defects);
    return true;
  }

  // Check if defect exists
  const { data: existing } = await supabase
    .from('defects')
    .select('id')
    .eq('id', defect.id)
    .single();

  const defectData = {
    material_code: defect.materialCode || '',
    material_description: defect.materialDescription || '',
    defect_type: defect.defectType || '',
    quantity: Number(defect.quantity) || 0,
    unit: defect.unit || 'PCS',
    severity: defect.severity || 'medium',
    description: defect.description || '',
    reported_by: defect.reportedBy || '',
    reported_date: defect.reportedDate || new Date().toISOString(),
    status: defect.status || 'open',
    resolution_notes: defect.resolutionNotes || null,
  };
  
  console.log('Saving defect data:', defectData);

  let error;

  if (existing) {
    // Update existing defect
    const result = await supabase
      .from('defects')
      .update(defectData)
      .eq('id', defect.id);
    error = result.error;
  } else {
    // Insert new defect
    const result = await supabase
      .from('defects')
      .insert({
        id: defect.id,
        ...defectData,
      });
    error = result.error;
  }

  if (error) {
    console.error('Error saving defect:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    return false;
  }
  return true;
}

export async function deleteDefectFromSupabase(id: string): Promise<boolean> {
  const supabase = getSupabase();
  
  if (!supabase) {
    const defects = getFromStorage<Defect[]>('defects', []);
    const filtered = defects.filter(d => d.id !== id);
    saveToStorage('defects', filtered);
    return true;
  }

  const { error } = await supabase
    .from('defects')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting defect:', error);
    return false;
  }
  return true;
}

// ============================================
// ALERTS
// ============================================

export async function getAlertsFromSupabase(): Promise<Alert[]> {
  const supabase = getSupabase();
  
  if (!supabase) {
    return getFromStorage<Alert[]>('alerts', []);
  }

  const { data, error } = await supabase
    .from('alerts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching alerts:', error);
    return getFromStorage<Alert[]>('alerts', []);
  }

  return (data || []).map(a => ({
    id: a.id,
    type: a.type as 'mismatch' | 'low-stock' | 'discrepancy',
    materialCode: a.material_code,
    materialDescription: a.material_description,
    message: a.message,
    localQuantity: Number(a.local_quantity),
    sapQuantity: Number(a.sap_quantity),
    variance: Number(a.variance),
    severity: a.severity as 'warning' | 'error' | 'critical',
    createdAt: a.created_at,
    acknowledged: a.acknowledged,
  }));
}

export async function saveAlertToSupabase(alert: Alert): Promise<boolean> {
  const supabase = getSupabase();
  
  if (!supabase) {
    const alerts = getFromStorage<Alert[]>('alerts', []);
    alerts.unshift(alert);
    saveToStorage('alerts', alerts);
    return true;
  }

  // Use insert instead of upsert to avoid onConflict issues
  const { error } = await supabase
    .from('alerts')
    .insert({
      id: alert.id,
      type: alert.type,
      material_code: alert.materialCode,
      material_description: alert.materialDescription,
      message: alert.message,
      local_quantity: alert.localQuantity,
      sap_quantity: alert.sapQuantity,
      variance: alert.variance,
      severity: alert.severity,
      created_at: alert.createdAt,
      acknowledged: alert.acknowledged,
    });

  if (error) {
    console.error('Error saving alert:', error);
    return false;
  }
  return true;
}

export async function acknowledgeAlertInSupabase(id: string): Promise<boolean> {
  const supabase = getSupabase();
  
  if (!supabase) {
    const alerts = getFromStorage<Alert[]>('alerts', []);
    const index = alerts.findIndex(a => a.id === id);
    if (index >= 0) {
      alerts[index].acknowledged = true;
      saveToStorage('alerts', alerts);
    }
    return true;
  }

  const { error } = await supabase
    .from('alerts')
    .update({ acknowledged: true })
    .eq('id', id);

  if (error) {
    console.error('Error acknowledging alert:', error);
    return false;
  }
  return true;
}

export async function deleteAlertFromSupabase(id: string): Promise<boolean> {
  const supabase = getSupabase();
  
  if (!supabase) {
    const alerts = getFromStorage<Alert[]>('alerts', []);
    const filtered = alerts.filter(a => a.id !== id);
    saveToStorage('alerts', filtered);
    return true;
  }

  const { error } = await supabase
    .from('alerts')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting alert:', error);
    return false;
  }
  return true;
}

export async function clearAllAlertsFromSupabase(): Promise<boolean> {
  const supabase = getSupabase();
  
  if (!supabase) {
    saveToStorage('alerts', []);
    return true;
  }

  const { error } = await supabase
    .from('alerts')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

  if (error) {
    console.error('Error clearing alerts:', error);
    return false;
  }
  return true;
}

export async function clearAcknowledgedAlertsFromSupabase(): Promise<boolean> {
  const supabase = getSupabase();
  
  if (!supabase) {
    const alerts = getFromStorage<Alert[]>('alerts', []);
    const filtered = alerts.filter(a => !a.acknowledged);
    saveToStorage('alerts', filtered);
    return true;
  }

  const { error } = await supabase
    .from('alerts')
    .delete()
    .eq('acknowledged', true);

  if (error) {
    console.error('Error clearing acknowledged alerts:', error);
    return false;
  }
  return true;
}

export async function acknowledgeAllAlertsInSupabase(): Promise<boolean> {
  const supabase = getSupabase();
  
  if (!supabase) {
    const alerts = getFromStorage<Alert[]>('alerts', []);
    const updated = alerts.map(a => ({ ...a, acknowledged: true }));
    saveToStorage('alerts', updated);
    return true;
  }

  const { error } = await supabase
    .from('alerts')
    .update({ acknowledged: true })
    .eq('acknowledged', false);

  if (error) {
    console.error('Error acknowledging all alerts:', error);
    return false;
  }
  return true;
}

// ============================================
// USERS (for authentication)
// ============================================

export async function getUsersFromSupabase() {
  const supabase = getSupabase();
  
  if (!supabase) {
    return getFromStorage<any[]>('users', []);
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching users:', error);
    return getFromStorage<any[]>('users', []);
  }

  return data || [];
}

export async function getUserByEmail(email: string) {
  const supabase = getSupabase();
  
  if (!supabase) {
    const users = getFromStorage<any[]>('users', []);
    return users.find(u => u.email === email) || null;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email)
    .single();

  if (error) {
    return null;
  }

  return data;
}

export async function createUserInSupabase(user: {
  email: string;
  name: string;
  password: string;
  role: string;
  department?: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabase();
  
  if (!supabase) {
    // Fallback to localStorage
    const users = getFromStorage<any[]>('users', []);
    if (users.some(u => u.email === user.email)) {
      return { success: false, error: 'User with this email already exists' };
    }
    
    // Hash password for localStorage too
    const hashedPassword = await bcrypt.hash(user.password, 10);
    
    users.push({
      id: generateId(),
      email: user.email,
      name: user.name,
      password: hashedPassword,
      role: user.role,
      department: user.department,
      isActive: true,
      createdAt: new Date().toISOString(),
    });
    saveToStorage('users', users);
    return { success: true };
  }

  // 1. Create user in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: user.email,
    password: user.password,
    options: {
      data: {
        name: user.name,
        role: user.role,
        department: user.department,
      },
    },
  });

  if (authError) {
    console.error('Error creating auth user:', authError);
    return { success: false, error: authError.message };
  }

  if (!authData.user) {
    return { success: false, error: 'Failed to create user' };
  }

  // 2. Create profile in profiles table
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: authData.user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
      is_active: true,
    });

  if (profileError) {
    console.error('Error creating profile:', profileError);
    // Note: Auth user is created but profile failed - may need cleanup
    return { success: false, error: profileError.message };
  }

  return { success: true };
}

export async function validateUserCredentials(email: string, password: string) {
  const supabase = getSupabase();
  
  if (!supabase) {
    // Fallback to localStorage
    const users = getFromStorage<any[]>('users', []);
    const user = users.find(u => u.email === email);
    
    if (user) {
      // Check if password is hashed (bcrypt hashes start with $2)
      const isHashed = user.password && user.password.startsWith('$2');
      let isValid = false;
      
      if (isHashed) {
        isValid = await bcrypt.compare(password, user.password);
      } else {
        // Plain text comparison for backwards compatibility
        isValid = user.password === password;
      }
      
      if (isValid) {
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          department: user.department,
        };
      }
    }
    return null;
  }

  // 1. Authenticate with Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData.user) {
    console.error('Auth error:', authError?.message);
    return null;
  }

  // 2. Fetch user profile from profiles table
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, name, role, department, is_active')
    .eq('id', authData.user.id)
    .single();

  if (profileError || !profile) {
    console.error('Profile error:', profileError?.message);
    // Sign out if profile not found
    await supabase.auth.signOut();
    return null;
  }

  // 3. Check if user is active
  if (!profile.is_active) {
    console.error('Account is disabled');
    await supabase.auth.signOut();
    return null;
  }

  return {
    id: profile.id,
    email: profile.email || authData.user.email,
    name: profile.name || 'User',
    role: profile.role || 'staff',
    department: profile.department,
  };
}

export async function deleteUserFromSupabase(id: string): Promise<boolean> {
  const supabase = getSupabase();
  
  if (!supabase) {
    const users = getFromStorage<any[]>('users', []);
    const filtered = users.filter(u => u.id !== id);
    saveToStorage('users', filtered);
    return true;
  }

  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting user:', error);
    return false;
  }
  return true;
}

// ============================================
// UTILITY
// ============================================

// ============================================
// UTILITY
// ============================================

export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
