export type GSTType = 'IGST' | 'CGST_SGST';
export type GSTRate = 0 | 5 | 12 | 18 | 28;

export interface GSTLineItem {
  _id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  hsnCode?: string;
  gstRate: GSTRate;
  gstType: GSTType;
  
  // Computed fields
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalAmount: number;
}

export interface GSTSummary {
  subtotal: number;
  totalCGST: number;
  totalSGST: number;
  totalIGST: number;
  grandTotal: number;
}

/**
 * Pure function to calculate all computed fields for a single line item
 */
export function calculateLineItem(item: Partial<GSTLineItem>): GSTLineItem {
  const quantity = item.quantity || 0;
  const unitPrice = item.unitPrice || 0;
  const gstRate = item.gstRate || 0;
  const gstType = item.gstType || 'CGST_SGST';
  
  const taxableAmount = Number((quantity * unitPrice).toFixed(2));
  
  let cgst = 0;
  let sgst = 0;
  let igst = 0;
  
  if (gstType === 'CGST_SGST') {
    const halfRate = gstRate / 2;
    cgst = Number((taxableAmount * (halfRate / 100)).toFixed(2));
    sgst = Number((taxableAmount * (halfRate / 100)).toFixed(2));
  } else if (gstType === 'IGST') {
    igst = Number((taxableAmount * (gstRate / 100)).toFixed(2));
  }
  
  const totalAmount = Number((taxableAmount + cgst + sgst + igst).toFixed(2));
  
  return {
    _id: item._id,
    description: item.description || '',
    quantity,
    unitPrice,
    hsnCode: item.hsnCode || '',
    gstRate: gstRate as GSTRate,
    gstType,
    taxableAmount,
    cgst,
    sgst,
    igst,
    totalAmount
  };
}

/**
 * Pure function to aggregate all items into a bill-level summary
 */
export function calculateBillTotals(items: GSTLineItem[]): GSTSummary {
  let subtotal = 0;
  let totalCGST = 0;
  let totalSGST = 0;
  let totalIGST = 0;

  items.forEach(item => {
    subtotal += item.taxableAmount;
    totalCGST += item.cgst;
    totalSGST += item.sgst;
    totalIGST += item.igst;
  });

  return {
    subtotal: Number(subtotal.toFixed(2)),
    totalCGST: Number(totalCGST.toFixed(2)),
    totalSGST: Number(totalSGST.toFixed(2)),
    totalIGST: Number(totalIGST.toFixed(2)),
    grandTotal: Number((subtotal + totalCGST + totalSGST + totalIGST).toFixed(2))
  };
}
