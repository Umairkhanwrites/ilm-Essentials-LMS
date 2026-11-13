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
    { id: 'crs_001', title: "Qur'ānic Arabic", instructor: 'Dr. Mutee Ur Rehman' },
    { id: 'crs_002', title: 'Tajwīd', instructor: 'Qari Salman Saleem' },
    { id: 'crs_003', title: 'Fiqh', instructor: 'Dr. Hafiz M. Zubair' },
    { id: 'crs_004', title: 'Tafsīr', instructor: 'Shaykh Hamid Kamal Ud Din' },
    { id: 'crs_005', title: 'Why Islām?', instructor: 'Sir Ahmed Khan' },
    { id: 'crs_006', title: 'Sīrah', instructor: 'Sir Ali Ahmed Saeed' },
  ],
  foundations_sem2: [
    { id: 'crs_adm_07', title: 'Hadith Studies — 40 Hadith of Imam Nawawi', instructor: 'Shaykh Hamid Kamal Ud Din' },
    { id: 'crs_adm_08', title: 'Usul al-Fiqh — Principles of Jurisprudence', instructor: 'Dr. Hafiz M. Zubair' },
    { id: 'crs_adm_09', title: "Qur'ānic Arabic — Level 2", instructor: 'Dr. Mutee Ur Rehman' },
  ],
  intensives_modular: [
    { id: 'crs_007', title: 'The Prophetic Biography (Sīrah)', instructor: 'Muhammad Ali' },
    { id: 'crs_008', title: 'Decoding Isms & Modern Ideologies', instructor: 'Raja Zia ul Haq' },
    { id: 'crs_adm_04', title: 'Purification of the Heart (Tazkiyah)', instructor: 'Ustadh Khalil Ahmad' },
  ],
};

