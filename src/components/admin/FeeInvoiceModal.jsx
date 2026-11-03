/**
 * FeeInvoiceModal — Official Printable Tuition Fee Invoice & Receipt
 *
 * Provides a formal institutional receipt and printable voucher
 * for student tuition payments with official verification stamp.
 */

import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Printer,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Building,
  Mail,
  Phone,
  FileText,
} from 'lucide-react';
import logoColor from '../../assets/logo.png';

export default function FeeInvoiceModal({ feeRecord, onClose }) {
  const printRef = useRef(null);

  if (!feeRecord) return null;

  const handlePrint = () => {
    window.print();
  };

  const isPaid = feeRecord.status === 'Paid' || feeRecord.status === 'Waived';
  const isPartial = feeRecord.status === 'Partial';
  const isPending = feeRecord.status === 'Pending';
  const isOverdue = feeRecord.status === 'Overdue';

  return (
    <div className="fixed inset-0 bg-primary-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto print:p-0 print:bg-white animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-sand-200 overflow-hidden flex flex-col my-auto print:border-none print:shadow-none print:max-w-none">
        {/* Top Control Bar (Hidden when printing) */}
        <div className="px-6 py-4 bg-sand-100/80 border-b border-sand-200 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-primary-100 text-primary-900">
              <FileText size={16} />
            </span>
            <div>
              <h3 className="text-sm font-bold text-ink-900">
                Official Tuition Fee Receipt
              </h3>
              <p className="text-[11px] text-ink-500 font-mono">
                {feeRecord.invoiceNo}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-900 hover:bg-primary-800 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <Printer size={13} />
              Print / Save PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-ink-400 hover:text-ink-700 hover:bg-sand-200/60 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Voucher Body */}
        <div ref={printRef} className="p-8 sm:p-10 space-y-8 bg-white text-ink-900 print:p-8">
          {/* Institution Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b-2 border-primary-900/20 pb-6">
            <div className="space-y-2">
              <img
                src={logoColor}
                alt="Ilm Essentials"
                className="h-9 w-auto object-contain"
              />
              <p className="text-xs text-ink-600 font-medium max-w-xs leading-relaxed">
                Classical Islamic Sciences &amp; Leadership Curriculum
              </p>
              <div className="text-[11px] text-ink-500 space-y-0.5 pt-1">
                <div className="flex items-center gap-1.5">
                  <Building size={12} className="text-primary-700" />
                  <span>DHA Phase 6 Campus, Lahore, Pakistan</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Mail size={12} className="text-primary-700" />
                  <span>admissions@ilmessentials.pk • accounts@ilmessentials.pk</span>
                </div>
              </div>
            </div>

            <div className="text-left sm:text-right space-y-1">
              <span className="text-[11px] uppercase tracking-wider font-bold text-primary-800 block">
                TUITION INVOICE &amp; RECEIPT
              </span>
              <h2 className="text-xl font-heading font-black text-ink-900 font-mono">
                {feeRecord.invoiceNo}
              </h2>
              <div className="text-xs text-ink-600">
                Date Issued:{' '}
                <strong className="text-ink-800">{feeRecord.paidDate || feeRecord.dueDate}</strong>
              </div>
              <div className="text-xs text-ink-600">
                Due Date: <strong className="text-ink-800">{feeRecord.dueDate}</strong>
              </div>
            </div>
          </div>

          {/* Student & Program Info Box */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-sand-50 border border-sand-200 text-xs">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-400 block">
                BILLED TO STUDENT
              </span>
              <div className="text-sm font-bold text-ink-900">{feeRecord.studentName}</div>
              <div className="text-ink-600">{feeRecord.studentEmail}</div>
              <div className="text-ink-500 font-mono text-[11px]">
                Student ID: {feeRecord.studentId || 'STD-2026-REG'}
              </div>
            </div>

            <div className="space-y-1 sm:text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-400 block">
                ENROLLED ACADEMIC PROGRAM
              </span>
              <div className="text-sm font-bold text-primary-900">{feeRecord.program}</div>
              <div className="text-ink-600">Academic Year: 2026 – 2027</div>
              <div className="text-ink-500 text-[11px]">Campus: DHA Phase 6 / Live Online</div>
            </div>
          </div>

          {/* Fee Itemization Table */}
          <div className="border border-sand-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-sand-100 text-ink-700 font-bold uppercase tracking-wider border-b border-sand-200">
                <tr>
                  <th className="py-3 px-4">Description / Curriculum Track</th>
                  <th className="py-3 px-4 text-center">Semester</th>
                  <th className="py-3 px-4 text-right">Tuition Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-100">
                <tr>
                  <td className="py-4 px-4">
                    <div className="font-bold text-ink-900">{feeRecord.program}</div>
                    <div className="text-[11px] text-ink-500 mt-0.5">
                      Full classical curriculum, lecture recordings, faculty Q&amp;A, and campus facility access.
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center text-ink-700 font-medium">
                    Semester 1
                  </td>
                  <td className="py-4 px-4 text-right font-mono font-bold text-ink-900 text-sm">
                    PKR {feeRecord.totalAmount?.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Totals & Official Stamp */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-2">
            {/* Status Stamp */}
            <div className="flex items-center gap-3">
              <div
                className={`w-28 h-28 rounded-full border-4 flex flex-col items-center justify-center text-center p-2 transform -rotate-12 select-none ${
                  isPaid
                    ? 'border-emerald-600 text-emerald-700 bg-emerald-50/40'
                    : isPartial
                    ? 'border-amber-600 text-amber-700 bg-amber-50/40'
                    : 'border-red-600 text-red-700 bg-red-50/40'
                }`}
              >
                <span className="text-[9px] font-black uppercase tracking-widest block">
                  ILM ESSENTIALS
                </span>
                <span className="text-base font-black uppercase tracking-wider block">
                  {isPaid ? 'PAID' : isPartial ? 'PARTIAL' : isOverdue ? 'OVERDUE' : 'PENDING'}
                </span>
                <span className="text-[8px] font-mono font-bold block">
                  {feeRecord.paidDate || feeRecord.dueDate}
                </span>
              </div>

              <div className="text-xs space-y-1">
                <div className="font-bold text-ink-800 flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-primary-700" />
                  Accounts Office Verified
                </div>
                <div className="text-[11px] text-ink-500">
                  Method: <strong className="text-ink-700">{feeRecord.paymentMethod || 'Bank Transfer'}</strong>
                </div>
                <div className="text-[11px] text-ink-500 font-mono">
                  Ref: {feeRecord.transactionRef || 'N/A'}
                </div>
              </div>
            </div>

            {/* Calculations Box */}
            <div className="w-full sm:w-64 space-y-2 text-xs">
              <div className="flex justify-between text-ink-600">
                <span>Total Billed Tuition:</span>
                <span className="font-mono font-semibold">
                  PKR {feeRecord.totalAmount?.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-emerald-800 font-bold">
                <span>Amount Paid:</span>
                <span className="font-mono">
                  PKR {feeRecord.paidAmount?.toLocaleString()}
                </span>
              </div>
              <div className="h-px bg-sand-200" />
              <div className="flex justify-between text-ink-900 text-sm font-black">
                <span>Balance Due:</span>
                <span className={`font-mono ${feeRecord.balance > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                  PKR {feeRecord.balance?.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Notes & Footer */}
          {feeRecord.notes && (
            <div className="p-3 rounded-lg bg-sand-50 border border-sand-200 text-xs text-ink-600">
              <strong className="text-ink-800">Accounts Remarks:</strong> {feeRecord.notes}
            </div>
          )}

          <div className="border-t border-sand-200 pt-6 flex flex-col sm:flex-row items-center justify-between text-[10px] text-ink-400 gap-2">
            <span>This is a computer-generated voucher issued by Ilm Essentials LMS Accounts Department.</span>
            <span>www.ilmessentials.pk</span>
          </div>
        </div>

        {/* Footer Actions (Hidden when printing) */}
        <div className="px-6 py-4 bg-sand-50 border-t border-sand-200 flex items-center justify-end gap-3 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-ink-600 hover:text-ink-900 bg-sand-200/60 hover:bg-sand-200 rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-5 py-2 text-xs font-bold text-white bg-primary-900 hover:bg-primary-800 rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Printer size={13} />
            Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
}
