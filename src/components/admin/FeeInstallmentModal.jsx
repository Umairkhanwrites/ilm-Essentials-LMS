import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Calendar,
  Split,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock,
  Layers,
} from 'lucide-react';

export default function FeeInstallmentModal({ feeRecord, isOpen, onClose, onSave }) {
  if (!isOpen || !feeRecord) return null;

  const netPayable = Number(feeRecord.netPayable) || Number(feeRecord.totalAmount) || 30000;
  const existingInstallments = Array.isArray(feeRecord.installments) && feeRecord.installments.length > 0
    ? feeRecord.installments
    : [];

  const initialCount = existingInstallments.length > 1 ? existingInstallments.length : 2;
  const [installmentCount, setInstallmentCount] = useState(initialCount);
  const [installments, setInstallments] = useState([]);
  const [error, setError] = useState('');

  // Auto-generate installments whenever installmentCount changes or modal opens
  useEffect(() => {
    if (existingInstallments.length === installmentCount && existingInstallments.length > 0) {
      setInstallments(existingInstallments);
      return;
    }

    const count = Number(installmentCount);
    if (count <= 1) {
      setInstallments([]);
      return;
    }

    const basePart = Math.floor(netPayable / count);
    const remainder = netPayable - basePart * count;
    const today = new Date();
    let runningPaid = Number(feeRecord.paidAmount) || 0;

    const generated = Array.from({ length: count }, (_, idx) => {
      const partAmt = idx === count - 1 ? basePart + remainder : basePart;
      const dueDateObj = new Date(today.getTime() + idx * 30 * 24 * 60 * 60 * 1000);
      const isPaid = runningPaid >= partAmt;
      if (isPaid) {
        runningPaid -= partAmt;
      }

      const defaultTitle =
        idx === 0
          ? `Installment 1 of ${count} (Admission)`
          : idx === 1
          ? `Installment 2 of ${count} (Month 2)`
          : `Installment ${idx + 1} of ${count} (Month ${idx + 1})`;

      return {
        id: `inst_${idx + 1}_${Date.now()}`,
        installmentNumber: idx + 1,
        title: defaultTitle,
        amount: partAmt,
        dueDate: dueDateObj.toISOString().split('T')[0],
        status: isPaid ? 'Paid' : 'Pending',
        paidDate: isPaid ? feeRecord.paidDate || today.toISOString().split('T')[0] : null,
      };
    });

    setInstallments(generated);
  }, [installmentCount, netPayable, feeRecord.paidAmount]);

  const handleUpdateInstallment = (index, field, value) => {
    setInstallments((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (installmentCount > 1) {
      const totalAllocated = installments.reduce((sum, inst) => sum + (Number(inst.amount) || 0), 0);
      if (Math.abs(totalAllocated - netPayable) > 1) {
        setError(`Total installment sum (PKR ${totalAllocated.toLocaleString()}) must equal net payable (PKR ${netPayable.toLocaleString()}).`);
        return;
      }
    }

    onSave(feeRecord.id, {
      installmentCount: Number(installmentCount),
      paymentPlan: installmentCount > 1 ? `installments_${installmentCount}` : 'lump_sum',
      customInstallments: installmentCount > 1 ? installments : [],
    });
  };

  return (
    <div className="fixed inset-0 bg-primary-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-sand-300 overflow-hidden my-auto"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-primary-950 text-white flex items-center justify-between border-b border-primary-900">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Calendar size={17} />
            </div>
            <div>
              <h3 className="font-heading font-bold text-sm text-white">
                Semester Fee Installment Planner
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

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Fee Overview Card */}
          <div className="p-4 rounded-xl bg-sand-50 border border-sand-200 grid grid-cols-3 gap-2 text-center">
            <div>
              <span className="text-[10px] uppercase font-bold text-ink-400 block tracking-wider">
                Base Fee
              </span>
              <span className="text-xs font-mono font-semibold text-ink-700">
                PKR {(feeRecord.baseFee || netPayable).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-ink-400 block tracking-wider">
                Discount
              </span>
              <span className="text-xs font-mono font-semibold text-emerald-700">
                - PKR {(feeRecord.discountAmount || 0).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-primary-900 block tracking-wider">
                Net Payable
              </span>
              <span className="text-sm font-mono font-bold text-primary-950">
                PKR {netPayable.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Installment Plan Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-ink-700">
                Select Installment Schedule
              </label>
              <span className="text-[11px] text-ink-500">
                Available for Semester Cohorts
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { count: 1, label: 'Lump Sum', sub: '100% upfront' },
                { count: 2, label: '2 Parts', sub: '50% / 50%' },
                { count: 3, label: '3 Parts', sub: 'Monthly' },
                { count: 4, label: '4 Parts', sub: 'Quarterly' },
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.count}
                  onClick={() => setInstallmentCount(opt.count)}
                  className={`p-2.5 rounded-xl border text-center cursor-pointer transition-all ${
                    installmentCount === opt.count
                      ? 'border-primary-900 bg-primary-50/80 ring-2 ring-primary-500/20'
                      : 'border-sand-200 bg-white hover:bg-sand-50/70'
                  }`}
                >
                  <div className="font-bold text-xs text-ink-900">{opt.label}</div>
                  <div className="text-[10px] text-ink-500">{opt.sub}</div>
                </button>
              ))}
            </div>

            {/* Custom Installment Count Option (Supports 2, 3, 4, 5, 6, or custom number) */}
            <div className="pt-2 flex items-center justify-between bg-sand-50/80 p-3 rounded-xl border border-sand-200">
              <span className="text-xs font-bold text-ink-800">
                Installment Parts:
              </span>
              <div className="flex items-center gap-1.5">
                {[2, 3, 4, 5, 6].map((num) => (
                  <button
                    type="button"
                    key={num}
                    onClick={() => setInstallmentCount(num)}
                    className={`h-7 w-7 rounded-lg text-xs font-bold transition-all ${
                      installmentCount === num
                        ? 'bg-primary-900 text-white'
                        : 'bg-white border border-sand-300 text-ink-700 hover:bg-sand-100'
                    }`}
                  >
                    {num}
                  </button>
                ))}
                <div className="flex items-center gap-1 pl-1.5 border-l border-sand-300">
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={installmentCount}
                    onChange={(e) => {
                      const val = Math.max(1, Math.min(12, Number(e.target.value) || 1));
                      setInstallmentCount(val);
                    }}
                    className="w-12 h-7 px-1 text-center font-bold font-mono text-xs border border-sand-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                    title="Enter custom number of installments (up to 12)"
                  />
                  <span className="text-[10px] text-ink-500 font-medium">parts</span>
                </div>
              </div>
            </div>
          </div>

          {/* Schedule Breakdown */}
          {installmentCount > 1 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-ink-700 border-b border-sand-200 pb-1.5">
                <span>Installment Schedule Details</span>
                <span className="text-[11px] text-primary-800 lowercase font-normal">
                  (due dates &amp; amounts are editable)
                </span>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {installments.map((inst, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-white rounded-xl border border-sand-200 space-y-2 shadow-2xs hover:border-sand-300 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-ink-900 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-900 text-[10px] font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span>{inst.title}</span>
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          inst.status === 'Paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {inst.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-ink-500 mb-0.5">
                          Amount (PKR)
                        </label>
                        <input
                          type="number"
                          value={inst.amount}
                          onChange={(e) =>
                            handleUpdateInstallment(idx, 'amount', Number(e.target.value) || 0)
                          }
                          className="w-full px-2.5 py-1.5 text-xs font-semibold font-mono border border-sand-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-ink-500 mb-0.5">
                          Due Date
                        </label>
                        <input
                          type="date"
                          value={inst.dueDate}
                          onChange={(e) =>
                            handleUpdateInstallment(idx, 'dueDate', e.target.value)
                          }
                          className="w-full px-2.5 py-1.5 text-xs border border-sand-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-sand-50 text-center text-ink-600 border border-sand-200">
              <span className="block font-bold text-ink-900 mb-1">Single Upfront Payment</span>
              <span>Full semester net tuition of PKR {netPayable.toLocaleString()} is due at admission.</span>
            </div>
          )}

          {/* Actions */}
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
              Save Installment Plan
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
