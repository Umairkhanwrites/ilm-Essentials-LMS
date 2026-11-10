/**
 * StudentAccounts — Fee Accounts & Installment Ledger for Enrolled Students
 *
 * Provides:
 * 1. Global video restriction banner with auto-unlock guidance
 * 2. Financial summary cards: Total Fee, Paid (Received), Payable (Receivable)
 * 3. Chronological Installments ledger with dynamic status badges
 * 4. Payment proof upload modal with image preview and Base64 persistence
 * 5. Admin rejection reason displays with 1-click re-upload flow
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard,
  CheckCircle,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  UploadCloud,
  FileText,
  Lock,
  Unlock,
  Building,
  Copy,
  Check,
  Eye,
  Calendar,
  ArrowRight,
  Sparkles,
  Info,
} from 'lucide-react';
import clsx from 'clsx';
import Layout from '../components/layout/Layout';
import { useAuth } from '../context/AuthContext';
import {
  getStudentInstallments,
  getStudentAccountsSummary,
  uploadInstallmentReceipt,
} from '../services/courseStorage';

export default function StudentAccounts() {
  const { user } = useAuth();
  const [installments, setInstallments] = useState(() => getStudentInstallments(user?.id));
  const [summary, setSummary] = useState(() => getStudentAccountsSummary(user?.id));

  // Modals & Upload State
  const [activeUploadInst, setActiveUploadInst] = useState(null);
  const [previewReceiptUrl, setPreviewReceiptUrl] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [copiedField, setCopiedField] = useState(null);
  const fileInputRef = useRef(null);

  // Synchronize installments and financial ledger
  const refreshAccounts = () => {
    setInstallments(getStudentInstallments(user?.id));
    setSummary(getStudentAccountsSummary(user?.id));
  };

  useEffect(() => {
    refreshAccounts();

    window.addEventListener('ilm-installments-updated', refreshAccounts);
    window.addEventListener('ilm-video-restriction-updated', refreshAccounts);
    window.addEventListener('storage', refreshAccounts);

    return () => {
      window.removeEventListener('ilm-installments-updated', refreshAccounts);
      window.removeEventListener('ilm-video-restriction-updated', refreshAccounts);
      window.removeEventListener('storage', refreshAccounts);
    };
  }, [user?.id]);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Format date utility
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  // Copy bank details
  const handleCopy = (field, text) => {
    navigator.clipboard?.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Handle file selection and generate preview
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    setUploadError('');
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size exceeds 5 MB. Please select a smaller screenshot.');
      return;
    }

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      setPreviewImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Submit payment proof
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!activeUploadInst || !previewImage) {
      setUploadError('Please select or capture a payment receipt screenshot.');
      return;
    }

    setIsSubmitting(true);
    setUploadError('');

    try {
      uploadInstallmentReceipt(activeUploadInst.id, previewImage);
      setIsSubmitting(false);
      setActiveUploadInst(null);
      setSelectedFile(null);
      setPreviewImage(null);
      refreshAccounts();
    } catch (err) {
      setIsSubmitting(false);
      setUploadError(err.message || 'Failed to submit payment proof.');
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-fadeIn">
        {/* Top Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-ink-900">
            My Fee Schedule
          </h1>
        </div>

        {/* Global Video Access Restriction Alert Banner */}
        {summary.isVideoRestricted && (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-red-950 via-[#180707] to-red-950 text-white border border-red-500/50 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-red-900/80 border border-red-500/60 flex items-center justify-center shrink-0 text-red-300 shadow-sm">
                  <Lock size={22} className="animate-pulse" />
                </div>
                <div className="space-y-0.5">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-red-300 uppercase tracking-wider">
                    <AlertTriangle size={13} />
                    <span>Course Video Access Restricted</span>
                  </div>
                  <h3 className="text-base font-heading font-bold text-white">
                    Lecture Video Access Blocked
                  </h3>
                  <p className="text-xs text-sand-300 max-w-2xl leading-relaxed">
                    Your lecture video access is currently restricted due to overdue fee installments. Please upload your payment receipt below to restore access.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Installments Challan Table */}
        <div className="bg-white rounded-2xl border border-sand-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[920px]">
              <thead>
                <tr className="bg-[#0B3324] text-white text-xs font-heading font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4 border-r border-white/20 whitespace-nowrap">Challan No.</th>
                  <th className="py-3.5 px-4 border-r border-white/20 whitespace-nowrap">Challan Type</th>
                  <th className="py-3.5 px-3.5 border-r border-white/20 text-right whitespace-nowrap">Payable</th>
                  <th className="py-3.5 px-3.5 border-r border-white/20 text-right whitespace-nowrap">Paid</th>
                  <th className="py-3.5 px-3.5 border-r border-white/20 text-right whitespace-nowrap">Balance</th>
                  <th className="py-3.5 px-4 border-r border-white/20 whitespace-nowrap">Date</th>
                  <th className="py-3.5 px-3.5 border-r border-white/20 whitespace-nowrap">Payment Mode</th>
                  <th className="py-3.5 px-3.5 border-r border-white/20 text-center whitespace-nowrap">Cancelled</th>
                  <th className="py-3.5 px-4 text-center whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-200 text-xs">
                {installments.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-ink-500">
                      <CreditCard size={32} className="mx-auto text-sand-400 mb-2" />
                      <p className="font-semibold text-ink-800">No installments assigned yet</p>
                      <p className="text-xs text-ink-500 mt-1">Your program fee schedule will be posted here by Accounts.</p>
                    </td>
                  </tr>
                ) : (
                  installments.map((inst) => {
                    const isOverdue = inst.status !== 'APPROVED' && inst.dueDate < todayStr;
                    const isPaid = inst.status === 'APPROVED';
                    const paidAmt = isPaid ? inst.amount : 0;
                    const balanceAmt = isPaid ? 0 : inst.amount;

                    return (
                      <React.Fragment key={inst.id}>
                        <tr className="hover:bg-sand-50/50 transition-colors border-b border-sand-100 last:border-b-0">
                          {/* 1. Challan No. */}
                          <td className="py-4 px-4 font-bold text-xs text-ink-900 whitespace-nowrap border-r border-sand-100">
                            {inst.challanNo || '23528335'}
                          </td>

                          {/* 2. Challan Type */}
                          <td className="py-4 px-4 text-ink-900 border-r border-sand-100">
                            <span className="font-bold text-xs sm:text-sm block leading-snug">{inst.title}</span>
                            <span className="text-[11px] text-ink-400 font-normal">
                              {inst.program || 'Ilm Foundations'}
                            </span>
                          </td>

                          {/* 3. Payable */}
                          <td className="py-4 px-3.5 text-right font-bold text-xs sm:text-sm text-ink-900 whitespace-nowrap border-r border-sand-100">
                            {inst.amount.toLocaleString()}
                          </td>

                          {/* 4. Paid */}
                          <td className="py-4 px-3.5 text-right whitespace-nowrap border-r border-sand-100">
                            {isPaid ? (
                              <span className="font-bold text-xs sm:text-sm text-emerald-700">
                                {paidAmt.toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-xs text-ink-400">0</span>
                            )}
                          </td>

                          {/* 5. Balance */}
                          <td className="py-4 px-3.5 text-right font-bold text-xs sm:text-sm whitespace-nowrap border-r border-sand-100">
                            {isPaid ? (
                              <span className="text-ink-400 font-normal">0</span>
                            ) : (
                              <span className={clsx(isOverdue ? 'text-red-600 font-bold' : 'text-ink-900')}>
                                {balanceAmt.toLocaleString()}
                              </span>
                            )}
                          </td>

                          {/* 6. Date (Stacked) */}
                          <td className="py-4 px-4 whitespace-nowrap text-xs border-r border-sand-100">
                            <div className="space-y-0.5">
                              <div className="text-ink-600 text-[11px]">
                                <span>Due Date: </span>
                                <strong className={clsx(isOverdue ? 'text-red-600 font-bold' : 'text-ink-800')}>
                                  {formatDate(inst.dueDate)}
                                </strong>
                              </div>
                              {isPaid && (
                                <div className="text-emerald-700 font-medium text-[11px]">
                                  <span>Paid Date: </span>
                                  <strong>{formatDate(inst.paidDate || inst.approvedAt)}</strong>
                                </div>
                              )}
                              {inst.status === 'UNDER_REVIEW' && inst.submittedAt && (
                                <div className="text-amber-800 font-medium text-[11px]">
                                  <span>Uploaded: </span>
                                  <span>{formatDate(inst.submittedAt)}</span>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* 7. Payment Mode */}
                          <td className="py-4 px-3.5 whitespace-nowrap text-xs text-ink-700 border-r border-sand-100">
                            {inst.paymentMode || (isPaid ? 'Meezan Online' : '—')}
                          </td>

                          {/* 8. Cancelled */}
                          <td className="py-4 px-3.5 text-center whitespace-nowrap text-xs text-ink-400 border-r border-sand-100">
                            {inst.status === 'CANCELLED' ? (
                              <span className="text-red-600 font-bold">Yes</span>
                            ) : (
                              <span></span>
                            )}
                          </td>

                          {/* 9. Action */}
                          <td className="py-4 px-4 text-center whitespace-nowrap">
                            {isPaid && (
                              <div className="inline-flex items-center gap-2">
                                <span className="inline-block px-2.5 py-0.5 rounded border border-emerald-800 text-emerald-800 font-extrabold text-[11px] tracking-wider uppercase bg-emerald-50/50">
                                  PAID
                                </span>
                                {inst.receiptImageUrl && (
                                  <button
                                    type="button"
                                    onClick={() => setPreviewReceiptUrl(inst.receiptImageUrl)}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold text-ink-600 hover:text-ink-900 hover:bg-sand-100 border border-sand-200 transition-colors cursor-pointer"
                                    title="View receipt proof"
                                  >
                                    <Eye size={11} />
                                    <span>Receipt</span>
                                  </button>
                                )}
                              </div>
                            )}

                            {inst.status === 'UNDER_REVIEW' && (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                <span>Verification Pending</span>
                              </div>
                            )}

                            {inst.status === 'REJECTED' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveUploadInst(inst);
                                  setSelectedFile(null);
                                  setPreviewImage(null);
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                              >
                                <UploadCloud size={13} />
                                <span>Re-upload</span>
                              </button>
                            )}

                            {inst.status === 'UNPAID' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveUploadInst(inst);
                                  setSelectedFile(null);
                                  setPreviewImage(null);
                                }}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0B3324] hover:bg-[#072419] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                              >
                                <UploadCloud size={13} />
                                <span>Upload Receipt</span>
                              </button>
                            )}
                          </td>
                        </tr>

                        {/* Rejection Alert Row (if rejected) */}
                        {inst.status === 'REJECTED' && inst.rejectionReason && (
                          <tr className="bg-red-50/60">
                            <td colSpan={9} className="px-4 sm:px-6 py-2.5 border-b border-red-200">
                              <div className="flex items-start gap-2 text-xs text-red-900">
                                <AlertTriangle size={14} className="text-red-600 shrink-0 mt-0.5" />
                                <div>
                                  <span className="font-bold">Accounts Officer Reason: </span>
                                  <span>{inst.rejectionReason}</span>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer: Total Payable Amount (Clean Minimal Brand Styling) */}
          <div className="px-6 py-4.5 bg-sand-50/40 border-t border-sand-200 flex items-center justify-between">
            <p className="text-sm sm:text-base font-heading text-ink-900">
              <span className="font-bold text-ink-900">Total Payable Amount:</span>{' '}
              <span className="font-bold text-[#0B3324] text-base sm:text-lg">
                Rs {summary.receivableAmount.toLocaleString()}
              </span>
            </p>
          </div>
        </div>

        {/* Bank Transfer Details — Modern Institutional Card */}
        <div className="bg-white rounded-2xl border border-sand-200 shadow-2xs overflow-hidden">
          {/* Subtle Top Bar */}
          <div className="px-5 py-3 bg-sand-50/70 border-b border-sand-200/80 flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#0B3324]/10 text-[#0B3324] flex items-center justify-center font-bold">
              <Building size={14} />
            </div>
            <span className="font-heading font-bold text-xs uppercase tracking-wider text-ink-900">
              Official Bank Transfer Details
            </span>
          </div>

          {/* Account Fields Grid */}
          <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 divide-y sm:divide-y-0 lg:divide-x divide-sand-200/60">
            <div className="pt-2 sm:pt-0 lg:col-span-2 lg:pr-3 first:pl-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-400 block mb-1">
                Bank Name
              </span>
              <span className="font-heading font-bold text-sm text-ink-900 block">
                Meezan Bank Ltd.
              </span>
            </div>

            <div className="pt-3 sm:pt-0 lg:col-span-4 lg:px-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-400 block mb-1">
                Account Title
              </span>
              <span className="font-heading font-bold text-sm text-ink-900 block whitespace-normal">
                Ilm Essentials Educational Services
              </span>
            </div>

            <div className="pt-3 sm:pt-0 lg:col-span-3 lg:px-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-400 block mb-1">
                Account Number
              </span>
              <span className="font-heading font-bold text-sm text-ink-900 block">
                01020304050607
              </span>
            </div>

            <div className="pt-3 sm:pt-0 lg:col-span-3 lg:pl-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-400 block mb-1">
                IBAN
              </span>
              <span className="font-heading font-bold text-sm text-ink-900 block">
                PK92MEZN0001020304050607
              </span>
            </div>
          </div>
        </div>

        {/* Upload Receipt Modal */}
        <AnimatePresence>
          {activeUploadInst && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/60 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl border border-sand-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
              >
                {/* Modal Header */}
                <div className="p-5 border-b border-sand-200 flex items-center justify-between bg-sand-50/60">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-primary-100 text-primary-900 flex items-center justify-center">
                      <UploadCloud size={18} />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-base text-ink-900">
                        Upload Receipt
                      </h3>
                      <p className="text-xs text-ink-500">
                        {activeUploadInst.title}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveUploadInst(null)}
                    className="text-ink-400 hover:text-ink-700 p-1.5 rounded-lg hover:bg-sand-100 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {/* Modal Body */}
                <form onSubmit={handleUploadSubmit} className="p-5 space-y-4 overflow-y-auto">
                  {/* Amount notice */}
                  <div className="p-3 bg-sand-50 rounded-xl border border-sand-200 flex items-center justify-between text-xs">
                    <span className="text-ink-600">Fixed Installment Amount:</span>
                    <span className="font-bold font-mono text-ink-900 text-sm">
                      PKR {activeUploadInst.amount.toLocaleString()}
                    </span>
                  </div>

                  {uploadError && (
                    <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-medium flex items-center gap-2">
                      <AlertTriangle size={14} className="shrink-0" />
                      <span>{uploadError}</span>
                    </div>
                  )}

                  {/* File Upload Box */}
                  <div>
                    <label className="text-xs font-bold text-ink-800 block mb-1.5">
                      Bank Deposit Slip / Transfer Screenshot *
                    </label>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />

                    {previewImage ? (
                      <div className="space-y-3">
                        <div className="relative rounded-xl border border-sand-300 overflow-hidden bg-sand-100 max-h-60 flex items-center justify-center">
                          <img
                            src={previewImage}
                            alt="Receipt Preview"
                            className="w-full h-auto max-h-56 object-contain"
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-ink-500 truncate">{selectedFile?.name}</span>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="text-primary-800 hover:underline font-semibold cursor-pointer"
                          >
                            Change Photo
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-sand-300 hover:border-primary-600 rounded-xl p-8 text-center bg-sand-50/50 hover:bg-sand-50 transition-colors cursor-pointer"
                      >
                        <UploadCloud size={32} className="mx-auto text-primary-800 mb-2" />
                        <p className="text-xs font-bold text-ink-800">
                          Click to browse deposit receipt screenshot
                        </p>
                        <p className="text-[11px] text-ink-500 mt-1">
                          PNG, JPG, or WebP up to 5 MB
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Submission note */}
                  <div className="text-[11px] text-ink-500 bg-sand-50 p-2.5 rounded-lg border border-sand-200">
                    <p>
                      ⚠️ Please ensure the transaction reference ID, date, and amount (PKR {activeUploadInst.amount.toLocaleString()}) are clearly legible in the image.
                    </p>
                  </div>

                  {/* Buttons */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-sand-200">
                    <button
                      type="button"
                      onClick={() => setActiveUploadInst(null)}
                      className="px-4 py-2 text-xs font-semibold text-ink-700 hover:bg-sand-100 rounded-xl transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !previewImage}
                      className={clsx(
                        'px-5 py-2 text-xs font-bold rounded-xl text-white transition-all shadow-xs flex items-center gap-1.5 cursor-pointer',
                        isSubmitting || !previewImage
                          ? 'bg-sand-400 cursor-not-allowed'
                          : 'bg-[#0B3324] hover:bg-[#072318]'
                      )}
                    >
                      {isSubmitting ? (
                        <>
                          <Clock size={13} className="animate-spin" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <UploadCloud size={13} />
                          <span>Submit for Verification</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* View Receipt Image Modal */}
        <AnimatePresence>
          {previewReceiptUrl && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/70 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl border border-sand-200 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col"
              >
                <div className="p-4 border-b border-sand-200 flex items-center justify-between bg-sand-50/60">
                  <h4 className="font-heading font-bold text-sm text-ink-900">
                    Uploaded Payment Receipt Preview
                  </h4>
                  <button
                    type="button"
                    onClick={() => setPreviewReceiptUrl(null)}
                    className="text-ink-500 hover:text-ink-800 p-1 rounded-lg cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
                <div className="p-4 bg-sand-100/60 flex items-center justify-center max-h-[70vh] overflow-auto">
                  <img
                    src={previewReceiptUrl}
                    alt="Payment Proof"
                    className="max-h-[65vh] w-auto rounded-lg object-contain shadow-xs border border-sand-200"
                  />
                </div>
                <div className="p-3 bg-white border-t border-sand-200 text-right">
                  <button
                    type="button"
                    onClick={() => setPreviewReceiptUrl(null)}
                    className="px-4 py-1.5 rounded-lg bg-sand-100 hover:bg-sand-200 text-ink-800 text-xs font-semibold cursor-pointer"
                  >
                    Close Preview
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