const INSTRUCTORS_LIST = [
  'Dr. Mutee Ur Rehman',
  'Qari Salman Saleem',
  'Dr. Hafiz M. Zubair',
  'Shaykh Hamid Kamal Ud Din',
  'Sir Ahmed Khan',
  'Sir Ali Ahmed Saeed',
  'Muhammad Ali',
  'Raja Zia ul Haq',
  'Ustadh Khalil Ahmad',
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
    enrolledCount: 142,
    courseId: 'crs_001',
    courseTitle: "Qur'ānic Arabic",
    topic: '',
    instructorName: 'Dr. Mutee Ur Rehman',
    dayOfWeek: 'Tuesday',
    startTime: '18:30',
    endTime: '19:30',
    scheduleType: 'recurring',
    status: 'scheduled',
    modality: 'online_meet',
    meetLink: 'https://meet.google.com/cbh-ywhg-upu',
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
        enrolledCount: initialSlot.enrolledCount || 142,
        courseId: initialSlot.courseId || 'crs_001',
        courseTitle: initialSlot.courseTitle || "Qur'ānic Arabic",
        topic: initialSlot.topic || '',
        instructorName: initialSlot.instructorName || 'Dr. Mutee Ur Rehman',
        dayOfWeek: initialSlot.dayOfWeek || 'Tuesday',
        startTime: initialSlot.startTime || '18:30',
        endTime: initialSlot.endTime || '19:30',
        scheduleType: initialSlot.scheduleType || 'recurring',
        status: initialSlot.status || 'scheduled',
        modality: initialSlot.modality || 'online_meet',
        meetLink: initialSlot.meetLink || 'https://meet.google.com/cbh-ywhg-upu',
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
        enrolledCount: 142,
        courseId: 'crs_001',
        courseTitle: "Qur'ānic Arabic",
        topic: '',
        instructorName: 'Dr. Mutee Ur Rehman',
        dayOfWeek: 'Tuesday',
        startTime: '18:30',
        endTime: '19:30',
        scheduleType: 'recurring',
        status: 'scheduled',
        modality: 'online_meet',
        meetLink: 'https://meet.google.com/cbh-ywhg-upu',
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
      enrolledCount: selected?.enrolledCount || 142,
      courseId: defaultCourse.id,
      courseTitle: defaultCourse.title,
      ...(defaultCourse.instructor ? { instructorName: defaultCourse.instructor } : {}),
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
      ...(course?.instructor ? { instructorName: course.instructor } : {}),
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
        className="fixed inset-0 bg-ink-950/40 backdrop-blur-2xs transition-opacity"
        onClick={onClose}
      />

      {/* Slide-Over Drawer Container */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-8">
        <div className="w-screen max-w-lg bg-white shadow-xl flex flex-col h-full border-l border-sand-200">
          
          {/* Minimal Header */}
          <div className="px-6 py-4 bg-white border-b border-sand-200 flex items-center justify-between shrink-0">
            <div>
              <h2 className="text-base font-bold font-heading text-ink-900">
                {isEditing ? 'Edit Lecture Slot' : 'Add Lecture Slot'}
              </h2>
              <p className="text-xs text-ink-500 mt-0.5">
                {formData.cohortName} • {formData.enrolledCount} students enrolled
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-ink-400 hover:text-ink-700 hover:bg-sand-100 transition-colors cursor-pointer"
              title="Close (Esc)"
            >
              <X size={18} />
            </button>
          </div>

          {/* Form Body */}
          <form id="schedule-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
            
            {/* Section 1: Course & Instructor */}
            <div className="space-y-3">
              <div className="text-[11px] font-bold text-ink-400 uppercase tracking-wider">
                Course &amp; Cohort
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
                  className="w-full px-3 py-2 text-xs border border-sand-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 text-ink-900 placeholder:text-ink-400"
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

            <div className="border-t border-sand-200" />

            {/* Section 2: Timetable & Recurrence */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-ink-400 uppercase tracking-wider">
                  Timetable &amp; Schedule
                </span>
                <span className="text-[11px] font-semibold text-ink-500">
                  Duration: {durationText}
                </span>
              </div>

              {/* Day of Week Selector */}
              <div>
                <label className="text-xs font-medium text-ink-700 block mb-1.5">Day of Week *</label>
                <div className="grid grid-cols-7 gap-1">
                  {DAYS_OF_WEEK.map((day) => {
                    const isSelected = formData.dayOfWeek === day;
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => setFormData({ ...formData, dayOfWeek: day })}
                        className={`py-1.5 rounded-lg text-center text-xs font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-primary-900 text-white font-bold shadow-xs'
                            : 'bg-sand-50 border border-sand-200 text-ink-700 hover:bg-sand-100'
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
                </div>
              </div>

              {/* Status & Recurrence */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-ink-700 block mb-1">Session Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-sand-300 rounded-xl bg-white font-medium text-ink-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  >
                    <option value="scheduled">Scheduled (Active)</option>
                    <option value="rescheduled">Rescheduled</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-ink-700 block mb-1">Recurrence Pattern</label>
                  <select
                    value={formData.scheduleType}
                    onChange={(e) => setFormData({ ...formData, scheduleType: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-sand-300 rounded-xl bg-white font-medium text-ink-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  >
                    <option value="recurring">Weekly Recurring</option>
                    <option value="single">Single / Makeup Session</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="border-t border-sand-200" />

            {/* Section 3: Delivery Modality & Venue */}
            <div className="space-y-3">
              <div className="text-[11px] font-bold text-ink-400 uppercase tracking-wider">
                Delivery Modality
              </div>

              {/* Minimal Segmented Control */}
              <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-sand-100 border border-sand-200">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, modality: 'online_meet' })}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    formData.modality === 'online_meet'
                      ? 'bg-white text-ink-900 shadow-2xs font-bold'
                      : 'text-ink-600 hover:text-ink-900'
                  }`}
                >
                  <Video size={13} />
                  <span>Google Meet</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, modality: 'onsite_campus' })}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    formData.modality === 'onsite_campus'
                      ? 'bg-white text-ink-900 shadow-2xs font-bold'
                      : 'text-ink-600 hover:text-ink-900'
                  }`}
                >
                  <MapPin size={13} />
                  <span>DHA Phase 6</span>
                </button>
              </div>

              {/* Modality Specific Input */}
              {formData.modality === 'online_meet' ? (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-ink-700">Google Meet Link *</label>
                    <button
                      type="button"
                      onClick={handleAutoGenerateMeet}
                      className="text-[11px] font-semibold text-primary-900 hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles size={11} />
                      Generate Link
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      required
                      value={formData.meetLink}
                      onChange={(e) => setFormData({ ...formData, meetLink: e.target.value })}
                      placeholder="https://meet.google.com/cbh-ywhg-upu"
                      className="flex-1 px-3 py-2 text-xs border border-sand-300 rounded-xl bg-white text-ink-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                    <button
                      type="button"
                      onClick={handleCopyMeetLink}
                      className="px-3 py-2 bg-sand-50 border border-sand-200 hover:bg-sand-100 rounded-xl text-xs font-semibold text-ink-700 transition-colors inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Copy size={12} />
                      <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium text-ink-700 block mb-1">Campus Room *</label>
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
                    <label className="text-xs font-medium text-ink-700 block mb-1">Capacity</label>
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

            {/* Real-time Conflict Alert */}
            {conflictResult.hasConflict && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                  <AlertTriangle size={14} className="shrink-0 text-amber-700" />
                  <span>Scheduling Conflict ({conflictResult.conflicts.length})</span>
                </div>
                <div className="text-[11px] text-amber-800 space-y-1">
                  {conflictResult.conflicts.map((c, idx) => (
                    <div key={idx}>• {c.title}: {c.message}</div>
                  ))}
                </div>
                <label className="flex items-center gap-1.5 pt-1 text-[11px] font-semibold text-amber-950 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowConflictOverride}
                    onChange={(e) => setAllowConflictOverride(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <span>Allow conflict override</span>
                </label>
              </div>
            )}

            <div className="border-t border-sand-200" />

            {/* Section 4: Student Notifications */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={notifyStudents}
                    onChange={(e) => setNotifyStudents(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-primary-900 focus:ring-primary-500 cursor-pointer accent-primary-900"
                  />
                  <span className="text-xs font-semibold text-ink-800">
                    Notify enrolled students ({formData.enrolledCount})
                  </span>
                </label>
              </div>

              {notifyStudents && (
                <div className="space-y-2.5 pl-5.5">
                  <div className="flex flex-wrap gap-1.5">
                    <label className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sand-50 border border-sand-200 text-[11px] font-medium text-ink-700 cursor-pointer hover:bg-sand-100">
                      <input
                        type="checkbox"
                        checked={channels.in_app}
                        onChange={(e) => setChannels({ ...channels, in_app: e.target.checked })}
                        className="rounded text-primary-900 focus:ring-primary-500 accent-primary-900"
                      />
                      <span>In-App</span>
                    </label>

                    <label className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sand-50 border border-sand-200 text-[11px] font-medium text-ink-700 cursor-pointer hover:bg-sand-100">
                      <input
                        type="checkbox"
                        checked={channels.email}
                        onChange={(e) => setChannels({ ...channels, email: e.target.checked })}
                        className="rounded text-primary-900 focus:ring-primary-500 accent-primary-900"
                      />
                      <span>Email</span>
                    </label>

                    <label className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sand-50 border border-sand-200 text-[11px] font-medium text-ink-700 cursor-pointer hover:bg-sand-100">
                      <input
                        type="checkbox"
                        checked={channels.whatsapp}
                        onChange={(e) => setChannels({ ...channels, whatsapp: e.target.checked })}
                        className="rounded text-primary-900 focus:ring-primary-500 accent-primary-900"
                      />
                      <span>WhatsApp</span>
                    </label>
                  </div>

                  <input
                    type="text"
                    value={customNote}
                    onChange={(e) => setCustomNote(e.target.value)}
                    placeholder="Add an optional note to students..."
                    className="w-full px-3 py-1.5 text-xs border border-sand-200 rounded-xl bg-sand-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 text-ink-900"
                  />
                </div>
              )}
            </div>
          </form>

          {/* Minimal Sticky Footer */}
          <div className="px-6 py-4 border-t border-sand-200 bg-sand-50/60 shrink-0 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-ink-600 hover:text-ink-900 hover:bg-sand-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              form="schedule-form"
              disabled={isSaveBlocked}
              className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-xs flex items-center gap-1.5 cursor-pointer ${
                isSaveBlocked
                  ? 'bg-sand-400 cursor-not-allowed opacity-60'
                  : 'bg-primary-900 hover:bg-primary-800'
              }`}
            >
              <CheckCircle2 size={13} />
              <span>{isEditing ? 'Update Lecture Slot' : 'Save Lecture Slot'}</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
