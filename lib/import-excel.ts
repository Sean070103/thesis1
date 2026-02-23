/**
 * Parse Excel (.xlsx) file and map rows to Material records.
 * Uses the same Material type and can be saved with saveMaterialToSupabase.
 */

import * as XLSX from 'xlsx';
import { Material } from '@/types';

// Possible Excel column headers (case-insensitive) mapped to Material keys
const COLUMN_MAP: Record<string, (keyof Material)[]> = {
  'material code': ['materialCode'],
  materialcode: ['materialCode'],
  'item code': ['materialCode'],
  itemcode: ['materialCode'],
  code: ['materialCode'],
  matcode: ['materialCode'],
  description: ['description'],
  desc: ['description'],
  category: ['category'],
  quantity: ['quantity'],
  qty: ['quantity'],
  unit: ['unit'],
  uom: ['unit'],
  location: ['location'],
  loc: ['location'],
  sapquantity: ['sapQuantity'],
  'sap quantity': ['sapQuantity'],
  sap: ['sapQuantity'],
  reorderthreshold: ['reorderThreshold'],
  'reorder threshold': ['reorderThreshold'],
  reorder: ['reorderThreshold'],
  threshold: ['reorderThreshold'],
};

function normalizeHeader(header: string): string {
  return String(header ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function getMaterialKeyFromHeader(header: string): keyof Material | null {
  const normalized = normalizeHeader(header);
  for (const [pattern, keys] of Object.entries(COLUMN_MAP)) {
    if (normalized === pattern || normalized.includes(pattern)) {
      return keys[0];
    }
  }
  return null;
}

function parseNumber(val: unknown): number {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number' && !Number.isNaN(val)) return val;
  const n = Number(String(val).replace(/,/g, ''));
  return Number.isNaN(n) ? 0 : n;
}

function parseString(val: unknown): string {
  if (val === null || val === undefined) return '';
  return String(val).trim();
}

export interface ParseExcelResult {
  materials: Omit<Material, 'id' | 'lastUpdated'>[];
  errors: string[];
  sheetName: string;
}

/**
 * Parse an Excel file (first sheet) and return an array of material-like objects
 * (without id and lastUpdated). Caller should add id via generateId() and
 * lastUpdated when saving with saveMaterialToSupabase.
 */
export function parseExcelToMaterials(file: File): Promise<ParseExcelResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data || !(data instanceof ArrayBuffer)) {
          resolve({
            materials: [],
            errors: ['Could not read file.'],
            sheetName: '',
          });
          return;
        }
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          resolve({
            materials: [],
            errors: ['No sheet found in the workbook.'],
            sheetName: '',
          });
          return;
        }
        const sheet = workbook.Sheets[firstSheetName];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
          defval: '',
          raw: false,
        });
        if (rows.length === 0) {
          resolve({
            materials: [],
            errors: ['No data rows found.'],
            sheetName: firstSheetName,
          });
          return;
        }
        const headers = Object.keys(rows[0] || {});
        const columnToKey: Record<number, keyof Material> = {};
        headers.forEach((h, i) => {
          const key = getMaterialKeyFromHeader(h);
          if (key) columnToKey[i] = key;
        });
        const keyToCol: Partial<Record<keyof Material, number>> = {};
        headers.forEach((h, i) => {
          const key = getMaterialKeyFromHeader(h);
          if (key) keyToCol[key] = i;
        });
        const materials: Omit<Material, 'id' | 'lastUpdated'>[] = [];
        const errors: string[] = [];
        rows.forEach((row, rowIndex) => {
          const values = Object.values(row);
          const material: Record<string, unknown> = {
            materialCode: '',
            description: '',
            category: '',
            unit: 'PCS',
            quantity: 0,
            location: '',
          };
          headers.forEach((header, colIndex) => {
            const key = getMaterialKeyFromHeader(header);
            if (!key) return;
            const raw = values[colIndex];
            if (key === 'quantity' || key === 'sapQuantity' || key === 'reorderThreshold') {
              material[key] = parseNumber(raw);
            } else {
              material[key] = parseString(raw);
            }
          });
          const materialCode = parseString(material.materialCode);
          if (!materialCode) {
            errors.push(`Row ${rowIndex + 2}: Missing material code, skipped.`);
            return;
          }
          materials.push({
            materialCode,
            description: parseString(material.description),
            category: parseString(material.category) || 'Uncategorized',
            unit: parseString(material.unit) || 'PCS',
            quantity: parseNumber(material.quantity),
            location: parseString(material.location),
            sapQuantity: parseNumber(material.sapQuantity) || undefined,
            reorderThreshold: parseNumber(material.reorderThreshold) || undefined,
          });
        });
        resolve({
          materials,
          errors,
          sheetName: firstSheetName,
        });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsArrayBuffer(file);
  });
}
