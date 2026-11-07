import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Calendar,
  Clock,
  Video,
  MapPin,
  Users,
  AlertTriangle,
  Bell,
  CheckCircle2,
  Copy,
  ExternalLink,
  Sparkles,
  Send,
  MessageSquare,
  Mail,
  Smartphone,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import {
  formatSlotTimeRange,
  formatTime12h,
  timeToMinutes,
  checkScheduleConflict,
} from '../../services/courseStorage';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const COHORTS_LIST = [
  { id: 'foundations_sem1', name: 'Ilm Foundations • Semester 1', enrolledCount: 15 },
  { id: 'foundations_sem2', name: 'Ilm Foundations • Semester 2', enrolledCount: 12 },
  { id: 'intensives_modular', name: 'Ilm Intensives • Modular Masterclasses', enrolledCount: 28 },
];

const COURSES_BY_COHORT = {
  foundations_sem1: [
    { id: 'crs_adm_01', title: "Tafsīr-ul-Qur'ān" },
    { id: 'crs_adm_02', title: 'Fiqh — Acts of Worship' },
    { id: 'crs_adm_03', title: "Qur'ānic Arabic — Level 1" },
  ],
  foundations_sem2: [
    { id: 'crs_adm_07', title: 'Hadith Studies — 40 Hadith of Imam Nawawi' },
    { id: 'crs_adm_08', title: 'Usul al-Fiqh — Principles of Jurisprudence' },
    { id: 'crs_adm_09', title: "Qur'ānic Arabic — Level 2" },
  ],
  intensives_modular: [
    { id: 'crs_adm_04', title: 'Purification of the Heart (Tazkiyah)' },
    { id: 'crs_adm_05', title: 'The Prophetic Biography (Sīrah)' },
    { id: 'crs_adm_06', title: 'Decoding Isms & Modern Ideologies' },
  ],
};

const INSTRUCTORS_LIST = [
  'Ustadh Khalil Ahmad',
  'Sheikh Abdullah Nasir',
  'Ustadha Fatima Zahra',
  'Sheikh Yasir Faheem',
  'Muhammad Ali',
  'Raja Zia ul Haq',
];

const CAMPUS_ROOMS = [
  { name: 'Room 204 • Main Academic Block', capacity: 35 },
  { name: 'Auditorium A • Lahore DHA Campus', capacity: 60 },
  { name: 'Executive Seminar Hall B', capacity: 40 },
  { name: 'Room 102 • First Floor', capacity: 30 },
];

