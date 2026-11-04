import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Lock,
  Unlock,
  DollarSign,
  CreditCard,
  Calendar,
  Clock,
  Split,
  Tag,
  Percent,
  Receipt,
  UploadCloud,
  FileText,
  Trash2,
  Download,
  Eye,
  Check,
  ShieldCheck,
  RefreshCw,
  Layers,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

/**
 * Unified Slide-Over Billing Drawer
 *
 * Supports Multi-Course Enrollments per Student:
 * - Course / Invoice Switcher Strip for students enrolled in >1 course
 * - Instant context switching between course ledgers
 * - Consolidated Multi-Course Overview tab
 * - Combined / Split payment recording across multiple unpaid invoices
 * - Live Tuition Discount & Installment Planner
 * - Payment Ledger & Audit Trail with entry voiding
 */
export default function BillingDrawer({
  feeRecord,
  allStudentInvoices = [],
  onSelectStudentInvoice,
  isOpen,
  onClose,
  onPrevStudent,
  onNextStudent,
  hasPrevStudent,
  hasNextStudent,
  onSaveDiscount,
  onSaveInstallments,
  onRecordPayment,
  onRecordMultiPayment,
  onVoidPayment,
  onOpenOfficialReceipt,
}) {
  if (!isOpen || !feeRecord) return null;

  // Active view inside the drawer: 'invoice' (specific course) or 'overview' (all courses summary)
  const [activeTabMode, setActiveTabMode] = useState('invoice');

  // Multi-course invoices list (falls back to [feeRecord] if none provided)
  const studentInvoices = useMemo(() => {
    if (Array.isArray(allStudentInvoices) && allStudentInvoices.length > 0) {
      return allStudentInvoices;
    }
    return [feeRecord];
  }, [allStudentInvoices, feeRecord]);

  // Combined totals across all courses for this student
  const combinedSummary = useMemo(() => {
    const totalBilled = studentInvoices.reduce((sum, inv) => sum + (Number(inv.totalAmount) || 0), 0);
    const totalPaid = studentInvoices.reduce((sum, inv) => sum + (Number(inv.paidAmount) || 0), 0);
    const totalDue = studentInvoices.reduce((sum, inv) => sum + (Number(inv.balance) || 0), 0);
    const unpaidCount = studentInvoices.filter((inv) => (Number(inv.balance) || 0) > 0).length;
    const percentOverall = totalBilled > 0 ? Math.min(100, Math.round((totalPaid / totalBilled) * 100)) : 100;
    return { totalBilled, totalPaid, totalDue, unpaidCount, percentOverall };
  }, [studentInvoices]);

  const unpaidInvoices = useMemo(() => {
    return studentInvoices.filter((inv) => (Number(inv.balance) || 0) > 0);
  }, [studentInvoices]);

  // Working fee record for the active course invoice
  const baseFee = Number(feeRecord.baseFee) || Number(feeRecord.totalAmount) || 30000;
  const isSemesterProgram =
    feeRecord.isSemesterWise ??
    (feeRecord.program?.toLowerCase().includes('foundation') ||
      feeRecord.semester?.toLowerCase().includes('semester'));

  // ==========================================
  // 1. DISCOUNT / CONCESSION STATE
  // ==========================================
  const [discountType, setDiscountType] = useState(feeRecord.discountType || 'none');
  const [discountValue, setDiscountValue] = useState(
    feeRecord.discountValue ? String(feeRecord.discountValue) : '5000'
  );
  const [discountReason, setDiscountReason] = useState(
    feeRecord.discountReason || 'Need-Based Financial Aid'
  );
  const [approvedBy, setApprovedBy] = useState(
    feeRecord.discountApprovedBy || 'Faculty Administration'
  );
  const [isConcessionUnlocked, setIsConcessionUnlocked] = useState(false);
  const [discountSuccessMsg, setDiscountSuccessMsg] = useState('');

  // Synchronize state when feeRecord changes
  useEffect(() => {
    setDiscountType(feeRecord.discountType || 'none');
    setDiscountValue(feeRecord.discountValue ? String(feeRecord.discountValue) : '5000');
    setDiscountReason(feeRecord.discountReason || 'Need-Based Financial Aid');
    setApprovedBy(feeRecord.discountApprovedBy || 'Faculty Administration');
    setIsConcessionUnlocked(false);
    setDiscountSuccessMsg('');
    setActiveTabMode('invoice');
  }, [feeRecord.id]);

  // Real-time calculation of discount and net payable
  const { calculatedDiscount, netPayable } = useMemo(() => {
    const val = Number(discountValue) || 0;
    let disc = 0;
    if (discountType === 'fixed') {
      disc = Math.min(baseFee, Math.max(0, val));
    } else if (discountType === 'percentage') {
      const pct = Math.min(100, Math.max(0, val));
      disc = Math.round((baseFee * pct) / 100);
    } else if (discountType === 'waiver') {
      disc = baseFee;
    } else {
      disc = 0;
    }
    const net = Math.max(0, baseFee - disc);
    return { calculatedDiscount: disc, netPayable: net };
  }, [baseFee, discountType, discountValue]);

  const currentPaid = Number(feeRecord.paidAmount) || 0;
  const remainingBalance = Math.max(0, netPayable - currentPaid);
  const percentPaid = netPayable > 0 ? Math.min(100, Math.round((currentPaid / netPayable) * 100)) : 100;
  const isFullySettled = remainingBalance === 0;

  // Validation Guardrail: Student cannot be granted a concession lower than what they already paid
  const isPaidExceedsNewNet = currentPaid > netPayable;

  const handleApplyDiscount = (e) => {
    e.preventDefault();
    if (isPaidExceedsNewNet) return;

    onSaveDiscount(feeRecord.id, {
      discountType,
      discountValue: discountType === 'waiver' ? 100 : Number(discountValue),
      discountReason: discountType === 'none' ? '' : discountReason,
      approvedBy,
    });
    setDiscountSuccessMsg('Concession updated and balance re-calculated.');
    setTimeout(() => setDiscountSuccessMsg(''), 3000);
  };

  // ==========================================
  // 2. INSTALLMENT PLANNER STATE
  // ==========================================
  const existingInstallments = useMemo(() => {
    return Array.isArray(feeRecord.installments) && feeRecord.installments.length > 0
      ? feeRecord.installments
      : [];
  }, [feeRecord.installments]);

  const initialCount = existingInstallments.length > 1 ? existingInstallments.length : 1;
  const [scheduleMode, setScheduleMode] = useState(
    initialCount === 1 ? '1' : initialCount <= 4 ? String(initialCount) : 'custom'
  );
  const [customPartCount, setCustomPartCount] = useState(
    initialCount > 4 ? initialCount : 5
  );
  const [installments, setInstallments] = useState([]);
  const [installmentSuccessMsg, setInstallmentSuccessMsg] = useState('');

  // Re-build installments when schedule mode, student, or netPayable changes
  useEffect(() => {
    const targetCount =
      scheduleMode === 'custom' ? Number(customPartCount) : Number(scheduleMode);

    if (targetCount <= 1) {
      setInstallments([]);
      return;
    }

    if (existingInstallments.length === targetCount) {
      setInstallments(existingInstallments);
      return;
    }

    const basePart = Math.floor(netPayable / targetCount);
    const remainder = netPayable - basePart * targetCount;
    const today = new Date();
    let runningPaid = currentPaid;

    const generated = Array.from({ length: targetCount }, (_, idx) => {
      const partAmt = idx === targetCount - 1 ? basePart + remainder : basePart;
      const dueDateObj = new Date(today.getTime() + idx * 30 * 24 * 60 * 60 * 1000);
      const isPaid = runningPaid >= partAmt;
      if (isPaid) {
        runningPaid -= partAmt;
      }

      return {
        id: `inst_${idx + 1}_${Date.now()}`,
        installmentNumber: idx + 1,
        title: `Installment ${idx + 1} of ${targetCount} (${idx === 0 ? 'Admission' : `Month ${idx + 1}`})`,
        amount: partAmt,
        dueDate: dueDateObj.toISOString().split('T')[0],
        status: isPaid ? 'Paid' : 'Pending',
      };
    });

    setInstallments(generated);
  }, [scheduleMode, customPartCount, feeRecord.id, netPayable]);

  const allocatedInstallmentTotal = useMemo(() => {
    return installments.reduce((sum, inst) => sum + (Number(inst.amount) || 0), 0);
  }, [installments]);

  const isInstallmentAllocationMatched =
    installments.length <= 1 || allocatedInstallmentTotal === netPayable;

  const handleUpdateInstallmentRow = (idx, field, value) => {
    if (installments[idx]?.status === 'Paid') return;

    setInstallments((prev) => {
      const next = [...prev];
      next[idx] = {
        ...next[idx],
        [field]: field === 'amount' ? Number(value) || 0 : value,
      };
      return next;
    });
  };

  const handleAutoBalanceUnpaid = () => {
    const paidSum = installments
      .filter((i) => i.status === 'Paid')
      .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);

    const remainingToDistribute = Math.max(0, netPayable - paidSum);
    const unpaidRows = installments.filter((i) => i.status !== 'Paid');

    if (unpaidRows.length === 0) return;

    const part = Math.floor(remainingToDistribute / unpaidRows.length);
    const rem = remainingToDistribute - part * unpaidRows.length;

    let unpaidIdx = 0;
    setInstallments((prev) =>
      prev.map((inst) => {
        if (inst.status === 'Paid') return inst;
        const amt = unpaidIdx === unpaidRows.length - 1 ? part + rem : part;
        unpaidIdx += 1;
        return { ...inst, amount: amt };
      })
    );
  };

  const handleSaveInstallmentPlan = (e) => {
    e.preventDefault();
    if (!isInstallmentAllocationMatched) return;

    const count = scheduleMode === 'custom' ? Number(customPartCount) : Number(scheduleMode);

    onSaveInstallments(feeRecord.id, {
      installmentCount: count,
      paymentPlan: count > 1 ? `installments_${count}` : 'lump_sum',
      customInstallments: count > 1 ? installments : [],
    });

    setInstallmentSuccessMsg('Installment plan saved successfully.');
    setTimeout(() => setInstallmentSuccessMsg(''), 3000);
  };

  // ==========================================
  // 3. PAYMENT CAPTURE & COMBINED SPLIT STATE
  // ==========================================
  const nextPendingInstallment = useMemo(() => {
    return Array.isArray(feeRecord.installments)
      ? feeRecord.installments.find((i) => i.status !== 'Paid')
      : null;
  }, [feeRecord.installments]);

  const [paymentAmount, setPaymentAmount] = useState('');
  const [selectedInstallmentId, setSelectedInstallmentId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer (Meezan Bank)');
  const [transactionRef, setTransactionRef] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentNotes, setPaymentNotes] = useState('');
  const [proofAttachment, setProofAttachment] = useState(null);
  const [paymentError, setPaymentError] = useState('');
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState('');
  const fileInputRef = useRef(null);

  // Multi-Course Split Payment Mode
  const [isMultiPaymentMode, setIsMultiPaymentMode] = useState(false);
  const [multiTotalAmount, setMultiTotalAmount] = useState('');
  const [multiAllocations, setMultiAllocations] = useState({});

  // Reset/Initialize payment capture fields on feeRecord change
  useEffect(() => {
    if (nextPendingInstallment) {
      setSelectedInstallmentId(nextPendingInstallment.id);
      setPaymentAmount(String(nextPendingInstallment.amount));
      setPaymentNotes(`Payment for ${nextPendingInstallment.title}`);
    } else {
      setSelectedInstallmentId('');
      setPaymentAmount(remainingBalance > 0 ? String(remainingBalance) : '');
      setPaymentNotes('');
    }
    setTransactionRef(`TRX-${Math.floor(100000 + Math.random() * 900000)}`);
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setProofAttachment(null);
    setPaymentError('');
    setIsMultiPaymentMode(false);

    // Initialize multi-allocations with exact remaining balances for unpaid invoices
    const initialAlloc = {};
    unpaidInvoices.forEach((inv) => {
      initialAlloc[inv.id] = Number(inv.balance) || 0;
    });
    setMultiAllocations(initialAlloc);
    setMultiTotalAmount(String(combinedSummary.totalDue));
  }, [feeRecord.id, remainingBalance, nextPendingInstallment, unpaidInvoices, combinedSummary.totalDue]);

  const handleInstallmentSelectChange = (e) => {
    const instId = e.target.value;
    setSelectedInstallmentId(instId);
    if (!instId) {
      setPaymentAmount(String(remainingBalance));
      setPaymentNotes('');
    } else {
      const match = (feeRecord.installments || []).find((i) => i.id === instId);
      if (match) {
        setPaymentAmount(String(match.amount));
        setPaymentNotes(`Payment for ${match.title}`);
      }
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setProofAttachment({
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        type: file.type,
      });
    }
  };

  // Auto-distribute total multi-payment sequentially or proportionally
  const handleAutoDistributeMultiPayment = () => {
    const totalToApply = Number(multiTotalAmount) || 0;
    let remaining = totalToApply;
    const newAlloc = {};

    unpaidInvoices.forEach((inv) => {
      const due = Number(inv.balance) || 0;
      const alloc = Math.min(due, Math.max(0, remaining));
      newAlloc[inv.id] = alloc;
      remaining -= alloc;
    });

    setMultiAllocations(newAlloc);
  };

  // Sum of currently entered multi allocations
  const multiAllocationsSum = useMemo(() => {
    return Object.values(multiAllocations).reduce((sum, v) => sum + (Number(v) || 0), 0);
  }, [multiAllocations]);

  const isMultiAllocationMatched =
    Number(multiTotalAmount) > 0 && multiAllocationsSum === Number(multiTotalAmount);

  // Single Course Payment Submission
  const handleRecordPaymentSubmit = (e) => {
    e.preventDefault();
    setPaymentError('');

    const amt = Number(paymentAmount);
    if (!amt || amt <= 0) {
      setPaymentError('Please enter a valid positive payment amount.');
      return;
    }
    if (amt > remainingBalance) {
      setPaymentError(`Amount cannot exceed the remaining balance of PKR ${remainingBalance.toLocaleString()}.`);
      return;
    }

    onRecordPayment(feeRecord.id, {
      amount: amt,
      paymentMethod,
      transactionRef: transactionRef.trim() || `TRX-${Date.now().toString().slice(-6)}`,
      paidDate: paymentDate,
      notes: paymentNotes,
      installmentId: selectedInstallmentId || null,
      proofAttachment: proofAttachment ? proofAttachment.name : null,
    });

    setPaymentSuccessMsg('Payment successfully recorded and ledger updated.');
    setTimeout(() => setPaymentSuccessMsg(''), 3000);
  };

  // Combined Multi-Course Payment Submission
  const handleRecordMultiPaymentSubmit = (e) => {
    e.preventDefault();
    setPaymentError('');

    const total = Number(multiTotalAmount);
    if (!total || total <= 0) {
      setPaymentError('Please enter a valid combined payment transaction amount.');
      return;
    }
    if (!isMultiAllocationMatched) {
      setPaymentError(
        `Total allocated (PKR ${multiAllocationsSum.toLocaleString()}) does not match the transaction amount of PKR ${total.toLocaleString()}.`
      );
      return;
    }

    // Prepare payments array for each allocated invoice
    const commonRef = transactionRef.trim() || `TRX-COMB-${Date.now().toString().slice(-6)}`;
    const paymentsToRecord = unpaidInvoices
      .filter((inv) => Number(multiAllocations[inv.id]) > 0)
      .map((inv) => ({
        feeId: inv.id,
        amount: Number(multiAllocations[inv.id]),
        paymentMethod,
        transactionRef: commonRef,
        paidDate: paymentDate,
        notes: paymentNotes
          ? `${paymentNotes} (Combined transfer of PKR ${total.toLocaleString()})`
          : `Combined split transfer of PKR ${total.toLocaleString()}`,
        proofAttachment: proofAttachment ? proofAttachment.name : null,
      }));

    if (onRecordMultiPayment) {
      onRecordMultiPayment(paymentsToRecord);
    } else {
      // Fallback
      paymentsToRecord.forEach((p) => onRecordPayment(p.feeId, p));
    }

    setPaymentSuccessMsg(`Combined payment of PKR ${total.toLocaleString()} recorded across ${paymentsToRecord.length} invoices.`);
    setIsMultiPaymentMode(false);
    setTimeout(() => setPaymentSuccessMsg(''), 3500);
  };

  // ==========================================
  // 4. KEYBOARD NAVIGATION & LISTENERS
  // ==========================================
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowUp' && hasPrevStudent) {
        onPrevStudent();
      } else if (e.key === 'ArrowDown' && hasNextStudent) {
        onNextStudent();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onPrevStudent, onNextStudent, hasPrevStudent, hasNextStudent]);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop with blur */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-primary-950/60 backdrop-blur-xs transition-opacity cursor-pointer"
      />

      {/* Slide-over panel */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
        className="relative w-full max-w-4xl h-screen bg-[#F9F8F6] shadow-2xl flex flex-col z-10 border-l border-[#EFECE6] overflow-hidden"
      >
        {/* ======================================================== */}
        {/* A. STICKY DRAWER HEADER (Dark Forest Green #0B3324)     */}
        {/* ======================================================== */}
        <div className="bg-[#0B3324] text-white px-6 py-4 border-b border-primary-900/60 shrink-0 shadow-xs space-y-3">
          {/* Top Row: Student info & Prev/Next/Close */}
          <div className="flex items-center justify-between">
            {/* Left info */}
            <div className="flex items-center gap-3.5">
              <div className="h-10 w-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-emerald-300 font-serif font-bold text-lg">
                {feeRecord.studentName?.charAt(0) || 'S'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white tracking-tight">
                    {feeRecord.studentName}
                  </h2>
                  <span className="text-[11px] text-emerald-300 bg-white/10 px-2 py-0.5 rounded-md font-semibold">
                    {feeRecord.invoiceNo}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      feeRecord.status === 'Paid'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                        : feeRecord.status === 'Partial'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                        : feeRecord.status === 'Waived'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-400/40'
                        : 'bg-gold-500/20 text-gold-300 border border-gold-400/40'
                    }`}
                  >
                    {feeRecord.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-primary-200 mt-0.5">
                  <span>{feeRecord.studentEmail}</span>
                  <span>&bull;</span>
                  <span className="text-white/80 font-medium">
                    {feeRecord.program}
                    {feeRecord.semester ? ` (${feeRecord.semester})` : ''}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Navigation Controls */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-white/10 rounded-lg p-0.5 border border-white/10">
                <button
                  type="button"
                  onClick={onPrevStudent}
                  disabled={!hasPrevStudent}
                  title="Previous Student (ArrowUp)"
                  className="p-1.5 rounded-md text-white/80 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <ChevronUp size={16} />
                </button>
                <span className="text-[10px] text-white/50 px-1 ">Navigate</span>
                <button
                  type="button"
                  onClick={onNextStudent}
                  disabled={!hasNextStudent}
                  title="Next Student (ArrowDown)"
                  className="p-1.5 rounded-md text-white/80 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <ChevronDown size={16} />
                </button>
              </div>

              <button
                type="button"
                onClick={onClose}
                title="Close Drawer (Esc)"
                className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer ml-1"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* ==================================================== */}
          {/* MULTI-COURSE ENROLLMENT SWITCHER STRIP (If >1 course)*/}
          {/* ==================================================== */}
          {studentInvoices.length > 1 && (
            <div className="pt-2.5 border-t border-white/10 flex items-center gap-1.5 overflow-x-auto pb-0.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-300 shrink-0 mr-1 flex items-center gap-1">
                <Layers size={11} />
                <span>Programs ({studentInvoices.length}):</span>
              </span>

              {/* Individual Course Invoices */}
              {studentInvoices.map((inv) => {
                const isSelected = inv.id === feeRecord.id && activeTabMode === 'invoice';
                const isPaid = inv.status === 'Paid' || (Number(inv.balance) || 0) === 0;

                return (
                  <button
                    key={inv.id}
                    type="button"
                    onClick={() => {
                      setActiveTabMode('invoice');
                      if (onSelectStudentInvoice) onSelectStudentInvoice(inv);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 border ${
                      isSelected
                        ? 'bg-white text-[#0B3324] border-white shadow-xs font-bold ring-2 ring-emerald-400/30'
                        : 'bg-white/10 text-white/90 border-white/15 hover:bg-white/20'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isPaid
                          ? 'bg-emerald-400'
                          : inv.status === 'Partial'
                          ? 'bg-amber-400'
                          : 'bg-gold-400'
                      }`}
                    />
                    <span>{inv.program}</span>
                    <span className="text-[10px] opacity-75">
                      ({inv.invoiceNo})
                    </span>
                    {!isPaid && inv.balance > 0 && (
                      <span className="text-[10px] text-amber-300 font-bold">
                        • PKR {inv.balance.toLocaleString()} Due
                      </span>
                    )}
                  </button>
                );
              })}

              {/* Combined All Courses Overview Tab */}
              <button
                type="button"
                onClick={() => setActiveTabMode('overview')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 border ${
                  activeTabMode === 'overview'
                    ? 'bg-white text-[#0B3324] border-white shadow-xs font-bold ring-2 ring-emerald-400/30'
                    : 'bg-white/10 text-white/90 border-white/15 hover:bg-white/20'
                }`}
              >
                <Receipt size={11} />
                <span>All Courses Overview</span>
                <span className="text-[10px] text-emerald-300 font-bold">
                  ({combinedSummary.totalDue === 0 ? 'Settled' : `PKR ${combinedSummary.totalDue.toLocaleString()} Due`})
                </span>
              </button>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* B. STICKY 4-METRIC LIVE FINANCIAL SUMMARY STRIP          */}
        {/* ======================================================== */}
        <div className="bg-white border-b border-[#EFECE6] px-6 py-3.5 shadow-2xs shrink-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            {/* 1. Base Tuition */}
            <div className="border-r border-sand-200/80 pr-3">
              <span className="text-[10px] uppercase font-bold tracking-wider text-ink-400 block">
                {activeTabMode === 'overview' ? 'Combined Tuition' : 'Base Tuition'}
              </span>
              <span className="text-sm font-bold text-ink-800">
                PKR {(activeTabMode === 'overview' ? combinedSummary.totalBilled : baseFee).toLocaleString()}
              </span>
            </div>

            {/* 2. Scholarship / Discount */}
            <div className="border-r border-sand-200/80 pr-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider text-ink-400 block">
                  Concession / Aid
                </span>
                {calculatedDiscount > 0 && activeTabMode !== 'overview' && (
                  <span className="text-[9px] font-bold text-primary-900 bg-primary-50 px-1.5 rounded">
                    {discountType === 'waiver'
                      ? '100% Waiver'
                      : discountType === 'percentage'
                      ? `${discountValue}% Off`
                      : 'Fixed Aid'}
                  </span>
                )}
              </div>
              <span className="text-sm font-bold text-emerald-700">
                - PKR {(activeTabMode === 'overview' ? 0 : calculatedDiscount).toLocaleString()}
              </span>
            </div>

            {/* 3. Net Payable */}
            <div className="border-r border-sand-200/80 pr-3">
              <span className="text-[10px] uppercase font-bold tracking-wider text-ink-400 block">
                {activeTabMode === 'overview' ? 'Total Collected' : 'Net Payable'}
              </span>
              <span className="text-sm font-extrabold text-[#0B3324]">
                PKR {(activeTabMode === 'overview' ? combinedSummary.totalPaid : netPayable).toLocaleString()}
              </span>
            </div>

            {/* 4. Remaining Balance & Progress Bar */}
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider text-ink-400 block">
                  {activeTabMode === 'overview' ? 'Combined Remaining' : 'Remaining Due'}
                </span>
                <span className="text-[10px] font-semibold text-ink-500">
                  {activeTabMode === 'overview' ? combinedSummary.percentOverall : percentPaid}% Paid
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span
                  className={`text-sm font-extrabold ${
                    (activeTabMode === 'overview' ? combinedSummary.totalDue : remainingBalance) === 0
                      ? 'text-emerald-700'
                      : 'text-ink-900'
                  }`}
                >
                  PKR {(activeTabMode === 'overview' ? combinedSummary.totalDue : remainingBalance).toLocaleString()}
                </span>
                {(activeTabMode === 'overview' ? combinedSummary.totalDue : remainingBalance) === 0 && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1 rounded">
                    Settled
                  </span>
                )}
              </div>
              {/* Mini linear progress */}
              <div className="w-full bg-sand-200 h-1.5 rounded-full overflow-hidden mt-1">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    (activeTabMode === 'overview' ? combinedSummary.percentOverall : percentPaid) >= 100
                      ? 'bg-emerald-600'
                      : (activeTabMode === 'overview' ? combinedSummary.percentOverall : percentPaid) > 0
                      ? 'bg-emerald-500'
                      : 'bg-sand-400'
                  }`}
                  style={{
                    width: `${activeTabMode === 'overview' ? combinedSummary.percentOverall : percentPaid}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* C. SCROLLABLE DRAWER BODY (12-Col Responsive Grid)       */}
        {/* ======================================================== */}
        {activeTabMode === 'overview' ? (
          /* ====================================================== */
          /* OVERVIEW TAB: CONSOLIDATED ALL COURSES FINANCIAL VIEW   */
          /* ====================================================== */
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#F9F8F6]">
            <div className="bg-white rounded-2xl p-6 border border-[#EFECE6] shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-sand-200/80 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-primary-100 text-[#0B3324]">
                    <Layers size={18} />
                  </div>
                  <div>
                    <h3 className="font-heading text-base font-bold text-ink-900">
                      Consolidated Multi-Course Financial Overview
                    </h3>
                    <p className="text-xs text-ink-500">
                      Summary of all {studentInvoices.length} active course enrollments and invoices for {feeRecord.studentName}.
                    </p>
                  </div>
                </div>

                <span className="text-xs font-bold px-3 py-1 rounded-full bg-sand-100 text-ink-800 border border-sand-200">
                  {combinedSummary.unpaidCount > 0
                    ? `${combinedSummary.unpaidCount} Invoices Pending Payment`
                    : 'All Courses Fully Settled'}
                </span>
              </div>

              {/* Course Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {studentInvoices.map((inv) => {
                  const invPaidPct =
                    inv.totalAmount > 0
                      ? Math.min(100, Math.round(((inv.paidAmount || 0) / inv.totalAmount) * 100))
                      : 100;
                  const isInvPaid = inv.status === 'Paid' || (Number(inv.balance) || 0) === 0;

                  return (
                    <div
                      key={inv.id}
                      className="p-4 rounded-xl border border-[#EFECE6] bg-sand-50/50 hover:bg-white hover:border-sand-300 transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-ink-900">
                              {inv.program}
                            </span>
                            <span className="text-[10px] text-[#0B3324] font-semibold bg-white px-1.5 py-0.5 rounded border border-sand-200">
                              {inv.invoiceNo}
                            </span>
                          </div>
                          <span className="text-[11px] text-ink-500 block mt-0.5">
                            {inv.semester || 'Modular Course'}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isInvPaid
                              ? 'bg-primary-50 text-primary-900 border border-primary-200'
                              : inv.status === 'Partial'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-gold-100 text-gold-800'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center text-xs py-2 bg-white rounded-lg border border-sand-200/60 ">
                        <div>
                          <span className="text-[9px] uppercase font-bold text-ink-400 block font-sans">
                            Billed
                          </span>
                          <span className="font-semibold text-ink-800">
                            PKR {inv.totalAmount?.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase font-bold text-ink-400 block font-sans">
                            Paid
                          </span>
                          <span className="font-bold text-primary-900">
                            PKR {inv.paidAmount?.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] uppercase font-bold text-ink-400 block font-sans">
                            Remaining
                          </span>
                          <span className={`font-bold ${isInvPaid ? 'text-emerald-700' : 'text-ink-900'}`}>
                            PKR {inv.balance?.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Linear progress */}
                      <div className="w-full bg-sand-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            invPaidPct >= 100 ? 'bg-emerald-600' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${invPaidPct}%` }}
                        />
                      </div>

                      <div className="pt-2 flex items-center justify-between border-t border-sand-200/60">
                        <span className="text-[11px] text-ink-500 ">
                          Due: {inv.dueDate}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTabMode('invoice');
                            if (onSelectStudentInvoice) onSelectStudentInvoice(inv);
                          }}
                          className="inline-flex items-center gap-1 text-xs font-bold text-[#0B3324] hover:text-[#072419] bg-white hover:bg-sand-100 px-2.5 py-1 rounded-lg border border-sand-300 transition-colors cursor-pointer"
                        >
                          <span>Manage Ledger</span>
                          <ArrowRight size={11} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* ====================================================== */
          /* INVOICE TAB: SPECIFIC COURSE INVOICE LEDGER & ACTIONS  */
          /* ====================================================== */
          <div className="flex-1 overflow-y-auto p-6 space-y-6 lg:space-y-0 lg:grid lg:grid-cols-12 lg:gap-6 bg-[#F9F8F6]">
            {/* ==================================================== */}
            {/* LEFT COLUMN: 7 Columns (Concessions + Installments)   */}
            {/* ==================================================== */}
            <div className="lg:col-span-7 space-y-5">
              {/* -------------------------------------------------- */}
              {/* CARD 1: TUITION DISCOUNT & SCHOLARSHIP             */}
              {/* -------------------------------------------------- */}
              <div className="bg-white rounded-2xl p-5 border border-[#EFECE6] shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-50 text-primary-900">
                      <Tag size={15} />
                    </div>
                    <div>
                      <h3 className="font-bold text-xs text-ink-900 uppercase tracking-wider">
                        Tuition Discount &amp; Scholarship
                      </h3>
                      <p className="text-[11px] text-ink-500">
                        Grant student-specific financial aid, waivers, or merit concessions.
                      </p>
                    </div>
                  </div>

                  {isFullySettled && !isConcessionUnlocked && (
                    <button
                      type="button"
                      onClick={() => setIsConcessionUnlocked(true)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-ink-600 hover:text-ink-900 bg-sand-100 hover:bg-sand-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                    >
                      <Unlock size={12} />
                      <span>Unlock to Edit Concession</span>
                    </button>
                  )}
                </div>

                {isFullySettled && !isConcessionUnlocked ? (
                  <div className="p-3.5 bg-emerald-50/60 border border-emerald-200/80 rounded-xl text-xs text-emerald-900 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-emerald-700 shrink-0" />
                      <span>Invoice is fully settled. Concession settings are locked to protect accounting consistency.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsConcessionUnlocked(true)}
                      className="text-[11px] font-bold underline text-emerald-900 hover:text-emerald-950 ml-2 shrink-0 cursor-pointer"
                    >
                      Modify Anyway
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyDiscount} className="space-y-3.5 text-xs">
                    {isPaidExceedsNewNet && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 flex items-start gap-2">
                        <AlertTriangle size={15} className="text-red-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold block">Adjustment Blocked:</span>
                          <span>
                            Student has already paid PKR {currentPaid.toLocaleString()}, which exceeds the new Net Payable amount of PKR {netPayable.toLocaleString()}. Void or refund excess payments first.
                          </span>
                        </div>
                      </div>
                    )}

                    {discountSuccessMsg && (
                      <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-primary-900 text-xs flex items-center gap-1.5 font-medium">
                        <CheckCircle2 size={14} className="text-emerald-600" />
                        <span>{discountSuccessMsg}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'none', label: 'Standard', desc: 'No concession (0% off)' },
                        { id: 'fixed', label: 'Fixed PKR Off', desc: 'Custom PKR amount' },
                        { id: 'percentage', label: 'Percentage (%)', desc: '1% to 100% off' },
                        { id: 'waiver', label: 'Full Scholarship', desc: '100% Tuition waiver' },
                      ].map((opt) => (
                        <button
                          type="button"
                          key={opt.id}
                          onClick={() => setDiscountType(opt.id)}
                          className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                            discountType === opt.id
                              ? 'border-[#0B3324] bg-emerald-50/60 ring-2 ring-emerald-600/20'
                              : 'border-[#EFECE6] bg-white hover:bg-sand-50/60'
                          }`}
                        >
                          <div className="font-bold text-xs text-ink-900">{opt.label}</div>
                          <div className="text-[10px] text-ink-500">{opt.desc}</div>
                        </button>
                      ))}
                    </div>

                    {(discountType === 'fixed' || discountType === 'percentage') && (
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="text-[11px] font-bold text-ink-700 block mb-1">
                            {discountType === 'fixed' ? 'Discount Amount (PKR) *' : 'Percentage Off (%) *'}
                          </label>
                          <input
                            type="number"
                            required
                            min="1"
                            max={discountType === 'fixed' ? baseFee : 100}
                            value={discountValue}
                            onChange={(e) => setDiscountValue(e.target.value)}
                            className="w-full px-3 py-1.5 text-xs border border-sand-300 rounded-xl bg-white font-bold focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-ink-700 block mb-1">
                            Calculated Deduction
                          </label>
                          <div className="px-3 py-1.5 text-xs bg-sand-100 rounded-xl font-bold text-primary-900 border border-sand-200">
                            - PKR {calculatedDiscount.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    )}

                    {discountType !== 'none' && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-bold text-ink-700 block mb-1">
                            Reason / Concession Code *
                          </label>
                          <input
                            type="text"
                            required
                            value={discountReason}
                            onChange={(e) => setDiscountReason(e.target.value)}
                            placeholder="e.g. Need-Based Financial Aid"
                            className="w-full px-3 py-1.5 text-xs border border-sand-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-ink-700 block mb-1">
                            Approved Authority
                          </label>
                          <input
                            type="text"
                            value={approvedBy}
                            onChange={(e) => setApprovedBy(e.target.value)}
                            placeholder="e.g. Faculty Dean"
                            className="w-full px-3 py-1.5 text-xs border border-sand-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                          />
                        </div>
                      </div>
                    )}

                    <div className="pt-2 flex items-center justify-end">
                      <button
                        type="submit"
                        disabled={isPaidExceedsNewNet}
                        className="px-4 py-1.5 rounded-xl bg-[#0B3324] hover:bg-[#072419] text-white font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition-colors cursor-pointer"
                      >
                        Save Concession
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* -------------------------------------------------- */}
              {/* CARD 2: SEMESTER FEE INSTALLMENT PLANNER           */}
              {/* -------------------------------------------------- */}
              <div className="bg-white rounded-2xl p-5 border border-[#EFECE6] shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-sky-50 text-sky-800">
                      <Split size={15} />
                    </div>
                    <div>
                      <h3 className="font-bold text-xs text-ink-900 uppercase tracking-wider">
                        Semester Fee Installment Planner
                      </h3>
                      <p className="text-[11px] text-ink-500">
                        Configure multi-part installment schedules with automated allocation checks.
                      </p>
                    </div>
                  </div>

                  {isSemesterProgram && (
                    <span className="text-[10px] font-bold text-sky-800 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-full">
                      Semester Track
                    </span>
                  )}
                </div>

                {!isSemesterProgram ? (
                  <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                    <AlertCircle size={15} className="text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Modular / Short Course Program:</span>
                      <span>
                        Installment splitting is reserved for structured semester cohorts (such as <em>Ilm Foundations</em>). Students in modular courses (such as <em>Ilm Intensives</em>) are billed upfront per course.
                      </span>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSaveInstallmentPlan} className="space-y-4 text-xs">
                    {installmentSuccessMsg && (
                      <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-primary-900 text-xs flex items-center gap-1.5 font-medium">
                        <CheckCircle2 size={14} className="text-emerald-600" />
                        <span>{installmentSuccessMsg}</span>
                      </div>
                    )}

                    <div>
                      <label className="text-[11px] font-bold text-ink-700 block mb-1.5">
                        Schedule Structure
                      </label>
                      <div className="grid grid-cols-5 gap-1.5 p-1 bg-sand-100 rounded-xl border border-sand-200">
                        {[
                          { id: '1', label: 'Lump Sum' },
                          { id: '2', label: '2 Parts' },
                          { id: '3', label: '3 Parts' },
                          { id: '4', label: '4 Parts' },
                          { id: 'custom', label: 'Custom' },
                        ].map((seg) => (
                          <button
                            type="button"
                            key={seg.id}
                            onClick={() => setScheduleMode(seg.id)}
                            className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
                              scheduleMode === seg.id
                                ? 'bg-white text-[#0B3324] shadow-xs'
                                : 'text-ink-600 hover:text-ink-900'
                            }`}
                          >
                            {seg.label}
                          </button>
                        ))}
                      </div>

                      {scheduleMode === 'custom' && (
                        <div className="mt-2.5 flex items-center gap-2 p-2.5 bg-sand-50 rounded-xl border border-sand-200">
                          <span className="text-[11px] font-bold text-ink-700">
                            Custom Part Count (2 to 12):
                          </span>
                          <input
                            type="number"
                            min="2"
                            max="12"
                            value={customPartCount}
                            onChange={(e) =>
                              setCustomPartCount(Math.max(2, Math.min(12, Number(e.target.value) || 2)))
                            }
                            className="w-16 px-2 py-1 text-xs font-bold text-center border border-sand-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                          />
                          <span className="text-[11px] text-ink-500">equal monthly intervals</span>
                        </div>
                      )}
                    </div>

                    {installments.length > 1 && (
                      <>
                        <div
                          className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                            isInstallmentAllocationMatched
                              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                              : 'bg-amber-50/80 border-amber-300 text-amber-900'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {isInstallmentAllocationMatched ? (
                              <CheckCircle2 size={16} className="text-emerald-700 shrink-0" />
                            ) : (
                              <AlertTriangle size={16} className="text-amber-700 shrink-0" />
                            )}
                            <div>
                              <span className="font-bold">
                                Total Allocated: PKR {allocatedInstallmentTotal.toLocaleString()} / Net Payable: PKR {netPayable.toLocaleString()}
                              </span>
                              {!isInstallmentAllocationMatched && (
                                <span className="text-[11px] block text-amber-800">
                                  Discrepancy of PKR {Math.abs(allocatedInstallmentTotal - netPayable).toLocaleString()}. Sum must equal Net Payable to save.
                                </span>
                              )}
                            </div>
                          </div>

                          {!isInstallmentAllocationMatched && (
                            <button
                              type="button"
                              onClick={handleAutoBalanceUnpaid}
                              className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-200/70 hover:bg-amber-300/80 text-amber-950 transition-colors cursor-pointer shrink-0"
                            >
                              <RefreshCw size={11} />
                              <span>Auto-Balance</span>
                            </button>
                          )}
                        </div>

                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                          {installments.map((inst, idx) => {
                            const isPaid = inst.status === 'Paid';
                            return (
                              <div
                                key={inst.id || idx}
                                className={`p-3 rounded-xl border transition-all ${
                                  isPaid
                                    ? 'bg-sand-50/80 border-sand-200'
                                    : 'bg-white border-[#EFECE6] hover:border-sand-300'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-ink-900 text-[11px]">
                                      {inst.title}
                                    </span>
                                    {isPaid && (
                                      <span
                                        className="inline-flex items-center gap-0.5 text-[10px] font-bold text-ink-500 bg-sand-200/70 px-1.5 py-0.2 rounded"
                                        title="Historical paid row is locked"
                                      >
                                        <Lock size={10} />
                                        Locked
                                      </span>
                                    )}
                                  </div>
                                  <span
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                      isPaid
                                        ? 'bg-primary-50 text-primary-900 border border-primary-200'
                                        : 'bg-sand-100 text-ink-700'
                                    }`}
                                  >
                                    {inst.status}
                                  </span>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="text-[10px] font-bold uppercase text-ink-500 block mb-0.5">
                                      Amount (PKR)
                                    </label>
                                    <input
                                      type="number"
                                      disabled={isPaid}
                                      value={inst.amount}
                                      onChange={(e) =>
                                        handleUpdateInstallmentRow(idx, 'amount', e.target.value)
                                      }
                                      className={`w-full px-2.5 py-1 text-xs border rounded-lg font-bold ${
                                        isPaid
                                          ? 'bg-sand-100/70 border-sand-200 text-ink-500 cursor-not-allowed'
                                          : 'bg-white border-sand-300 text-ink-900 focus:outline-none focus:ring-1 focus:ring-sky-500'
                                      }`}
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] font-bold uppercase text-ink-500 block mb-0.5">
                                      Due Date
                                    </label>
                                    <input
                                      type="date"
                                      disabled={isPaid}
                                      value={inst.dueDate}
                                      onChange={(e) =>
                                        handleUpdateInstallmentRow(idx, 'dueDate', e.target.value)
                                      }
                                      className={`w-full px-2.5 py-1 text-xs border rounded-lg ${
                                        isPaid
                                          ? 'bg-sand-100/70 border-sand-200 text-ink-500 cursor-not-allowed'
                                          : 'bg-white border-sand-300 text-ink-900 focus:outline-none focus:ring-1 focus:ring-sky-500'
                                      }`}
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}

                    <div className="pt-2 flex items-center justify-end">
                      <button
                        type="submit"
                        disabled={!isInstallmentAllocationMatched}
                        className="px-4 py-1.5 rounded-xl bg-[#0B3324] hover:bg-[#072419] text-white font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition-colors cursor-pointer"
                      >
                        Save Installment Plan
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>

            {/* ==================================================== */}
            {/* RIGHT COLUMN: 5 Columns (Payment Capture & Ledger)   */}
            {/* ==================================================== */}
            <div className="lg:col-span-5 space-y-5">
              {/* -------------------------------------------------- */}
              {/* CARD 1: RECORD TUITION PAYMENT (Sticky Top)        */}
              {/* -------------------------------------------------- */}
              <div className="bg-white rounded-2xl p-5 border border-[#EFECE6] shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-50 text-primary-900">
                      <DollarSign size={15} />
                    </div>
                    <div>
                      <h3 className="font-bold text-xs text-ink-900 uppercase tracking-wider">
                        Record Tuition Payment
                      </h3>
                      <p className="text-[11px] text-ink-500">
                        Offline bank transfers, Raast, or campus cash.
                      </p>
                    </div>
                  </div>
                </div>

                {/* MULTI-COURSE PAYMENT OPTION CHECKBOX */}
                {unpaidInvoices.length > 1 && (
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isMultiPaymentMode}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setIsMultiPaymentMode(checked);
                          if (checked) {
                            handleAutoDistributeMultiPayment();
                          }
                        }}
                        className="rounded text-primary-900 focus:ring-emerald-600 h-4 w-4 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-emerald-950">
                        Apply payment across multiple unpaid courses
                      </span>
                    </label>
                    <p className="text-[11px] text-primary-900 leading-snug">
                      Combine a single bank transfer across {unpaidInvoices.length} outstanding invoices with linked audit records.
                    </p>
                  </div>
                )}

                {/* COMBINED MULTI-COURSE PAYMENT FORM */}
                {isMultiPaymentMode ? (
                  <form onSubmit={handleRecordMultiPaymentSubmit} className="space-y-3.5 text-xs">
                    {paymentError && (
                      <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-800 text-[11px] flex items-center gap-1.5">
                        <AlertCircle size={14} className="shrink-0 text-red-600" />
                        <span>{paymentError}</span>
                      </div>
                    )}

                    {paymentSuccessMsg && (
                      <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-primary-900 text-xs flex items-center gap-1.5 font-medium">
                        <CheckCircle2 size={14} className="text-emerald-600" />
                        <span>{paymentSuccessMsg}</span>
                      </div>
                    )}

                    {/* Total Transaction Amount */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-bold text-ink-700 block">
                          Total Transfer Amount (PKR) *
                        </label>
                        <span className="text-[10px] text-ink-500 ">
                          Combined Due: PKR {combinedSummary.totalDue.toLocaleString()}
                        </span>
                      </div>
                      <input
                        type="number"
                        required
                        min="1"
                        max={combinedSummary.totalDue}
                        value={multiTotalAmount}
                        onChange={(e) => setMultiTotalAmount(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs border border-sand-300 rounded-xl bg-white font-bold focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                      />
                    </div>

                    {/* Course Invoices Allocation Breakdown */}
                    <div className="space-y-2 p-3 bg-sand-50 rounded-xl border border-sand-200">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-ink-800 uppercase tracking-wider">
                          Allocate to Invoices
                        </span>
                        <button
                          type="button"
                          onClick={handleAutoDistributeMultiPayment}
                          className="text-[10px] font-bold text-primary-800 hover:text-primary-950 underline cursor-pointer"
                        >
                          Auto-Distribute
                        </button>
                      </div>

                      {unpaidInvoices.map((inv) => (
                        <div key={inv.id} className="p-2 bg-white rounded-lg border border-sand-200 space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-ink-900 truncate max-w-[170px]">
                              {inv.program}
                            </span>
                            <span className="text-ink-500 text-[10px]">
                              Due: PKR {inv.balance?.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-ink-400">
                              {inv.invoiceNo}:
                            </span>
                            <input
                              type="number"
                              min="0"
                              max={inv.balance}
                              value={multiAllocations[inv.id] ?? 0}
                              onChange={(e) => {
                                const val = Math.max(0, Math.min(inv.balance, Number(e.target.value) || 0));
                                setMultiAllocations({ ...multiAllocations, [inv.id]: val });
                              }}
                              className="w-full px-2 py-1 text-xs font-bold border border-sand-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-600"
                            />
                          </div>
                        </div>
                      ))}

                      {/* Allocation check bar */}
                      <div className="pt-1 flex items-center justify-between text-[11px] ">
                        <span className="text-ink-600">Total Allocated:</span>
                        <span
                          className={`font-bold ${
                            isMultiAllocationMatched ? 'text-emerald-700' : 'text-amber-700'
                          }`}
                        >
                          PKR {multiAllocationsSum.toLocaleString()} / PKR {(Number(multiTotalAmount) || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Common Transaction Fields */}
                    <div>
                      <label className="text-[11px] font-bold text-ink-700 block mb-1">
                        Payment Channel / Method
                      </label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-sand-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                      >
                        <option value="Bank Transfer (Meezan Bank)">Bank Transfer (Meezan Bank)</option>
                        <option value="Raast Instant Transfer">Raast Instant Transfer</option>
                        <option value="HBL Online Banking">HBL Online Banking</option>
                        <option value="Cash at DHA Campus">Cash at DHA Lahore Campus</option>
                        <option value="Credit/Debit Card (Online)">Credit/Debit Card (Online)</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] font-bold text-ink-700 block mb-1">
                          TRX / Reference ID
                        </label>
                        <input
                          type="text"
                          value={transactionRef}
                          onChange={(e) => setTransactionRef(e.target.value)}
                          placeholder="TRX-123456"
                          className="w-full px-2.5 py-1.5 text-xs border border-sand-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-ink-700 block mb-1">
                          Date
                        </label>
                        <input
                          type="date"
                          value={paymentDate}
                          onChange={(e) => setPaymentDate(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs border border-sand-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-ink-700 block mb-1">
                        Remarks / Notes
                      </label>
                      <input
                        type="text"
                        value={paymentNotes}
                        onChange={(e) => setPaymentNotes(e.target.value)}
                        placeholder="e.g. Combined transfer for Semester 1 + Intensive"
                        className="w-full px-2.5 py-1.5 text-xs border border-sand-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-ink-700 block mb-1">
                        Deposit Slip / Screenshot
                      </label>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept="image/*,.pdf"
                        className="hidden"
                      />
                      {proofAttachment ? (
                        <div className="p-2.5 bg-sand-100 rounded-xl border border-sand-300 flex items-center justify-between">
                          <div className="flex items-center gap-2 truncate">
                            <FileText size={16} className="text-primary-800 shrink-0" />
                            <div className="truncate">
                              <span className="font-semibold text-ink-900 block truncate">
                                {proofAttachment.name}
                              </span>
                              <span className="text-[10px] text-ink-500">{proofAttachment.size}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setProofAttachment(null)}
                            className="p-1 text-ink-400 hover:text-red-600 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="border border-dashed border-sand-300 hover:border-emerald-600/40 rounded-xl p-3 text-center cursor-pointer transition-colors bg-sand-50/50 hover:bg-emerald-50/20"
                        >
                          <UploadCloud size={18} className="mx-auto text-ink-400 mb-1" />
                          <span className="text-[11px] font-bold text-ink-700 block">
                            Attach Transfer Slip / Screenshot
                          </span>
                          <span className="text-[10px] text-ink-400">PNG, JPG, PDF up to 5MB</span>
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={!isMultiAllocationMatched}
                      className="w-full py-2.5 px-4 rounded-xl bg-[#0B3324] hover:bg-[#072419] text-white font-bold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed mt-1"
                    >
                      Confirm &amp; Record Combined Payment
                    </button>
                  </form>
                ) : isFullySettled ? (
                  /* SETTLED STATE GUARDRAIL */
                  <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl text-center space-y-3">
                    <div className="h-10 w-10 mx-auto rounded-full bg-primary-50 text-primary-900 border border-primary-200 flex items-center justify-center">
                      <CheckCircle2 size={22} />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-emerald-950">
                        Invoice Fully Settled
                      </h4>
                      <p className="text-[11px] text-primary-900 mt-0.5">
                        PKR {netPayable.toLocaleString()} received in full. All installments and fees are completely cleared.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onOpenOfficialReceipt(feeRecord)}
                      className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#0B3324] hover:bg-[#072419] text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                    >
                      <Download size={14} />
                      <span>Download Official Receipt (PDF)</span>
                    </button>
                  </div>
                ) : (
                  /* SINGLE INVOICE PAYMENT CAPTURE FORM */
                  <form onSubmit={handleRecordPaymentSubmit} className="space-y-3 text-xs">
                    {paymentError && (
                      <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-800 text-[11px] flex items-center gap-1.5">
                        <AlertCircle size={14} className="shrink-0 text-red-600" />
                        <span>{paymentError}</span>
                      </div>
                    )}

                    {paymentSuccessMsg && (
                      <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-primary-900 text-xs flex items-center gap-1.5 font-medium">
                        <CheckCircle2 size={14} className="text-emerald-600" />
                        <span>{paymentSuccessMsg}</span>
                      </div>
                    )}

                    {Array.isArray(feeRecord.installments) && feeRecord.installments.length > 0 && (
                      <div>
                        <label className="text-[11px] font-bold text-ink-700 block mb-1">
                          Apply Toward Installment
                        </label>
                        <select
                          value={selectedInstallmentId}
                          onChange={handleInstallmentSelectChange}
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-sand-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                        >
                          <option value="">General Balance / Lump-Sum Payment</option>
                          {feeRecord.installments.map((inst) => (
                            <option key={inst.id} value={inst.id}>
                              {inst.title} — PKR {inst.amount?.toLocaleString()} ({inst.status})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-bold text-ink-700 block">
                          Payment Amount (PKR) *
                        </label>
                        <span className="text-[10px] text-ink-500 ">
                          Max: PKR {remainingBalance.toLocaleString()}
                        </span>
                      </div>
                      <input
                        type="number"
                        required
                        min="1"
                        max={remainingBalance}
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs border border-sand-300 rounded-xl bg-white font-bold focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-ink-700 block mb-1">
                        Payment Channel / Method
                      </label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-sand-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                      >
                        <option value="Bank Transfer (Meezan Bank)">Bank Transfer (Meezan Bank)</option>
                        <option value="Raast Instant Transfer">Raast Instant Transfer</option>
                        <option value="HBL Online Banking">HBL Online Banking</option>
                        <option value="Cash at DHA Campus">Cash at DHA Lahore Campus</option>
                        <option value="Credit/Debit Card (Online)">Credit/Debit Card (Online)</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] font-bold text-ink-700 block mb-1">
                          TRX / Reference ID
                        </label>
                        <input
                          type="text"
                          value={transactionRef}
                          onChange={(e) => setTransactionRef(e.target.value)}
                          placeholder="TRX-123456"
                          className="w-full px-2.5 py-1.5 text-xs border border-sand-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-ink-700 block mb-1">
                          Date
                        </label>
                        <input
                          type="date"
                          value={paymentDate}
                          onChange={(e) => setPaymentDate(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs border border-sand-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-ink-700 block mb-1">
                        Remarks / Accounts Notes
                      </label>
                      <input
                        type="text"
                        value={paymentNotes}
                        onChange={(e) => setPaymentNotes(e.target.value)}
                        placeholder="e.g. Verified by campus accounts officer"
                        className="w-full px-2.5 py-1.5 text-xs border border-sand-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-ink-700 block mb-1">
                        Deposit Proof / Transfer Screenshot
                      </label>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept="image/*,.pdf"
                        className="hidden"
                      />
                      {proofAttachment ? (
                        <div className="p-2.5 bg-sand-100 rounded-xl border border-sand-300 flex items-center justify-between">
                          <div className="flex items-center gap-2 truncate">
                            <FileText size={16} className="text-primary-800 shrink-0" />
                            <div className="truncate">
                              <span className="font-semibold text-ink-900 block truncate">
                                {proofAttachment.name}
                              </span>
                              <span className="text-[10px] text-ink-500">{proofAttachment.size}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setProofAttachment(null)}
                            className="p-1 text-ink-400 hover:text-red-600 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="border border-dashed border-sand-300 hover:border-emerald-600/40 rounded-xl p-3 text-center cursor-pointer transition-colors bg-sand-50/50 hover:bg-emerald-50/20"
                        >
                          <UploadCloud size={18} className="mx-auto text-ink-400 mb-1" />
                          <span className="text-[11px] font-bold text-ink-700 block">
                            Attach Transfer Slip / Screenshot
                          </span>
                          <span className="text-[10px] text-ink-400">PNG, JPG, PDF up to 5MB</span>
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 px-4 rounded-xl bg-[#0B3324] hover:bg-[#072419] text-white font-bold text-xs shadow-sm transition-all cursor-pointer mt-1"
                    >
                      Confirm &amp; Record Payment
                    </button>
                  </form>
                )}
              </div>

              {/* -------------------------------------------------- */}
              {/* CARD 2: PAYMENT LEDGER & AUDIT TRAIL               */}
              {/* -------------------------------------------------- */}
              <div className="bg-white rounded-2xl p-5 border border-[#EFECE6] shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Clock size={15} className="text-ink-600" />
                    <h3 className="font-bold text-xs text-ink-900 uppercase tracking-wider">
                      Payment Ledger &amp; Audit Trail
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-ink-500 bg-sand-100 px-2 py-0.5 rounded-full">
                    {(feeRecord.paymentHistory || []).length} Records
                  </span>
                </div>

                {Array.isArray(feeRecord.paymentHistory) && feeRecord.paymentHistory.length > 0 ? (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {feeRecord.paymentHistory.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="p-3 bg-sand-50/70 border border-[#EFECE6] rounded-xl text-xs space-y-1 hover:border-sand-300 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-ink-900 text-[11px]">
                            {item.transactionRef || `TRX-${idx + 1}`}
                          </span>
                          <span className="font-bold text-primary-900 text-xs">
                            + PKR {Number(item.amount)?.toLocaleString()}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-ink-500">
                          <span>{item.method || 'Bank Transfer'}</span>
                          <span className="">{item.date}</span>
                        </div>

                        {item.notes && (
                          <div className="text-[10px] text-ink-600 italic bg-white/60 p-1 rounded border border-sand-200/50">
                            &ldquo;{item.notes}&rdquo;
                          </div>
                        )}

                        <div className="pt-1.5 flex items-center justify-between border-t border-sand-200/60 mt-1">
                          <button
                            type="button"
                            onClick={() => onOpenOfficialReceipt(feeRecord)}
                            className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary-800 hover:text-primary-950 cursor-pointer"
                          >
                            <Receipt size={11} />
                            <span>Voucher Receipt</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (
                                window.confirm(
                                  `Are you sure you want to void payment ${item.transactionRef || ''} of PKR ${Number(
                                    item.amount
                                  )?.toLocaleString()}? This will safely re-open the outstanding balance.`
                                )
                              ) {
                                onVoidPayment(feeRecord.id, item.id);
                              }
                            }}
                            className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-600 hover:text-red-800 cursor-pointer"
                            title="Void / reverse this payment entry"
                          >
                            <Trash2 size={11} />
                            <span>Void Entry</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-ink-400 border border-dashed border-sand-200 rounded-xl">
                    No payment transactions recorded for this invoice yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
