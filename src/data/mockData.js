// ============================================
// ILM ESSENTIALS LMS — Mock Data
// Replace with API calls when connecting to backend
// TODO: Connect to backend API
// ============================================

// --- Daily Hadith / Motivational Quotes ---
export const dailyQuotes = [
  {
    text: "Whoever follows a path in search of knowledge, Allah will make easy for him a path to Paradise.",
    source: "Sahih Muslim 2699",
    type: "hadith",
  },
  {
    text: "The seeking of knowledge is obligatory for every Muslim.",
    source: "Sunan Ibn Majah 224",
    type: "hadith",
  },
  {
    text: "Read! In the name of your Lord who created.",
    source: "Surah Al-'Alaq 96:1",
    type: "quran",
  },
  {
    text: "Are those who know equal to those who do not know?",
    source: "Surah Az-Zumar 39:9",
    type: "quran",
  },
  {
    text: "When a person dies, their deeds come to an end except for three: ongoing charity, beneficial knowledge, or a righteous child who prays for them.",
    source: "Sahih Muslim 1631",
    type: "hadith",
  },
];

// --- Current User ---
export const currentUser = {
  id: "usr_001",
  name: "Ahmad Raza",
  email: "student@ilmessentials.pk",
  role: "student", // "student" | "admin"
  avatar: null, // Will use initials fallback
  enrolledSince: "2026-03-15",
  totalHoursLearned: 47,
  assignmentsDue: 3,
};

// --- Test / Demo Login Credentials ---
export const demoCredentials = {
  student: {
    role: "Student",
    name: "Ahmad Raza",
    email: "student@ilmessentials.pk",
    alternateEmail: "ahmad.raza@example.com",
    password: "student123",
    landingUrl: "/dashboard",
    portalName: "Student Learning Dashboard",
  },
  admin: {
    role: "Administrator",
    name: "Faculty Administrator",
    email: "admin@ilmessentials.pk",
    password: "admin123",
    landingUrl: "/admin",
    portalName: "Admin Management Portal",
  },
};

// --- Quick Stats ---
export const quickStats = [
  {
    label: "Enrolled Courses",
    value: 4,
    icon: "BookOpen",
    color: "primary",
    change: "Active Semester",
  },
  {
    label: "Hours Learned",
    value: 47,
    icon: "Clock",
    color: "gold",
    change: "5.2 hrs this week",
  },
  {
    label: "Assignments Due",
    value: 3,
    icon: "FileText",
    color: "amber",
    change: "2 due this week",
  },
  {
    label: "Completed Lessons",
    value: 59,
    icon: "CheckCircle",
    color: "emerald",
    change: "Across all subjects",
  },
];

// --- Course Categories & Enrolled Courses ---
export const enrolledCourses = [
  // ILM FOUNDATIONS (8-month certificate)
  {
    id: "crs_101",
    title: "Tafsīr-ul-Qur'ān",
    category: "foundations",
    semester: 1,
    instructor: "Ustadh Khalil Ahmad",
    description: "Deep exegesis of selected Surahs with classical tafsir methodology.",
    progress: 72,
    totalLessons: 32,
    completedLessons: 23,
    format: "live-online",
    nextSession: "2026-11-03T18:00:00+05:00",
    thumbnail: null,
    color: "#0A3D2E",
  },
  {
    id: "crs_102",
    title: "Fiqh — Acts of Worship",
    category: "foundations",
    semester: 1,
    instructor: "Sheikh Abdullah Nasir",
    description: "Comprehensive study of Fiqh al-Ibadat covering Salah, Zakah, Sawm, and Hajj.",
    progress: 58,
    totalLessons: 28,
    completedLessons: 16,
    format: "on-site",
    nextSession: "2026-11-04T18:00:00+05:00",
    thumbnail: null,
    color: "#155E3D",
  },
  {
    id: "crs_103",
    title: "Qur'ānic Arabic — Level 1",
    category: "foundations",
    semester: 1,
    instructor: "Ustadha Fatima Zahra",
    description: "Foundational Arabic grammar (Nahw & Sarf) to understand the Qur'an directly.",
    progress: 85,
    totalLessons: 24,
    completedLessons: 20,
    format: "live-online",
    nextSession: "2026-11-05T18:00:00+05:00",
    thumbnail: null,
    color: "#1A7A4E",
  },
  // ILM INTENSIVES (Short masterclasses)
  {
    id: "crs_201",
    title: "Purification of the Heart",
    category: "intensives",
    instructor: "Sheikh Yasir Faheem",
    description: "A transformative 4-week masterclass on Tazkiyat-un-Nafs based on classical texts.",
    progress: 35,
    totalLessons: 8,
    completedLessons: 3,
    format: "self-paced",
    nextSession: null,
    thumbnail: null,
    color: "#C8A951",
  },
  {
    id: "crs_202",
    title: "The Prophetic Biography",
    category: "intensives",
    instructor: "Dr. Tahir Mahmood",
    description: "An intensive journey through the life of Prophet Muhammad ﷺ — lessons for today.",
    progress: 0,
    totalLessons: 12,
    completedLessons: 0,
    format: "live-online",
    nextSession: "2026-11-10T19:00:00+05:00",
    thumbnail: null,
    color: "#155E3D",
  },
];

