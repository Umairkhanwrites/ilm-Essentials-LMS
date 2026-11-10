const fs = require('fs');
const path = require('path');

// 1. UPDATE mockData.js
const mockDataPath = path.join(__dirname, '..', 'src', 'data', 'mockData.js');
let mockData = fs.readFileSync(mockDataPath, 'utf8');

const challanMockReplacements = [
  { id: 'inst_001_1', challanNo: '23528335', paymentMode: 'Meezan Online', paidDate: '2026-10-13' },
  { id: 'inst_001_2', challanNo: '23523587', paymentMode: '—', paidDate: null },
  { id: 'inst_001_3', challanNo: '23937741', paymentMode: '—', paidDate: null },
  { id: 'inst_002_1', challanNo: '24070543', paymentMode: 'Meezan Online', paidDate: null },
  { id: 'inst_003_1', challanNo: '24070544', paymentMode: '1Link Online', paidDate: '2026-10-11' },
  { id: 'inst_004_1', challanNo: '24070545', paymentMode: 'Bank Transfer', paidDate: null },
  { id: 'inst_005_1', challanNo: '24070546', paymentMode: '—', paidDate: null },
];

challanMockReplacements.forEach(({ id, challanNo, paymentMode, paidDate }) => {
  const targetStr = `id: "${id}",`;
  if (mockData.includes(targetStr) && !mockData.includes(`challanNo: "${challanNo}"`)) {
    const paidDateVal = paidDate ? `"${paidDate}"` : 'null';
    mockData = mockData.replace(
      targetStr,
      `id: "${id}",\n    challanNo: "${challanNo}",\n    paymentMode: "${paymentMode}",\n    paidDate: ${paidDateVal},`
    );
  }
});

fs.writeFileSync(mockDataPath, mockData, 'utf8');
console.log('mockData.js updated with challanNo, paymentMode, paidDate');

// 2. UPDATE courseStorage.js
const storagePath = path.join(__dirname, '..', 'src', 'services', 'courseStorage.js');
let storageCode = fs.readFileSync(storagePath, 'utf8');

// Add generateChallanNo helper
const challanGeneratorCode = `
/**
 * Generate a unique 8-digit numeric Challan Number (e.g. 24070543)
 */
export function generateChallanNo() {
  const prefix = '24';
  const randomSuffix = Math.floor(100000 + Math.random() * 900000).toString();
  return \`\${prefix}\${randomSuffix}\`;
}
`;

if (!storageCode.includes('function generateChallanNo')) {
  storageCode = storageCode.replace('export function getFeeInstallments', challanGeneratorCode + '\nexport function getFeeInstallments');
}

// Ensure getFeeInstallments backfills challanNo for any stored items
storageCode = storageCode.replace(
  `  return parsed.map((item) => ({
    ...item,
    amount: Number(item.amount) || 0,
  }));`,
  `  return parsed.map((item, idx) => ({
    ...item,
    challanNo: item.challanNo || \`240\${70540 + idx}\`,
    paymentMode: item.paymentMode || (item.status === 'APPROVED' ? 'Meezan Online' : '—'),
    paidDate: item.paidDate || (item.approvedAt ? item.approvedAt.split('T')[0] : null),
    amount: Number(item.amount) || 0,
  }));`
);

// In createInstallments, add challanNo, paymentMode, paidDate
storageCode = storageCode.replace(
  `    const newInstallment = {
      id: \`inst_\${studentId}_\${Date.now()}_\${Math.random().toString(36).substr(2, 4)}\`,
      studentId: student.id,
      studentName: student.name,
      studentEmail: student.email,
      program: student.program || 'Ilm Foundations',
      title,
      amount: Number(amount),
      dueDate,
      status: 'UNPAID',`,
  `    const newInstallment = {
      id: \`inst_\${studentId}_\${Date.now()}_\${Math.random().toString(36).substr(2, 4)}\`,
      challanNo: generateChallanNo(),
      studentId: student.id,
      studentName: student.name,
      studentEmail: student.email,
      program: student.program || 'Ilm Foundations',
      title,
      amount: Number(amount),
      dueDate,
      paymentMode: '—',
      paidDate: null,
      status: 'UNPAID',`
);

// In approveInstallment, set paidDate and paymentMode
storageCode = storageCode.replace(
  `        approvedByName: adminName,
        approvedAt: now,
        rejectionReason: null,
        updatedAt: now,`,
  `        approvedByName: adminName,
        approvedAt: now,
        paidDate: now.split('T')[0],
        paymentMode: inst.paymentMode && inst.paymentMode !== '—' ? inst.paymentMode : 'Meezan Online',
        rejectionReason: null,
        updatedAt: now,`
);

fs.writeFileSync(storagePath, storageCode, 'utf8');
console.log('courseStorage.js updated with generateChallanNo and challan lifecycle logic');
