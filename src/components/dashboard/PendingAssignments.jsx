import React, { useState } from 'react';
import {
  FileText,
  Clock,
  AlertCircle,
  CheckCircle2,
  UploadCloud,
  ChevronRight,
  ExternalLink,
  BookOpen,
  Award,
  X,
  FileCheck,
  Download,
} from 'lucide-react';

const INITIAL_ASSIGNMENTS = [
  {
    id: 'asg_001',
    title: "Surah Al-Baqarah Reflection Essay (Verses 142–152)",
    course: "Tafsīr-ul-Qur'ān",
    courseCode: "TAF-101",
    dueDate: "Tomorrow • Fri, Nov 6, 2026",
    dueTime: "11:59 PM PKT",
    isUrgent: true,
    weight: "15% of Final Grade",
    estTime: "45 mins",
    type: "Essay / Reflection",
    status: "Pending", // 'Pending', 'Submitted', 'Graded'
    instructions: "Write a 500-word critical reflection on the spiritual significance of the change of Qiblah (Surah Al-Baqarah 142-152) and its lessons for Muslim communal identity.",
    instructor: "Ustadh Khalil Ahmad",
  },
  {
    id: 'asg_002',
    title: "Arabic Nominal Sentences (Al-Jumla Al-Ismiyya) Worksheet",
    course: "Qur'ānic Arabic — Level 1",
    courseCode: "ARB-101",
    dueDate: "Sunday • Nov 8, 2026",
    dueTime: "11:59 PM PKT",
    isUrgent: false,
    weight: "10% of Final Grade",
    estTime: "30 mins",
    type: "Worksheet & Grammar Exercise",
    status: "Pending",
    instructions: "Complete exercises 1 through 15 identifying the Mubtada' and Khabar in the provided Qur'anic ayaat from Surah Al-Kahf.",
    instructor: "Dr. Mufti Bilal Patel",
  },
  {
    id: 'asg_003',
    title: "Fiqh of Tahārah & Salah Mid-Term Diagnostic Quiz",
    course: "Fiqh — Acts of Worship",
    courseCode: "FQH-201",
    dueDate: "Thursday • Nov 12, 2026",
    dueTime: "6:00 PM PKT",
    isUrgent: false,
    weight: "20% of Final Grade",
    estTime: "25 mins",
    type: "Timed Online Assessment",
    status: "Pending",
    instructions: "20 multiple choice questions covering prerequisites of Salah, nullifiers of Wudu, and rules of Tayammum.",
    instructor: "Shaykh Dr. Zubair Farooq",
  },
];