// --- Course Formats ---
export const courseFormats = {
  "on-site": {
    label: "On-Site",
    icon: "MapPin",
    color: "bg-primary-100 text-primary-800",
    description: "In-person at DHA Phase 6, Lahore",
  },
  "live-online": {
    label: "Live Online",
    icon: "Video",
    color: "bg-blue-100 text-blue-800",
    description: "Live via Google Meet / Zoom",
  },
  "self-paced": {
    label: "Self-Paced",
    icon: "PlayCircle",
    color: "bg-gold-100 text-gold-800",
    description: "Learn at your own schedule",
  },
};

// --- Upcoming Schedule ---
export const upcomingSchedule = [
  {
    id: "sch_01",
    courseTitle: "Tafsīr-ul-Qur'ān",
    topic: "Surah Al-Baqarah: Verses 142–152",
    date: "2026-11-03",
    time: "6:00 PM – 8:30 PM",
    format: "live-online",
    instructor: "Ustadh Khalil Ahmad",
  },
  {
    id: "sch_02",
    courseTitle: "Fiqh — Acts of Worship",
    topic: "Chapter: Conditions & Pillars of Salah",
    date: "2026-11-04",
    time: "6:00 PM – 8:30 PM",
    format: "on-site",
    instructor: "Sheikh Abdullah Nasir",
  },
  {
    id: "sch_03",
    courseTitle: "Qur'ānic Arabic — Level 1",
    topic: "Nominal Sentences (Jumlah Ismiyyah)",
    date: "2026-11-05",
    time: "6:00 PM – 8:30 PM",
    format: "live-online",
    instructor: "Ustadha Fatima Zahra",
  },
];

