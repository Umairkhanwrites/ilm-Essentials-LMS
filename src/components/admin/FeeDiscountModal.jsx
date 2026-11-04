import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Percent,
  Tag,
  DollarSign,
  ShieldAlert,
  CheckCircle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

const DISCOUNT_CATEGORIES = [
  'Need-Based Financial Aid',
  'Academic Merit Scholarship',
  'Sibling & Family Enrolment',
  'Early Cohort Enrollee',
  'Faculty / Ustadh Discretionary Scholarship',
  'Special Hardship Grant',
  'Other / Custom Reason',
];

export default function FeeDiscountModal({ feeRecord, isOpen, onClose, onSave }) {
  if (!isOpen || !feeRecord) return null;

  const baseFee = Number(feeRecord.baseFee) || Number(feeRecord.totalAmount) || 30000;

  const [discountType, setDiscountType] = useState(feeRecord.discountType || 'fixed');
  const [discountValue, setDiscountValue] = useState(
    feeRecord.discountValue ? String(feeRecord.discountValue) : '5000'
  );
  const [discountCategory, setDiscountCategory] = useState(
    feeRecord.discountReason || 'Need-Based Financial Aid'
  );
  const [customReason, setCustomReason] = useState('');
  const [approvedBy, setApprovedBy] = useState(
    feeRecord.discountApprovedBy || 'Faculty Administration'
  );
  const [error, setError] = useState('');

  // Live calculation of discount amount and net payable
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

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (discountType !== 'none' && discountType !== 'waiver') {
      const num = Number(discountValue);
      if (isNaN(num) || num <= 0) {
        setError('Please enter a valid positive discount value.');
        return;
      }
      if (discountType === 'percentage' && num > 100) {
        setError('Percentage discount cannot exceed 100%.');
        return;
      }
    }

    const finalReason =
      discountCategory === 'Other / Custom Reason'
        ? customReason.trim() || 'Administrative concession'
        : discountCategory;

    onSave(feeRecord.id, {
      discountType,
      discountValue: discountType === 'waiver' ? 100 : discountType === 'none' ? 0 : Number(discountValue),
      discountReason: discountType === 'none' ? '' : finalReason,
      approvedBy,
    });
  };

  return (
    <div className="fixed inset-0 bg-primary-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-sand-300 overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-primary-950 text-white flex items-center justify-between border-b border-primary-900">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gold-500/20 flex items-center justify-center text-gold-400">
              <Tag size={17} />
            </div>
            <div>
              <h3 className="font-heading font-bold text-sm text-white">
                Apply Tuition Discount / Scholarship
              </h3>
              <p className="text-[11px] text-primary-200">
                {feeRecord.studentName} &bull; {feeRecord.program}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-primary-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2">
              <ShieldAlert size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Student & Base Fee Summary Box */}
          <div className="p-3.5 bg-sand-50 rounded-xl border border-sand-200 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-ink-400 block tracking-wider">
                Base Semester / Course Tuition
              </span>
              <span className="text-base font-bold font-mono text-ink-900">
                PKR {baseFee.toLocaleString()}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-ink-400 block tracking-wider">
                Invoice No
              </span>
              <span className="text-xs font-mono font-semibold text-primary-800">
                {feeRecord.invoiceNo}
              </span>
            </div>
          </div>

          {/* Discount Mode Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-700">
              Discount Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'fixed', label: 'Fixed PKR Off', desc: 'e.g. PKR 5,000 off' },
                { id: 'percentage', label: 'Percentage (%)', desc: 'e.g. 20% concession' },
                { id: 'waiver', label: 'Full Scholarship (100%)', desc: '100% complete waiver' },
                { id: 'none', label: 'Standard (No Discount)', desc: 'Full standard tuition' },
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setDiscountType(opt.id)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    discountType === opt.id
                      ? 'border-primary-900 bg-primary-50/70 ring-2 ring-primary-500/20'
                      : 'border-sand-200 bg-white hover:bg-sand-50/70'
                  }`}
                >
                  <div className="font-bold text-xs text-ink-900">{opt.label}</div>
                  <div className="text-[10px] text-ink-500 mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Value Input (for fixed or percentage) */}
          {discountType !== 'none' && discountType !== 'waiver' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                {discountType === 'fixed' ? 'Discount Amount (PKR) *' : 'Discount Percentage (%) *'}
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-ink-500">
                  {discountType === 'fixed' ? 'PKR' : '%'}
                </span>
                <input
                  type="number"
                  min="1"
                  max={discountType === 'percentage' ? 100 : baseFee}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  placeholder={discountType === 'fixed' ? '5000' : '20'}
                  className="w-full pl-12 pr-4 py-2.5 text-xs font-semibold border border-sand-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  required
                />
              </div>
            </div>
          )}

          {/* Reason / Category */}
          {discountType !== 'none' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                  Scholarship / Discount Category
                </label>
                <select
                  value={discountCategory}
                  onChange={(e) => setDiscountCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-sand-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 bg-white"
                >
                  {DISCOUNT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {discountCategory === 'Other / Custom Reason' && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                    Specific Reason / Notes
                  </label>
                  <input
                    type="text"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Enter justification or committee reference..."
                    className="w-full px-3.5 py-2 text-xs border border-sand-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                  Approved By
                </label>
                <input
                  type="text"
                  value={approvedBy}
                  onChange={(e) => setApprovedBy(e.target.value)}
                  placeholder="e.g. Dean of Academics / Ustadh Approval"
                  className="w-full px-3.5 py-2 text-xs border border-sand-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
              </div>
            </div>
          )}

          {/* Live Calculation Result Card */}
          <div className="p-4 rounded-xl bg-primary-50/60 border border-primary-200/80 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-ink-600">
              <span>Standard Base Fee:</span>
              <span className="font-mono font-semibold">PKR {baseFee.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-emerald-800 font-semibold">
              <span>Scholarship / Discount Applied:</span>
              <span className="font-mono">- PKR {calculatedDiscount.toLocaleString()}</span>
            </div>
            <div className="pt-2 border-t border-primary-200/60 flex items-center justify-between text-sm">
              <span className="font-bold text-primary-950">Net Payable Tuition:</span>
              <span className="font-mono font-black text-primary-900 text-base">
                PKR {netPayable.toLocaleString()}
              </span>
            </div>
            {Array.isArray(feeRecord.installments) && feeRecord.installments.length > 0 && (
              <p className="text-[10px] text-ink-500 pt-1 italic">
                Note: Active installment schedule will automatically re-divide across this net payable amount.
              </p>
            )}
          </div>

          {/* Modal Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-sand-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-ink-600 hover:bg-sand-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-primary-900 hover:bg-primary-800 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              Save Discount
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