export default function PendingAssignments() {
  const [assignments, setAssignments] = useState(INITIAL_ASSIGNMENTS);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  const pendingCount = assignments.filter((a) => a.status === 'Pending').length;

  const handleOpenSubmission = (asg) => {
    setSelectedAssignment(asg);
    setUploadedFile(null);
    setSubmissionNotes('');
  };

  const handleFakeFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile({
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
      });
    }
  };

  const handleConfirmSubmit = (e) => {
    e.preventDefault();
    if (!selectedAssignment) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setAssignments((prev) =>
        prev.map((a) =>
          a.id === selectedAssignment.id
            ? { ...a, status: 'Submitted', submittedAt: 'Nov 5, 2026 at 2:30 AM' }
            : a
        )
      );
      setIsSubmitting(false);
      const title = selectedAssignment.title;
      setSelectedAssignment(null);
      setToastMessage(`Successfully submitted: "${title}"`);
      setTimeout(() => setToastMessage(null), 4000);
    }, 600);
  };

  return (
    <section id="pending-assignments" className="scroll-mt-24 space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-sand-200 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-ink-900 font-heading">
              Pending Assignments &amp; Deadlines
            </h2>
            <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold bg-[#0B3324] text-white rounded-full">
              {pendingCount} Active
            </span>
          </div>
          <p className="text-xs text-ink-500 mt-0.5">
            Current Academic Week &bull; Relative to Thursday, November 5, 2026
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-ink-600">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-200/60 rounded-lg">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Next Deadline: Tomorrow (Nov 6)
          </span>
        </div>
      </div>

      {/* Assignment Cards List */}
      <div className="grid grid-cols-1 gap-3.5">
        {assignments.map((item) => {
          const isSubmitted = item.status === 'Submitted';

          return (
            <div
              key={item.id}
              className={`p-4 rounded-2xl border transition-all ${
                isSubmitted
                  ? 'bg-sand-50/80 border-sand-300 shadow-2xs'
                  : item.isUrgent
                  ? 'bg-white border-amber-300 shadow-xs hover:border-amber-400'
                  : 'bg-white border-sand-200 shadow-2xs hover:border-[#0B3324]/30'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                {/* Left: Metadata & Title */}
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-bold text-[#0B3324] bg-sand-100 px-2 py-0.5 rounded border border-sand-200">
                      {item.course} &bull; {item.courseCode}
                    </span>
                    <span className="text-[11px] font-medium text-ink-500 bg-sand-50 px-2 py-0.5 rounded border border-sand-200">
                      {item.type}
                    </span>
                    <span className="text-[11px] font-semibold text-primary-900 bg-sand-100 px-2 py-0.5 rounded border border-sand-200">
                      {item.weight}
                    </span>
                  </div>

                  <h3 className="text-sm md:text-base font-bold text-ink-900 leading-snug">
                    {item.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-ink-600 pt-0.5">
                    <div className="flex items-center gap-1">
                      <Clock size={13} className={item.isUrgent ? 'text-amber-600' : 'text-ink-400'} />
                      <span className="font-medium">
                        Due: <strong className={item.isUrgent ? 'text-amber-800 font-bold' : 'text-ink-800'}>{item.dueDate}</strong> at {item.dueTime}
                      </span>
                    </div>
                    <span className="text-sand-300">&bull;</span>
                    <div className="text-ink-500">
                      Est. Time: <span className="font-medium text-ink-700">{item.estTime}</span>
                    </div>
                    <span className="text-sand-300">&bull;</span>
                    <div className="text-ink-500">
                      Instructor: <span className="font-medium text-ink-700">{item.instructor}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Status Pill & Action CTA */}
                <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center">
                  {isSubmitted ? (
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-300">
                        <CheckCircle2 size={14} className="text-emerald-700" />
                        Submitted
                      </span>
                      <button
                        type="button"
                        onClick={() => handleOpenSubmission(item)}
                        className="text-xs text-ink-600 hover:text-ink-900 px-2 py-1 font-medium underline"
                      >
                        View Receipt
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleOpenSubmission(item)}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
                        item.isUrgent
                          ? 'bg-[#0B3324] hover:bg-[#072419] text-white'
                          : 'bg-white hover:bg-sand-100 text-[#0B3324] border border-[#0B3324]/30'
                      }`}
                    >
                      <span>
                        {item.type.includes('Online')
                          ? 'Start Online Quiz'
                          : item.type.includes('Worksheet')
                          ? 'Download & Submit'
                          : 'Upload Submission'}
                      </span>
                      <ChevronRight size={13} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Submission Modal */}
      {selectedAssignment && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-sand-300 shadow-2xl overflow-hidden animate-scaleIn">
            {/* Modal Header */}
            <div className="bg-[#0B3324] text-white p-4.5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 block">
                  {selectedAssignment.course} &bull; {selectedAssignment.courseCode}
                </span>
                <h3 className="font-bold text-sm md:text-base leading-snug">
                  {selectedAssignment.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAssignment(null)}
                className="text-sand-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              {/* Due Date & Weight Strip */}
              <div className="flex items-center justify-between text-xs bg-sand-100 p-3 rounded-xl border border-sand-200">
                <div>
                  <span className="text-ink-500 block text-[10px]">DUE DATE</span>
                  <span className="font-bold text-ink-900">{selectedAssignment.dueDate}</span>
                </div>
                <div className="text-right">
                  <span className="text-ink-500 block text-[10px]">WEIGHT</span>
                  <span className="font-bold text-primary-900">{selectedAssignment.weight}</span>
                </div>
              </div>

              {/* Instructions */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                  Assignment Instructions
                </h4>
                <p className="text-xs text-ink-600 bg-sand-50 p-3 rounded-xl border border-sand-200 leading-relaxed">
                  {selectedAssignment.instructions}
                </p>
              </div>

              {/* Submission Form / Status */}
              {selectedAssignment.status === 'Submitted' ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center space-y-2">
                  <CheckCircle2 size={32} className="text-emerald-700 mx-auto" />
                  <h5 className="font-bold text-sm text-emerald-900">Submission Recorded</h5>
                  <p className="text-xs text-emerald-700">
                    Your response was uploaded successfully and is currently queued for grading by {selectedAssignment.instructor}.
                  </p>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedAssignment(null)}
                      className="px-4 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleConfirmSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1.5">
                      Upload Document (PDF, DOCX, or Scan)
                    </label>
                    <div className="border-2 border-dashed border-sand-300 rounded-xl p-4 text-center hover:border-[#0B3324] transition-colors relative cursor-pointer bg-sand-50/50">
                      <input
                        type="file"
                        onChange={handleFakeFileUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        accept=".pdf,.docx,.doc,.txt,.zip"
                      />
                      <UploadCloud size={24} className="text-[#0B3324] mx-auto mb-1" />
                      {uploadedFile ? (
                        <div className="text-xs font-bold text-emerald-800">
                          {uploadedFile.name} ({uploadedFile.size})
                        </div>
                      ) : (
                        <div>
                          <span className="text-xs font-bold text-[#0B3324]">Click to browse</span>
                          <span className="text-xs text-ink-500"> or drag file here</span>
                          <p className="text-[10px] text-ink-400 mt-0.5">PDF or Word document up to 25MB</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-ink-700 mb-1">
                      Student Comments / Notes (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={submissionNotes}
                      onChange={(e) => setSubmissionNotes(e.target.value)}
                      placeholder="Add any clarification or notes for the teaching assistant..."
                      className="w-full text-xs p-2.5 rounded-xl border border-sand-300 focus:outline-none focus:ring-2 focus:ring-[#0B3324]/20 resize-none"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2 border-t border-sand-200">
                    <button
                      type="button"
                      onClick={() => setSelectedAssignment(null)}
                      className="px-4 py-2 text-xs font-bold text-ink-600 hover:bg-sand-100 rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2 bg-[#0B3324] hover:bg-[#072419] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <span>Uploading...</span>
                      ) : (
                        <>
                          <FileCheck size={14} />
                          <span>Submit Assignment</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating Success Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0B3324] text-white px-4 py-3 rounded-2xl shadow-2xl border border-emerald-600 flex items-center gap-2.5 animate-slideIn text-xs">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </section>
  );
}