// --- Individual Course Data (for Course Interface page) ---
export const courseDetail = {
  id: "crs_101",
  title: "Tafsīr-ul-Qur'ān",
  subtitle: "Semester 1 — Ilm Foundations Certificate Programme",
  instructor: {
    name: "Ustadh Khalil Ahmad",
    title: "Instructor of Qur'anic Sciences",
    avatar: null,
    bio: "Graduate of Al-Azhar University with specialization in classical Tafsir methodology. Teaching Qur'anic sciences for over 10 years.",
  },
  progress: 72,
  totalLessons: 32,
  completedLessons: 23,
  format: "live-online",
  description:
    "This comprehensive course takes you through a deep, methodical exegesis (Tafsir) of selected Surahs from the Holy Qur'an. Using classical tafsir works including Ibn Kathir, Jalalayn, and contemporary scholars, students will develop a rich understanding of Qur'anic themes, context of revelation (Asbab al-Nuzul), and practical application.",
  // Curriculum / Modules
  modules: [
    {
      id: "mod_01",
      title: "Introduction to Tafsir Sciences",
      expanded: false,
      lessons: [
        {
          id: "les_001",
          title: "What is Tafsir? History & Methodology",
          type: "video",
          duration: "45 min",
          completed: true,
        },
        {
          id: "les_002",
          title: "Categories of Tafsir: Bil-Ma'thur vs. Bil-Ra'y",
          type: "video",
          duration: "38 min",
          completed: true,
        },
        {
          id: "les_003",
          title: "Reading: Introduction to Tafsir Ibn Kathir",
          type: "reading",
          duration: "20 min",
          completed: true,
        },
        {
          id: "les_004",
          title: "Quiz: Foundations of Tafsir",
          type: "assessment",
          duration: "15 min",
          completed: true,
        },
      ],
    },
    {
      id: "mod_02",
      title: "Surah Al-Fatiha — The Opening",
      expanded: false,
      lessons: [
        {
          id: "les_005",
          title: "Virtues & Position of Al-Fatiha",
          type: "video",
          duration: "42 min",
          completed: true,
        },
        {
          id: "les_006",
          title: "Word-by-Word Analysis (Verses 1–4)",
          type: "video",
          duration: "50 min",
          completed: true,
        },
        {
          id: "les_007",
          title: "Word-by-Word Analysis (Verses 5–7)",
          type: "video",
          duration: "48 min",
          completed: true,
        },
        {
          id: "les_008",
          title: "Practical Application: Al-Fatiha in Salah",
          type: "reading",
          duration: "15 min",
          completed: true,
        },
        {
          id: "les_009",
          title: "Assessment: Surah Al-Fatiha",
          type: "assessment",
          duration: "20 min",
          completed: true,
        },
      ],
    },
    {
      id: "mod_03",
      title: "Surah Al-Baqarah — Part 1 (Verses 1–141)",
      expanded: true,
      lessons: [
        {
          id: "les_010",
          title: "Introduction & Context of Surah Al-Baqarah",
          type: "video",
          duration: "55 min",
          completed: true,
        },
        {
          id: "les_011",
          title: "The Qualities of the Believers (Verses 1–5)",
          type: "video",
          duration: "48 min",
          completed: true,
        },
        {
          id: "les_012",
          title: "The Story of Adam عليه السلام (Verses 30–39)",
          type: "video",
          duration: "52 min",
          completed: true,
        },
        {
          id: "les_013",
          title: "Lessons from Bani Isra'il (Verses 40–123)",
          type: "video",
          duration: "60 min",
          completed: false,
          current: true,
        },
        {
          id: "les_014",
          title: "Reading: Historical Context — Bani Isra'il in Madinah",
          type: "reading",
          duration: "25 min",
          completed: false,
        },
        {
          id: "les_015",
          title: "The Legacy of Ibrahim عليه السلام (Verses 124–141)",
          type: "video",
          duration: "50 min",
          completed: false,
        },
        {
          id: "les_016",
          title: "Assessment: Al-Baqarah Part 1",
          type: "assessment",
          duration: "25 min",
          completed: false,
        },
      ],
    },
    {
      id: "mod_04",
      title: "Surah Al-Baqarah — Part 2 (Verses 142–286)",
      expanded: false,
      lessons: [
        {
          id: "les_017",
          title: "Change of Qiblah & Its Significance (Verses 142–152)",
          type: "video",
          duration: "45 min",
          completed: false,
        },
        {
          id: "les_018",
          title: "Laws of Inheritance & Fasting (Verses 153–187)",
          type: "video",
          duration: "55 min",
          completed: false,
        },
        {
          id: "les_019",
          title: "Ayat-ul-Kursi — The Throne Verse (Verse 255)",
          type: "video",
          duration: "40 min",
          completed: false,
        },
        {
          id: "les_020",
          title: "Financial Ethics in Islam (Verses 261–283)",
          type: "video",
          duration: "48 min",
          completed: false,
        },
        {
          id: "les_021",
          title: "Final Assessment: Surah Al-Baqarah",
          type: "assessment",
          duration: "30 min",
          completed: false,
        },
      ],
    },
  ],
  // Resources
  resources: [
    {
      id: "res_01",
      title: "Course Syllabus — Tafsir-ul-Quran (Semester 1)",
      type: "pdf",
      size: "245 KB",
      downloadUrl: "#",
    },
    {
      id: "res_02",
      title: "Lecture Slides — Module 1: Intro to Tafsir Sciences",
      type: "pdf",
      size: "1.2 MB",
      downloadUrl: "#",
    },
    {
      id: "res_03",
      title: "Lecture Slides — Module 2: Surah Al-Fatiha",
      type: "pdf",
      size: "980 KB",
      downloadUrl: "#",
    },
    {
      id: "res_04",
      title: "Lecture Slides — Module 3: Surah Al-Baqarah (Part 1)",
      type: "pdf",
      size: "1.5 MB",
      downloadUrl: "#",
    },
    {
      id: "res_05",
      title: "Recommended Reading List",
      type: "pdf",
      size: "120 KB",
      downloadUrl: "#",
    },
    {
      id: "res_06",
      title: "Arabic Vocabulary — Key Qur'anic Terms",
      type: "pdf",
      size: "340 KB",
      downloadUrl: "#",
    },
  ],
  // Community Q&A
  discussions: [
    {
      id: "disc_01",
      author: "Fatima S.",
      avatar: null,
      isInstructor: false,
      timestamp: "2026-10-30T14:30:00+05:00",
      content: "Can someone explain the difference between Tafsir bil-Ma'thur and Tafsir bil-Ra'y in simpler terms? I understood the lecture but want to make sure I have it right.",
      upvotes: 8,
      replies: [
        {
          id: "rep_01",
          author: "Ustadh Khalil Ahmad",
          avatar: null,
          isInstructor: true,
          timestamp: "2026-10-30T16:15:00+05:00",
          content: "Great question, Fatima! Tafsir bil-Ma'thur is interpretation based on transmitted sources — the Quran explaining itself, Hadith of the Prophet ﷺ, and statements of the Sahabah. Tafsir bil-Ra'y involves scholarly reasoning and ijtihad within the framework of Arabic linguistics and Islamic sciences. Both are valid when done properly by qualified scholars.",
          upvotes: 15,
        },
        {
          id: "rep_02",
          author: "Omar H.",
          avatar: null,
          isInstructor: false,
          timestamp: "2026-10-30T17:00:00+05:00",
          content: "JazakAllah khair, Ustadh! That makes it very clear.",
          upvotes: 3,
        },
      ],
    },
    {
      id: "disc_02",
      author: "Bilal Ahmed",
      avatar: null,
      isInstructor: false,
      timestamp: "2026-10-28T10:00:00+05:00",
      content: "For the assessment on Module 2, should we focus on the linguistic analysis or the thematic analysis of Al-Fatiha?",
      upvotes: 5,
      replies: [
        {
          id: "rep_03",
          author: "Ustadh Khalil Ahmad",
          avatar: null,
          isInstructor: true,
          timestamp: "2026-10-28T12:30:00+05:00",
          content: "Both are important, Bilal. The assessment will cover: (1) Key vocabulary and their root meanings, (2) The seven themes of Al-Fatiha, and (3) Its practical significance in Salah. Review both the video lectures and the reading material.",
          upvotes: 12,
        },
      ],
    },
    {
      id: "disc_03",
      author: "Aisha K.",
      avatar: null,
      isInstructor: false,
      timestamp: "2026-10-25T09:00:00+05:00",
      content: "SubhanAllah, the story of Adam عليه السلام in Module 3 was so beautifully explained. The connection between the angels' question and human khilafah was eye-opening!",
      upvotes: 22,
      replies: [],
    },
  ],
};

