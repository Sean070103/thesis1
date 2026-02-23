/**
 * All materials and transactions from IVMS Transaction Sheet – hardcoded system data.
 * DATE ISSUANCE: MM DD YYYY. IM = Issued Materials (issuance), PD = Product Delivered (receiving).
 */

export const IVMS_MATERIALS: Array<{
  materialCode: string;
  description: string;
  category: string;
  unit: string;
  quantity: number;
  location: string;
  sapQuantity?: number;
  reorderThreshold?: number;
}> = [
  // Quantities synced to IVMS Summary Sheet "Counted Qty"
  { materialCode: 'RM-01-06-0023', description: 'BI PIPE 1.8MM x RP OD 20.6MM x 6 MTRS', category: 'Raw Materials', unit: 'PCS', quantity: 7606, location: 'RM-32XD', sapQuantity: 7606 },
  { materialCode: 'RM-01-06-0075', description: 'PE TRANS POLYBAG ( CUT SIZE ) 10X114X26mic ( LWB BackRest )', category: 'Raw Materials', unit: 'PCS', quantity: 5960, location: 'RM-32XD', sapQuantity: 5960 },
  { materialCode: 'RM-01-06-0074', description: 'PE TRANS POLYBAG ( CUT SIZE ) 18X57X26mic ( LWB Cushion )', category: 'Raw Materials', unit: 'PCS', quantity: 4920, location: 'RM-32XD', sapQuantity: 4920 },
  { materialCode: 'RM-01-06-0087', description: 'MS PLATE 2MM BACK REST EAR BRKT - 32XD', category: 'Raw Materials', unit: 'PCS', quantity: 6838, location: 'RM4-32XD', sapQuantity: 6840 },
  { materialCode: 'RM-01-06-0088', description: 'MS PLATE 2MM MID LEG BRKT RH/LH - 32XD', category: 'Raw Materials', unit: 'PCS', quantity: 1959, location: 'RM4-32XD', sapQuantity: 1960 },
  { materialCode: 'RM-01-06-0068', description: 'FOAM 25MM BACK REST LWB', category: 'Raw Materials', unit: 'PCS', quantity: 2840, location: 'RM-32XD', sapQuantity: 2840 },
  { materialCode: 'RM-01-06-0069', description: 'FOAM 50MM SEAT CUSHION LWB', category: 'Raw Materials', unit: 'PCS', quantity: 5798, location: 'RM-32XD', sapQuantity: 5800 },
  { materialCode: 'RM-01-06-0070', description: 'FOAM 5mm SC LWB', category: 'Raw Materials', unit: 'PCS', quantity: 6120, location: 'RM-32XD', sapQuantity: 6120 },
  { materialCode: 'RM-01-06-0071', description: 'FOAM 5mm BR LWB', category: 'Raw Materials', unit: 'PCS', quantity: 5160, location: 'RM-32XD', sapQuantity: 5160 },
  { materialCode: 'RM-01-06-0072', description: 'TRICOT 8MM ( BR/SC) LWB', category: 'Raw Materials', unit: 'PCS', quantity: 9240, location: 'RM-32XD', sapQuantity: 9240 },
];

// Helper: date from sheet "01 05 2026" -> ISO
function d(m: number, day: number, y: number) {
  return `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}T12:00:00.000Z`;
}