export default function ScheduleDrawer({
  isOpen,
  onClose,
  initialSlot = null,
  allSlots = [],
  onSaveSlot,
}) {
  const isEditing = Boolean(initialSlot?.id);

  // Form State
  const [formData, setFormData] = useState({
    id: '',
    cohortId: 'foundations_sem1',
    cohortName: 'Ilm Foundations • Semester 1',
    enrolledCount: 15,
    courseId: 'crs_adm_01',
    courseTitle: "Tafsīr-ul-Qur'ān",
    topic: '',
    instructorName: 'Ustadh Khalil Ahmad',
    dayOfWeek: 'Tuesday',
    startTime: '18:00',
    endTime: '20:30',
    scheduleType: 'recurring',
    status: 'scheduled',
    modality: 'online_meet',
    meetLink: 'https://meet.google.com/ilm-tafsir-sem1',
    campusRoom: 'Room 204 • Main Academic Block',
    roomCapacity: 35,
  });

  // Notification Card State
  const [notifyStudents, setNotifyStudents] = useState(true);
  const [channels, setChannels] = useState({
    in_app: true,
    email: true,
    whatsapp: true,
  });
  const [customNote, setCustomNote] = useState('');
  const [allowConflictOverride, setAllowConflictOverride] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Sync state whenever initialSlot or isOpen changes
  useEffect(() => {
    if (initialSlot) {
      setFormData({
        id: initialSlot.id || '',
        cohortId: initialSlot.cohortId || 'foundations_sem1',
        cohortName: initialSlot.cohortName || 'Ilm Foundations • Semester 1',
        enrolledCount: initialSlot.enrolledCount || 15,
        courseId: initialSlot.courseId || 'crs_adm_01',
        courseTitle: initialSlot.courseTitle || "Tafsīr-ul-Qur'ān",
        topic: initialSlot.topic || '',
        instructorName: initialSlot.instructorName || 'Ustadh Khalil Ahmad',
        dayOfWeek: initialSlot.dayOfWeek || 'Tuesday',
        startTime: initialSlot.startTime || '18:00',
        endTime: initialSlot.endTime || '20:30',
        scheduleType: initialSlot.scheduleType || 'recurring',
        status: initialSlot.status || 'scheduled',
        modality: initialSlot.modality || 'online_meet',
        meetLink: initialSlot.meetLink || 'https://meet.google.com/ilm-live-class',
        campusRoom: initialSlot.campusRoom || 'Room 204 • Main Academic Block',
        roomCapacity: initialSlot.roomCapacity || 35,
      });
      setNotifyStudents(true);
      setCustomNote('');
      setAllowConflictOverride(false);
    } else {
      setFormData({
        id: '',
        cohortId: 'foundations_sem1',
        cohortName: 'Ilm Foundations • Semester 1',
        enrolledCount: 15,
        courseId: 'crs_adm_01',
        courseTitle: "Tafsīr-ul-Qur'ān",
        topic: '',
        instructorName: 'Ustadh Khalil Ahmad',
        dayOfWeek: 'Tuesday',
        startTime: '18:00',
        endTime: '20:30',
        scheduleType: 'recurring',
        status: 'scheduled',
        modality: 'online_meet',
        meetLink: 'https://meet.google.com/ilm-class-' + Math.random().toString(36).substring(2, 6),
        campusRoom: 'Room 204 • Main Academic Block',
        roomCapacity: 35,
      });
      setNotifyStudents(true);
      setCustomNote('');
      setAllowConflictOverride(false);
    }
  }, [initialSlot, isOpen]);

  // Handle ESC key to close drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Calculated duration
  const durationText = useMemo(() => {
    const startM = timeToMinutes(formData.startTime);
    const endM = timeToMinutes(formData.endTime);
    if (endM <= startM) return 'Invalid time range';
    const diff = endM - startM;
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    return `${hours > 0 ? `${hours}h ` : ''}${mins > 0 ? `${mins}m` : ''}`.trim();
  }, [formData.startTime, formData.endTime]);

  // Real-time conflict detection
  const conflictResult = useMemo(() => {
    return checkScheduleConflict(formData, allSlots, initialSlot?.id);
  }, [formData, allSlots, initialSlot]);

  // Computed Change Diff for Notification Preview
  const changeDiffSummary = useMemo(() => {
    if (!isEditing || !initialSlot) {
      return `New lecture scheduled: ${formData.dayOfWeek} at ${formatSlotTimeRange(formData.startTime, formData.endTime)} (${formData.modality === 'online_meet' ? 'Google Meet Online' : formData.campusRoom})`;
    }

    const diffs = [];
    if (initialSlot.status !== formData.status) {
      if (formData.status === 'cancelled') return 'CLASS CANCELLED for this session.';
      if (formData.status === 'rescheduled') diffs.push('Session marked as Rescheduled');
    }
    if (initialSlot.dayOfWeek !== formData.dayOfWeek) {
      diffs.push(`Day shifted from ${initialSlot.dayOfWeek} → ${formData.dayOfWeek}`);
    }
    if (initialSlot.startTime !== formData.startTime || initialSlot.endTime !== formData.endTime) {
      diffs.push(`Time changed from ${formatSlotTimeRange(initialSlot.startTime, initialSlot.endTime)} → ${formatSlotTimeRange(formData.startTime, formData.endTime)}`);
    }
    if (initialSlot.modality !== formData.modality) {
      const fromMod = initialSlot.modality === 'online_meet' ? 'Google Meet Online' : 'DHA Campus On-Site';
      const toMod = formData.modality === 'online_meet' ? 'Google Meet Online' : 'DHA Campus On-Site';
      diffs.push(`Modality shifted from ${fromMod} → ${toMod}`);
    } else if (formData.modality === 'onsite_campus' && initialSlot.campusRoom !== formData.campusRoom) {
      diffs.push(`Room moved to ${formData.campusRoom}`);
    }
    if (initialSlot.topic !== formData.topic && formData.topic) {
      diffs.push(`Topic updated: "${formData.topic}"`);
    }

    if (diffs.length === 0) {
      return `Routine reminder: Session confirmed for ${formData.dayOfWeek} at ${formatSlotTimeRange(formData.startTime, formData.endTime)}.`;
    }
    return diffs.join(' • ');
  }, [isEditing, initialSlot, formData]);

  if (!isOpen) return null;

  // Cohort change handler
  const handleCohortChange = (cohortId) => {
    const selected = COHORTS_LIST.find((c) => c.id === cohortId);
    const availableCourses = COURSES_BY_COHORT[cohortId] || [];
    const defaultCourse = availableCourses[0] || { id: '', title: '' };

    setFormData({
      ...formData,
      cohortId,
      cohortName: selected?.name || '',
      enrolledCount: selected?.enrolledCount || 15,
      courseId: defaultCourse.id,
      courseTitle: defaultCourse.title,
    });
  };

  // Course change handler
  const handleCourseChange = (courseId) => {
    const availableCourses = COURSES_BY_COHORT[formData.cohortId] || [];
    const course = availableCourses.find((c) => c.id === courseId);
    setFormData({
      ...formData,
      courseId,
      courseTitle: course?.title || '',
    });
  };

  // Room change handler
  const handleRoomChange = (roomName) => {
    const room = CAMPUS_ROOMS.find((r) => r.name === roomName);
    setFormData({
      ...formData,
      campusRoom: roomName,
      roomCapacity: room?.capacity || 30,
    });
  };

  // Auto-generate Google Meet link
  const handleAutoGenerateMeet = () => {
    const randomCode = Math.random().toString(36).substring(2, 5) + '-' +
      Math.random().toString(36).substring(2, 6) + '-' +
      Math.random().toString(36).substring(2, 5);
    setFormData({
      ...formData,
      meetLink: `https://meet.google.com/${randomCode}`,
    });
  };

  const handleCopyMeetLink = () => {
    if (!formData.meetLink) return;
    navigator.clipboard.writeText(formData.meetLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (conflictResult.hasConflict && !allowConflictOverride) {
      alert('Please resolve the scheduling conflict or check "Allow conflict anyway" before saving.');
      return;
    }

    const startM = timeToMinutes(formData.startTime);
    const endM = timeToMinutes(formData.endTime);
    if (endM <= startM) {
      alert('End time must be later than start time.');
      return;
    }

    const payload = {
      ...formData,
      id: formData.id || `slot_${Date.now()}`,
    };

    const notificationPayload = notifyStudents
      ? {
          slotId: payload.id,
          courseTitle: payload.courseTitle,
          cohortName: payload.cohortName,
          recipientCount: payload.enrolledCount,
          type: isEditing ? (payload.status === 'cancelled' ? 'cancelled' : 'rescheduled') : 'slot_created',
          changeSummary: changeDiffSummary,
          channels: Object.keys(channels).filter((k) => channels[k]),
          customNote: customNote.trim() || undefined,
        }
      : null;

    onSaveSlot(payload, notificationPayload);
    onClose();
  };

  const selectedChannelsCount = Object.values(channels).filter(Boolean).length;
  const isSaveBlocked = conflictResult.hasConflict && !allowConflictOverride;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fadeIn">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-primary-950/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Slide-Over Drawer Container */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-2xl bg-white shadow-2xl flex flex-col h-full border-l border-sand-200">
          
          {/* 1. STICKY DRAWER HEADER (Forest Green #0B3324) */}
          <div className="bg-[#0B3324] text-white px-6 py-5 shrink-0 flex items-center justify-between border-b border-primary-900 shadow-md">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {isEditing ? 'Edit Lecture Slot' : 'New Schedule Slot'}
                </span>
                <span className="text-xs text-primary-200 ">
                  {formData.id || 'TIMETABLE-DRAFT'}
                </span>
              </div>
              <h2 className="text-lg font-bold font-heading text-white mt-1">
                {isEditing ? formData.courseTitle : 'Schedule Live / On-Campus Lecture'}
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-primary-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Close drawer (Esc)"
            >
              <X size={20} />
            </button>
          </div>

          {/* 2. SCROLLABLE FORM BODY */}
          <form id="schedule-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* SECTION 1: Course, Cohort & Instructor */}
            <div className="bg-sand-50/70 border border-sand-200 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-ink-700 flex items-center gap-1.5">
                  <Users size={14} className="text-primary-800" />
                  Target Cohort &amp; Course
                </label>
                <span className="text-[11px] font-semibold text-primary-900 bg-primary-50/90 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  👥 {formData.enrolledCount} Students Enrolled
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-ink-700 block mb-1">Academic Cohort *</label>
                  <select
                    value={formData.cohortId}
                    onChange={(e) => handleCohortChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-sand-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 font-medium text-ink-900"
                  >
                    {COHORTS_LIST.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-ink-700 block mb-1">Course Module *</label>
                  <select
                    value={formData.courseId}
                    onChange={(e) => handleCourseChange(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-sand-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 font-medium text-ink-900"
                  >
                    {(COURSES_BY_COHORT[formData.cohortId] || []).map((crs) => (
                      <option key={crs.id} value={crs.id}>
                        {crs.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-ink-700 block mb-1">Lecture Topic / Syllabus Title *</label>
                <input
                  type="text"
                  required
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  placeholder="e.g. Surah Al-Baqarah: Verses 142–152 (The Change of Qiblah)"
                  className="w-full px-3.5 py-2 text-xs border border-sand-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 font-medium text-ink-900 placeholder:text-ink-400"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-ink-700 block mb-1">Assigned Instructor *</label>
                <select
                  value={formData.instructorName}
                  onChange={(e) => setFormData({ ...formData, instructorName: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-sand-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 font-medium text-ink-900"
                >
                  {INSTRUCTORS_LIST.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* SECTION 2: Schedule Timing, Recurrence & Status */}
            <div className="bg-sand-50/70 border border-sand-200 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-ink-700 flex items-center gap-1.5">
                  <Clock size={14} className="text-primary-800" />
                  Timetable &amp; Recurrence
                </label>
                <span className="text-[11px] text-primary-800 font-semibold bg-primary-100/70 px-2 py-0.5 rounded border border-primary-200">
                  ⏱️ {durationText}
                </span>
              </div>

              {/* Day of Week Selector Pills */}
              <div>
                <label className="text-xs font-medium text-ink-700 block mb-1.5">Day of Week *</label>
                <div className="grid grid-cols-7 gap-1.5">
                  {DAYS_OF_WEEK.map((day) => {
                    const isSelected = formData.dayOfWeek === day;
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => setFormData({ ...formData, dayOfWeek: day })}
                        className={`py-2 px-1 rounded-xl text-center text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#0B3324] text-white shadow-xs'
                            : 'bg-white border border-sand-200 text-ink-700 hover:bg-sand-100'
                        }`}
                      >
                        {day.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Start & End Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-ink-700 block mb-1">Start Time (PKT) *</label>
                  <input
                    type="time"
                    required
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-sand-300 rounded-xl bg-white font-semibold text-ink-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  />
                  <span className="text-[10px] text-ink-400 mt-0.5 block">
                    {formatTime12h(formData.startTime)}
                  </span>
                </div>

                <div>
                  <label className="text-xs font-medium text-ink-700 block mb-1">End Time (PKT) *</label>
                  <input
                    type="time"
                    required
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-sand-300 rounded-xl bg-white font-semibold text-ink-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  />
                  <span className="text-[10px] text-ink-400 mt-0.5 block">
                    {formatTime12h(formData.endTime)}
                  </span>
                </div>
              </div>

              {/* Status & Recurrence Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-xs font-medium text-ink-700 block mb-1">Session Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className={`w-full px-3 py-2 text-xs border rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${
                      formData.status === 'scheduled'
                        ? 'border-emerald-300 bg-emerald-50/70 text-emerald-900'
                        : formData.status === 'rescheduled'
                        ? 'border-amber-300 bg-amber-50/70 text-amber-900'
                        : 'border-red-300 bg-red-50/70 text-red-900'
                    }`}
                  >
                    <option value="scheduled">🟢 Scheduled (Active)</option>
                    <option value="rescheduled">🟡 Rescheduled (Changed)</option>
                    <option value="cancelled">🔴 Cancelled (No Class)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-ink-700 block mb-1">Recurrence Pattern</label>
                  <select
                    value={formData.scheduleType}
                    onChange={(e) => setFormData({ ...formData, scheduleType: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-sand-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 font-medium text-ink-900"
                  >
                    <option value="recurring">Weekly Recurring (Full Semester)</option>
                    <option value="single">Single / Makeup Session</option>
                  </select>
                </div>
              </div>
            </div>

            {/* SECTION 3: Modality & Venue Logistics */}
            <div className="bg-sand-50/70 border border-sand-200 rounded-2xl p-5 space-y-4">
              <label className="text-xs font-bold uppercase tracking-wider text-ink-700 block">
                Delivery Modality &amp; Venue
              </label>

              {/* 2-Card Segmented Selector */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, modality: 'online_meet' })}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                    formData.modality === 'online_meet'
                      ? 'border-blue-600 bg-blue-50/80 ring-2 ring-blue-500/20'
                      : 'border-sand-200 bg-white hover:bg-sand-100/60'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg shrink-0 ${formData.modality === 'online_meet' ? 'bg-blue-600 text-white' : 'bg-sand-100 text-ink-600'}`}>
                    <Video size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-ink-900">Google Meet</div>
                    <p className="text-[10px] text-ink-500 mt-0.5">Live Online Video Stream</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, modality: 'onsite_campus' })}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                    formData.modality === 'onsite_campus'
                      ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/20'
                      : 'border-sand-200 bg-white hover:bg-sand-100/60'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg shrink-0 ${formData.modality === 'onsite_campus' ? 'bg-emerald-700 text-white' : 'bg-sand-100 text-ink-600'}`}>
                    <MapPin size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-ink-900">DHA Phase 6 Campus</div>
                    <p className="text-[10px] text-ink-500 mt-0.5">Physical In-Person Lecture</p>
                  </div>
                </button>
              </div>

              {/* Conditional Modality Fields */}
              {formData.modality === 'online_meet' ? (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-ink-700">Google Meet Link *</label>
                    <button
                      type="button"
                      onClick={handleAutoGenerateMeet}
                      className="text-[11px] font-bold text-blue-700 hover:text-blue-900 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles size={11} />
                      Generate New Link
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      required
                      value={formData.meetLink}
                      onChange={(e) => setFormData({ ...formData, meetLink: e.target.value })}
                      placeholder="https://meet.google.com/abc-defg-hij"
                      className="flex-1 px-3 py-2 text-xs border border-sand-300 rounded-xl bg-white text-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <button
                      type="button"
                      onClick={handleCopyMeetLink}
                      className="px-3 py-2 bg-white border border-sand-300 hover:bg-sand-100 rounded-xl text-xs font-semibold text-ink-700 transition-colors inline-flex items-center gap-1 cursor-pointer"
                      title="Copy meeting link"
                    >
                      <Copy size={13} />
                      <span>{copiedLink ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium text-ink-700 block mb-1">Campus Room / Hall *</label>
                    <select
                      value={formData.campusRoom}
                      onChange={(e) => handleRoomChange(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-sand-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 font-medium text-ink-900"
                    >
                      {CAMPUS_ROOMS.map((r) => (
                        <option key={r.name} value={r.name}>
                          {r.name} (Cap: {r.capacity})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-ink-700 block mb-1">Max Capacity</label>
                    <input
                      type="number"
                      value={formData.roomCapacity}
                      onChange={(e) => setFormData({ ...formData, roomCapacity: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-xs border border-sand-300 rounded-xl bg-white text-ink-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 4: REAL-TIME CONFLICT DETECTION WARNING */}
            {conflictResult.hasConflict && (
              <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 space-y-3 animate-fadeIn">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                      Scheduling Conflict Detected ({conflictResult.conflicts.length})
                    </h4>
                    <p className="text-[11px] text-amber-800 mt-0.5">
                      The proposed timetable overlaps with existing active classes:
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5 pl-7">
                  {conflictResult.conflicts.map((c, idx) => (
                    <div key={idx} className="text-xs text-amber-900 bg-white/80 p-2.5 rounded-xl border border-amber-200">
                      <strong className="font-bold block text-amber-950">{c.title}:</strong>
                      <span>{c.message}</span>
                    </div>
                  ))}
                </div>

                <label className="flex items-center gap-2 pl-7 pt-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={allowConflictOverride}
                    onChange={(e) => setAllowConflictOverride(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer accent-amber-600"
                  />
                  <span className="text-[11px] font-semibold text-amber-950">
                    Allow conflict anyway (Emergency Admin Override)
                  </span>
                </label>
              </div>
            )}

            {/* SECTION 5: AUTOMATED STUDENT & INSTRUCTOR NOTIFICATIONS */}
            <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                  <Bell size={14} className="text-primary-900" />
                  Automated Student Cohort Notifications
                </label>
                
                {/* Switch Toggle */}
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyStudents}
                    onChange={(e) => setNotifyStudents(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-sand-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-sand-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-700"></div>
                </label>
              </div>

              {notifyStudents ? (
                <div className="space-y-3.5 pt-1">
                  {/* Channel Checkboxes */}
                  <div>
                    <span className="text-[11px] font-semibold text-ink-700 block mb-1.5">
                      Delivery Channels ({selectedChannelsCount} Active):
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-emerald-200 text-xs font-medium text-ink-800 cursor-pointer hover:bg-emerald-50">
                        <input
                          type="checkbox"
                          checked={channels.in_app}
                          onChange={(e) => setChannels({ ...channels, in_app: e.target.checked })}
                          className="rounded text-emerald-700 focus:ring-emerald-500 cursor-pointer accent-emerald-700"
                        />
                        <MessageSquare size={13} className="text-primary-900" />
                        <span>Student Portal Inbox</span>
                      </label>

                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-emerald-200 text-xs font-medium text-ink-800 cursor-pointer hover:bg-emerald-50">
                        <input
                          type="checkbox"
                          checked={channels.email}
                          onChange={(e) => setChannels({ ...channels, email: e.target.checked })}
                          className="rounded text-emerald-700 focus:ring-emerald-500 cursor-pointer accent-emerald-700"
                        />
                        <Mail size={13} className="text-primary-900" />
                        <span>Email Broadcast</span>
                      </label>

                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-emerald-200 text-xs font-medium text-ink-800 cursor-pointer hover:bg-emerald-50">
                        <input
                          type="checkbox"
                          checked={channels.whatsapp}
                          onChange={(e) => setChannels({ ...channels, whatsapp: e.target.checked })}
                          className="rounded text-emerald-700 focus:ring-emerald-500 cursor-pointer accent-emerald-700"
                        />
                        <Smartphone size={13} className="text-primary-900" />
                        <span>WhatsApp / SMS</span>
                      </label>
                    </div>
                  </div>

                  {/* Live Dynamic Diff Preview Box */}
                  <div className="p-3.5 rounded-xl bg-white border border-emerald-200 shadow-2xs space-y-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-primary-900 flex items-center gap-1">
                      <Send size={11} />
                      Live Broadcast Preview ({formData.enrolledCount} Recipients)
                    </div>
                    <p className="text-xs text-ink-800 font-medium leading-relaxed">
                      📢 <strong>Schedule Update: {formData.cohortName}</strong> — <em>"{formData.courseTitle}"</em>: {changeDiffSummary}
                    </p>
                    {customNote && (
                      <p className="text-xs text-ink-600 italic mt-1 border-t border-sand-100 pt-1">
                        Note: "{customNote}"
                      </p>
                    )}
                  </div>

                  {/* Optional Custom Note input */}
                  <div>
                    <label className="text-xs font-medium text-ink-700 block mb-1">
                      Additional Note to Students (Optional)
                    </label>
                    <input
                      type="text"
                      value={customNote}
                      onChange={(e) => setCustomNote(e.target.value)}
                      placeholder="e.g. Please review the pre-class reading packet; Google Meet link attached."
                      className="w-full px-3 py-1.5 text-xs border border-sand-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-ink-900"
                    />
                  </div>
                </div>
              ) : (
                <p className="text-xs text-ink-500 italic py-1">
                  Notifications disabled. The timetable will update quietly without pinging enrolled students.
                </p>
              )}
            </div>
          </form>

          {/* 3. STICKY DRAWER FOOTER CTAs */}
          <div className="p-5 border-t border-sand-200 bg-sand-50/80 shrink-0 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-ink-600 hover:text-ink-900 hover:bg-sand-200/70 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              form="schedule-form"
              disabled={isSaveBlocked}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-sm flex items-center gap-2 cursor-pointer ${
                isSaveBlocked
                  ? 'bg-sand-400 cursor-not-allowed opacity-60'
                  : 'bg-[#0B3324] hover:bg-[#072318] active:scale-[0.98]'
              }`}
            >
              <CheckCircle2 size={15} />
              <span>
                {notifyStudents
                  ? `Save & Notify ${formData.enrolledCount} Students`
                  : 'Save Lecture Slot'}
              </span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