// --- Notifications ---
export const notifications = [
  {
    id: "notif_01",
    type: "assignment",
    message: "Quiz: Foundations of Tafsir is due in 2 days",
    time: "2 hours ago",
    read: false,
  },
  {
    id: "notif_02",
    type: "announcement",
    message: "Ramadan schedule changes — check your email for details",
    time: "1 day ago",
    read: false,
  },
  {
    id: "notif_03",
    type: "reply",
    message: "Ustadh Khalil replied to your question in Tafsir Q&A",
    time: "2 days ago",
    read: true,
  },
];

// ============================================
// ADMIN PORTAL MOCK DATA
// ============================================

export const adminOverviewStats = [
  {
    label: "Total Enrolled Students",
    value: "1,248",
    change: "+12% this semester",
    trend: "up",
    icon: "Users",
    color: "primary",
  },
  {
    label: "Active Courses",
    value: "14",
    change: "6 Foundations, 8 Intensives",
    trend: "neutral",
    icon: "BookOpen",
    color: "gold",
  },
  {
    label: "Pending Applications",
    value: "38",
    change: "Requires review",
    trend: "alert",
    icon: "FileCheck",
    color: "amber",
  },
  {
    label: "Tuition Revenue",
    value: "PKR 3.4M",
    change: "+18% vs last cycle",
    trend: "up",
    icon: "CreditCard",
    color: "emerald",
  },
];