export const IVMS_TRANSACTIONS: Array<{
  materialCode: string;
  materialDescription: string;
  transactionType: 'receiving' | 'issuance';
  quantity: number;
  unit: string;
  date: string;
  user: string;
  reference: string;
  notes?: string;
}> = [
  // RM-01-06-0023 BI PIPE 1.8MM – full January 2026
  { materialCode: 'RM-01-06-0023', materialDescription: 'BI PIPE 1.8MM x RP OD 20.6MM x 6 MTRS', transactionType: 'issuance', quantity: 210, unit: 'PCS', date: d(1, 5, 2026), user: 'Warehouse', reference: 'IM 4331' },
  { materialCode: 'RM-01-06-0023', materialDescription: 'BI PIPE 1.8MM x RP OD 20.6MM x 6 MTRS', transactionType: 'receiving', quantity: 1054, unit: 'PCS', date: d(1, 6, 2026), user: 'Warehouse', reference: 'PD 1013895' },
  { materialCode: 'RM-01-06-0023', materialDescription: 'BI PIPE 1.8MM x RP OD 20.6MM x 6 MTRS', transactionType: 'issuance', quantity: 172, unit: 'PCS', date: d(1, 6, 2026), user: 'Warehouse', reference: 'IM 4338' },
  { materialCode: 'RM-01-06-0023', materialDescription: 'BI PIPE 1.8MM x RP OD 20.6MM x 6 MTRS', transactionType: 'issuance', quantity: 212, unit: 'PCS', date: d(1, 7, 2026), user: 'Warehouse', reference: 'IM 4340' },
  { materialCode: 'RM-01-06-0023', materialDescription: 'BI PIPE 1.8MM x RP OD 20.6MM x 6 MTRS', transactionType: 'issuance', quantity: 216, unit: 'PCS', date: d(1, 8, 2026), user: 'Warehouse', reference: 'IM 4344' },
  { materialCode: 'RM-01-06-0023', materialDescription: 'BI PIPE 1.8MM x RP OD 20.6MM x 6 MTRS', transactionType: 'issuance', quantity: 176, unit: 'PCS', date: d(1, 9, 2026), user: 'Warehouse', reference: 'IM 4348' },
  { materialCode: 'RM-01-06-0023', materialDescription: 'BI PIPE 1.8MM x RP OD 20.6MM x 6 MTRS', transactionType: 'issuance', quantity: 220, unit: 'PCS', date: d(1, 10, 2026), user: 'Warehouse', reference: 'IM 4350' },
  { materialCode: 'RM-01-06-0023', materialDescription: 'BI PIPE 1.8MM x RP OD 20.6MM x 6 MTRS', transactionType: 'receiving', quantity: 754, unit: 'PCS', date: d(1, 12, 2026), user: 'Warehouse', reference: 'PD 1013917' },
  { materialCode: 'RM-01-06-0023', materialDescription: 'BI PIPE 1.8MM x RP OD 20.6MM x 6 MTRS', transactionType: 'issuance', quantity: 252, unit: 'PCS', date: d(1, 12, 2026), user: 'Warehouse', reference: 'IM 4362' },
  { materialCode: 'RM-01-06-0023', materialDescription: 'BI PIPE 1.8MM x RP OD 20.6MM x 6 MTRS', transactionType: 'issuance', quantity: 252, unit: 'PCS', date: d(1, 13, 2026), user: 'Warehouse', reference: 'IM 4374' },
  { materialCode: 'RM-01-06-0023', materialDescription: 'BI PIPE 1.8MM x RP OD 20.6MM x 6 MTRS', transactionType: 'issuance', quantity: 252, unit: 'PCS', date: d(1, 14, 2026), user: 'Warehouse', reference: 'IM 4385' },
  { materialCode: 'RM-01-06-0023', materialDescription: 'BI PIPE 1.8MM x RP OD 20.6MM x 6 MTRS', transactionType: 'receiving', quantity: 298, unit: 'PCS', date: d(1, 15, 2026), user: 'Warehouse', reference: 'PD 1013939' },
  { materialCode: 'RM-01-06-0023', materialDescription: 'BI PIPE 1.8MM x RP OD 20.6MM x 6 MTRS', transactionType: 'receiving', quantity: 458, unit: 'PCS', date: d(1, 15, 2026), user: 'Warehouse', reference: 'PD 1013939' },
  { materialCode: 'RM-01-06-0023', materialDescription: 'BI PIPE 1.8MM x RP OD 20.6MM x 6 MTRS', transactionType: 'issuance', quantity: 252, unit: 'PCS', date: d(1, 15, 2026), user: 'Warehouse', reference: 'IM 4388' },
  { materialCode: 'RM-01-06-0023', materialDescription: 'BI PIPE 1.8MM x RP OD 20.6MM x 6 MTRS', transactionType: 'issuance', quantity: 252, unit: 'PCS', date: d(1, 16, 2026), user: 'Warehouse', reference: 'IM 4396' },
  { materialCode: 'RM-01-06-0023', materialDescription: 'BI PIPE 1.8MM x RP OD 20.6MM x 6 MTRS', transactionType: 'issuance', quantity: 210, unit: 'PCS', date: d(1, 17, 2026), user: 'Warehouse', reference: 'IM 4412' },
  { materialCode: 'RM-01-06-0023', materialDescription: 'BI PIPE 1.8MM x RP OD 20.6MM x 6 MTRS', transactionType: 'receiving', quantity: 756, unit: 'PCS', date: d(1, 19, 2026), user: 'Warehouse', reference: 'PD 1013960' },
  { materialCode: 'RM-01-06-0023', materialDescription: 'BI PIPE 1.8MM x RP OD 20.6MM x 6 MTRS', transactionType: 'issuance', quantity: 210, unit: 'PCS', date: d(1, 19, 2026), user: 'Warehouse', reference: 'IM 4413' },
  { materialCode: 'RM-01-06-0023', materialDescription: 'BI PIPE 1.8MM x RP OD 20.6MM x 6 MTRS', transactionType: 'issuance', quantity: 252, unit: 'PCS', date: d(1, 20, 2026), user: 'Warehouse', reference: 'IM 4424' },
  { materialCode: 'RM-01-06-0023', materialDescription: 'BI PIPE 1.8MM x RP OD 20.6MM x 6 MTRS', transactionType: 'issuance', quantity: 252, unit: 'PCS', date: d(1, 21, 2026), user: 'Warehouse', reference: 'IM 4449' },
  { materialCode: 'RM-01-06-0023', materialDescription: 'BI PIPE 1.8MM x RP OD 20.6MM x 6 MTRS', transactionType: 'receiving', quantity: 756, unit: 'PCS', date: d(1, 22, 2026), user: 'Warehouse', reference: 'PD 1013977' },
  { materialCode: 'RM-01-06-0023', materialDescription: 'BI PIPE 1.8MM x RP OD 20.6MM x 6 MTRS', transactionType: 'issuance', quantity: 252, unit: 'PCS', date: d(1, 22, 2026), user: 'Warehouse', reference: 'IM 4451' },
  { materialCode: 'RM-01-06-0023', materialDescription: 'BI PIPE 1.8MM x RP OD 20.6MM x 6 MTRS', transactionType: 'issuance', quantity: 210, unit: 'PCS', date: d(1, 24, 2026), user: 'Warehouse', reference: 'IM 4453' },
  { materialCode: 'RM-01-06-0023', materialDescription: 'BI PIPE 1.8MM x RP OD 20.6MM x 6 MTRS', transactionType: 'receiving', quantity: 756, unit: 'PCS', date: d(1, 26, 2026), user: 'Warehouse', reference: 'PD 1014000' },
  { materialCode: 'RM-01-06-0023', materialDescription: 'BI PIPE 1.8MM x RP OD 20.6MM x 6 MTRS', transactionType: 'issuance', quantity: 211, unit: 'PCS', date: d(1, 26, 2026), user: 'Warehouse', reference: 'IM 4455' },
  { materialCode: 'RM-01-06-0023', materialDescription: 'BI PIPE 1.8MM x RP OD 20.6MM x 6 MTRS', transactionType: 'issuance', quantity: 252, unit: 'PCS', date: d(1, 27, 2026), user: 'Warehouse', reference: 'IM 4460' },
  { materialCode: 'RM-01-06-0023', materialDescription: 'BI PIPE 1.8MM x RP OD 20.6MM x 6 MTRS', transactionType: 'issuance', quantity: 252, unit: 'PCS', date: d(1, 28, 2026), user: 'Warehouse', reference: 'IM 4452' },
  { materialCode: 'RM-01-06-0023', materialDescription: 'BI PIPE 1.8MM x RP OD 20.6MM x 6 MTRS', transactionType: 'issuance', quantity: 189, unit: 'PCS', date: d(1, 28, 2026), user: 'Warehouse', reference: 'IM 4463' },
  { materialCode: 'RM-01-06-0023', materialDescription: 'BI PIPE 1.8MM x RP OD 20.6MM x 6 MTRS', transactionType: 'receiving', quantity: 756, unit: 'PCS', date: d(1, 30, 2026), user: 'Warehouse', reference: 'PD 1014037' },
  { materialCode: 'RM-01-06-0023', materialDescription: 'BI PIPE 1.8MM x RP OD 20.6MM x 6 MTRS', transactionType: 'issuance', quantity: 147, unit: 'PCS', date: d(1, 30, 2026), user: 'Warehouse', reference: 'IM 4474' },
  { materialCode: 'RM-01-06-0023', materialDescription: 'BI PIPE 1.8MM x RP OD 20.6MM x 6 MTRS', transactionType: 'issuance', quantity: 82.5, unit: 'PCS', date: d(1, 30, 2026), user: 'Warehouse', reference: 'IM 4478' },
  { materialCode: 'RM-01-06-0023', materialDescription: 'BI PIPE 1.8MM x RP OD 20.6MM x 6 MTRS', transactionType: 'issuance', quantity: 2.5, unit: 'PCS', date: d(1, 31, 2026), user: 'Warehouse', reference: 'IM 4490' },
  // RM-01-06-0075 PE TRANS POLYBAG BackRest
  { materialCode: 'RM-01-06-0075', materialDescription: 'PE TRANS POLYBAG ( CUT SIZE ) 10X114X26mic ( LWB BackRest )', transactionType: 'issuance', quantity: 70, unit: 'PCS', date: d(1, 5, 2026), user: 'Warehouse', reference: 'IM 4331' },
  { materialCode: 'RM-01-06-0075', materialDescription: 'PE TRANS POLYBAG ( CUT SIZE ) 10X114X26mic ( LWB BackRest )', transactionType: 'issuance', quantity: 120, unit: 'PCS', date: d(1, 6, 2026), user: 'Warehouse', reference: 'IM 4338' },
  { materialCode: 'RM-01-06-0075', materialDescription: 'PE TRANS POLYBAG ( CUT SIZE ) 10X114X26mic ( LWB BackRest )', transactionType: 'receiving', quantity: 5000, unit: 'PCS', date: d(1, 31, 2026), user: 'Warehouse', reference: 'PD 1014042' },
  // RM-01-06-0074 PE TRANS POLYBAG Cushion
  { materialCode: 'RM-01-06-0074', materialDescription: 'PE TRANS POLYBAG ( CUT SIZE ) 18X57X26mic ( LWB Cushion )', transactionType: 'issuance', quantity: 140, unit: 'PCS', date: d(1, 5, 2026), user: 'Warehouse', reference: 'IM 4331' },
  { materialCode: 'RM-01-06-0074', materialDescription: 'PE TRANS POLYBAG ( CUT SIZE ) 18X57X26mic ( LWB Cushion )', transactionType: 'receiving', quantity: 2000, unit: 'PCS', date: d(1, 15, 2026), user: 'Warehouse', reference: 'PD 1014043' },
  { materialCode: 'RM-01-06-0074', materialDescription: 'PE TRANS POLYBAG ( CUT SIZE ) 18X57X26mic ( LWB Cushion )', transactionType: 'receiving', quantity: 1000, unit: 'PCS', date: d(1, 30, 2026), user: 'Warehouse', reference: 'PD 1014044' },
  // RM-01-06-0087 MS PLATE BACK REST EAR BRKT
  { materialCode: 'RM-01-06-0087', materialDescription: 'MS PLATE 2MM BACK REST EAR BRKT - 32XD', transactionType: 'issuance', quantity: 240, unit: 'PCS', date: d(1, 6, 2026), user: 'Warehouse', reference: 'IM 4338' },
  { materialCode: 'RM-01-06-0087', materialDescription: 'MS PLATE 2MM BACK REST EAR BRKT - 32XD', transactionType: 'receiving', quantity: 2040, unit: 'PCS', date: d(1, 13, 2026), user: 'Warehouse', reference: 'PD' },
  { materialCode: 'RM-01-06-0087', materialDescription: 'MS PLATE 2MM BACK REST EAR BRKT - 32XD', transactionType: 'receiving', quantity: 2880, unit: 'PCS', date: d(1, 21, 2026), user: 'Warehouse', reference: 'PD' },
  // RM-01-06-0088 MS PLATE MID LEG BRKT
  { materialCode: 'RM-01-06-0088', materialDescription: 'MS PLATE 2MM MID LEG BRKT RH/LH - 32XD', transactionType: 'issuance', quantity: 120, unit: 'PCS', date: d(1, 6, 2026), user: 'Warehouse', reference: 'IM 4338' },
  { materialCode: 'RM-01-06-0088', materialDescription: 'MS PLATE 2MM MID LEG BRKT RH/LH - 32XD', transactionType: 'receiving', quantity: 1000, unit: 'PCS', date: d(1, 15, 2026), user: 'Warehouse', reference: 'PD 1014045' },
  { materialCode: 'RM-01-06-0088', materialDescription: 'MS PLATE 2MM MID LEG BRKT RH/LH - 32XD', transactionType: 'receiving', quantity: 660, unit: 'PCS', date: d(1, 29, 2026), user: 'Warehouse', reference: 'IM 4470' },
  // RM-01-06-0068 FOAM 25MM BACK REST
  { materialCode: 'RM-01-06-0068', materialDescription: 'FOAM 25MM BACK REST LWB', transactionType: 'issuance', quantity: 70, unit: 'PCS', date: d(1, 5, 2026), user: 'Warehouse', reference: 'IM 4331' },
  { materialCode: 'RM-01-06-0068', materialDescription: 'FOAM 25MM BACK REST LWB', transactionType: 'receiving', quantity: 420, unit: 'PCS', date: d(1, 10, 2026), user: 'Warehouse', reference: 'PD 1013913' },
  { materialCode: 'RM-01-06-0068', materialDescription: 'FOAM 25MM BACK REST LWB', transactionType: 'receiving', quantity: 420, unit: 'PCS', date: d(1, 12, 2026), user: 'Warehouse', reference: 'PD 1013914' },
  { materialCode: 'RM-01-06-0068', materialDescription: 'FOAM 25MM BACK REST LWB', transactionType: 'receiving', quantity: 200, unit: 'PCS', date: d(1, 28, 2026), user: 'Warehouse', reference: 'PD 1014023' },
  // RM-01-06-0069 FOAM 50MM SEAT CUSHION
  { materialCode: 'RM-01-06-0069', materialDescription: 'FOAM 50MM SEAT CUSHION LWB', transactionType: 'issuance', quantity: 140, unit: 'PCS', date: d(1, 5, 2026), user: 'Warehouse', reference: 'IM 4331' },
  { materialCode: 'RM-01-06-0069', materialDescription: 'FOAM 50MM SEAT CUSHION LWB', transactionType: 'receiving', quantity: 840, unit: 'PCS', date: d(1, 10, 2026), user: 'Warehouse', reference: 'PD 1013913' },
  { materialCode: 'RM-01-06-0069', materialDescription: 'FOAM 50MM SEAT CUSHION LWB', transactionType: 'receiving', quantity: 520, unit: 'PCS', date: d(1, 28, 2026), user: 'Warehouse', reference: 'PD 1014023' },
  // RM-01-06-0070 FOAM 5mm SC
  { materialCode: 'RM-01-06-0070', materialDescription: 'FOAM 5mm SC LWB', transactionType: 'issuance', quantity: 140, unit: 'PCS', date: d(1, 5, 2026), user: 'Warehouse', reference: 'IM 4331' },
  { materialCode: 'RM-01-06-0070', materialDescription: 'FOAM 5mm SC LWB', transactionType: 'receiving', quantity: 840, unit: 'PCS', date: d(1, 10, 2026), user: 'Warehouse', reference: 'PD 1013913' },
  { materialCode: 'RM-01-06-0070', materialDescription: 'FOAM 5mm SC LWB', transactionType: 'receiving', quantity: 840, unit: 'PCS', date: d(1, 28, 2026), user: 'Warehouse', reference: 'PD 1014023' },
  // RM-01-06-0071 FOAM 5mm BR
  { materialCode: 'RM-01-06-0071', materialDescription: 'FOAM 5mm BR LWB', transactionType: 'issuance', quantity: 140, unit: 'PCS', date: d(1, 5, 2026), user: 'Warehouse', reference: 'IM 4331' },
  { materialCode: 'RM-01-06-0071', materialDescription: 'FOAM 5mm BR LWB', transactionType: 'receiving', quantity: 840, unit: 'PCS', date: d(1, 10, 2026), user: 'Warehouse', reference: 'PD 1013913' },
  { materialCode: 'RM-01-06-0071', materialDescription: 'FOAM 5mm BR LWB', transactionType: 'receiving', quantity: 840, unit: 'PCS', date: d(1, 28, 2026), user: 'Warehouse', reference: 'PD 1014023' },
  // RM-01-06-0072 TRICOT 8MM
  { materialCode: 'RM-01-06-0072', materialDescription: 'TRICOT 8MM ( BR/SC) LWB', transactionType: 'issuance', quantity: 300, unit: 'PCS', date: d(1, 5, 2026), user: 'Warehouse', reference: 'IM 4331' },
  { materialCode: 'RM-01-06-0072', materialDescription: 'TRICOT 8MM ( BR/SC) LWB', transactionType: 'receiving', quantity: 912, unit: 'PCS', date: d(1, 10, 2026), user: 'Warehouse', reference: 'PD 1013913' },
  { materialCode: 'RM-01-06-0072', materialDescription: 'TRICOT 8MM ( BR/SC) LWB', transactionType: 'receiving', quantity: 1320, unit: 'PCS', date: d(1, 12, 2026), user: 'Warehouse', reference: 'PD 1013914' },
  { materialCode: 'RM-01-06-0072', materialDescription: 'TRICOT 8MM ( BR/SC) LWB', transactionType: 'receiving', quantity: 552, unit: 'PCS', date: d(1, 28, 2026), user: 'Warehouse', reference: 'PD 1014023' },
  { materialCode: 'RM-01-06-0072', materialDescription: 'TRICOT 8MM ( BR/SC) LWB', transactionType: 'receiving', quantity: 768, unit: 'PCS', date: d(1, 28, 2026), user: 'Warehouse', reference: 'PD 1014024' },
];

/** Defect sheet data – can be used to seed Defects page or import. */
export const IVMS_DEFECTS: Array<{
  materialCode: string;
  materialDescription: string;
  defectType: string;
  quantity: number;
  unit: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: string;
}> = [
  { materialCode: 'RM-01-06-0087', materialDescription: 'MS PLATE 2MM BACK REST EAR BRKT - 32XD', defectType: 'Defect', quantity: 2, unit: 'PCS', description: 'OFFSET HOLE/NG DIMENSION OFFSET HOLE/NG DIMENSION', severity: 'high', status: '2.0' },
  { materialCode: 'RM-01-06-0088', materialDescription: 'MS PLATE 2MM MID LEG BRKT RH/LH - 32XD', defectType: 'Defect', quantity: 1, unit: 'PCS', description: 'UNCENTERED HOLE - FOR REPLACEMENT', severity: 'medium', status: '1.0' },
  { materialCode: 'RM-01-06-0069', materialDescription: 'FOAM 50MM SEAT CUSHION LWB', defectType: 'Defect', quantity: 2, unit: 'PCS', description: 'WRONG DIMENSION STD: 50MM ACT: 60MM - FOR RETURN TO SUPPLIER', severity: 'high', status: '2.0' },
];