export const adminStudentsList = [
  {
    id: "std_001",
    name: "Muhammad Bilal",
    email: "bilal.m@example.com",
    program: "Ilm Foundations",
    semester: "Semester 1",
    format: "on-site",
    progress: 78,
    feeStatus: "Paid",
    attendance: "94%",
    enrolledDate: "2026-02-10",
  },
  {
    id: "std_002",
    name: "Ayesha Tariq",
    email: "ayesha.t@example.com",
    program: "Ilm Foundations",
    semester: "Semester 1",
    format: "live-online",
    progress: 88,
    feeStatus: "Paid",
    attendance: "98%",
    enrolledDate: "2026-02-12",
  },
  {
    id: "std_003",
    name: "Zainab Fatima",
    email: "zainab.f@example.com",
    program: "Purification of the Heart",
    semester: "Intensive",
    format: "self-paced",
    progress: 45,
    feeStatus: "Paid",
    attendance: "85%",
    enrolledDate: "2026-03-01",
  },
  {
    id: "std_004",
    name: "Hamza Farooq",
    email: "hamza.f@example.com",
    program: "Ilm Foundations",
    semester: "Semester 1",
    format: "on-site",
    progress: 60,
    feeStatus: "Pending",
    attendance: "82%",
    enrolledDate: "2026-02-15",
  },
  {
    id: "std_005",
    name: "Usman Ghani",
    email: "usman.g@example.com",
    program: "The Prophetic Biography",
    semester: "Intensive",
    format: "live-online",
    progress: 10,
    feeStatus: "Pending",
    attendance: "90%",
    enrolledDate: "2026-03-20",
  },
  {
    id: "std_006",
    name: "Maryam Noor",
    email: "maryam.noor@example.com",
    program: "Ilm Foundations",
    semester: "Semester 2",
    format: "live-online",
    progress: 92,
    feeStatus: "Paid",
    attendance: "96%",
    enrolledDate: "2025-08-14",
  },
];

export const adminAllCourses = [
  {
    id: "crs_adm_01",
    title: "Tafsīr-ul-Qur'ān",
    category: "foundations",
    instructor: "Ustadh Khalil Ahmad",
    format: "live-online",
    enrolledCount: 142,
    capacity: 150,
    fee: "PKR 30,000",
    status: "Active",
    startDate: "2026-03-01",
  },
  {
    id: "crs_adm_02",
    title: "Fiqh — Acts of Worship",
    category: "foundations",
    instructor: "Sheikh Abdullah Nasir",
    format: "on-site",
    enrolledCount: 78,
    capacity: 80,
    fee: "PKR 30,000",
    status: "Active",
    startDate: "2026-03-01",
  },
  {
    id: "crs_adm_03",
    title: "Qur'ānic Arabic — Level 1",
    category: "foundations",
    instructor: "Ustadha Fatima Zahra",
    format: "live-online",
    enrolledCount: 115,
    capacity: 120,
    fee: "PKR 30,000",
    status: "Active",
    startDate: "2026-03-01",
  },
  {
    id: "crs_adm_04",
    title: "Purification of the Heart (Tazkiyah)",
    category: "intensives",
    instructor: "Sheikh Yasir Faheem",
    format: "self-paced",
    enrolledCount: 230,
    capacity: 500,
    fee: "PKR 12,000",
    status: "Active",
    startDate: "2026-02-15",
  },
  {
    id: "crs_adm_05",
    title: "The Prophetic Biography (Sīrah)",
    category: "intensives",
    instructor: "Dr. Tahir Mahmood",
    format: "live-online",
    enrolledCount: 95,
    capacity: 100,
    fee: "PKR 15,000",
    status: "Upcoming",
    startDate: "2026-11-10",
  },
  {
    id: "crs_adm_06",
    title: "Decoding Isms & Modern Ideologies",
    category: "intensives",
    instructor: "Raja Zia ul Haq",
    format: "on-site",
    enrolledCount: 65,
    capacity: 80,
    fee: "PKR 18,000",
    status: "Upcoming",
    startDate: "2026-12-01",
  },
];

