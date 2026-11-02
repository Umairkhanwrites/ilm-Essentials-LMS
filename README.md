# 📚 Ilm Essentials — Learning Management System (LMS)

Front-end web application for **Ilm Essentials** (`ilmessentials.pk`), an Islamic educational platform dedicated to classical Islamic education ("Structured path to divine knowledge").

---

## 🔑 Login Credentials

The platform includes two dedicated account types with pre-configured demo credentials:

| Portal | Role | Email | Password | Landing Page |
| :--- | :--- | :--- | :--- | :--- |
| **Student Learning Hub** | Student | `student@ilmessentials.pk` | `student123` | [`/dashboard`](http://localhost:5173/dashboard) |
| **Administration Portal** | Administrator | `admin@ilmessentials.pk` | `admin123` | [`/admin`](http://localhost:5173/admin) |

> 💡 **Tip**: When you open [http://localhost:5173/login](http://localhost:5173/login), you can switch between **Student** and **Admin** tabs, copy credentials with one click, or use the **Instant 1-Click Access** shortcut buttons.

---

## 🌟 Key Features & Pages

### 1. Student Dashboard (The Hub — `/dashboard`)
- **Personalized Greeting**: Welcoming header with date and daily rotating Hadith quote.
- **Quick Stats**: 4 metric cards (Enrolled Courses, Hours Learned, Assignments Due, Completed Lessons).
- **Progress Overview (Continue Learning)**: Visual progress bars with % completion and quick-resume buttons.
- **Course Pathways**: Categorized into:
  - **Ilm Foundations**: Flagship 8-month classical Islamic sciences certificate program.
  - **Ilm Intensives**: Focused masterclasses and short series.
- **Learning Formats**: Color-coded badges for **On-Site** (DHA Phase 6, Lahore), **Live Online** (Google Meet / Zoom), and **Self-Paced**.
- **Upcoming Schedule**: Next live sessions with direct "Join Session" actions.

### 2. Individual Course Interface (Learning Environment — `/course/:id`)
- **Theater-Mode Media Player**: Custom controls (play/pause, volume, speed cycle 1x/1.5x/2x, fullscreen, theater toggle) with "LIVE" badge indicator.
- **Curriculum Sidebar**: Collapsible syllabus tree with accordion modules, lesson type icons (video, reading, assessment), and completion checkboxes. Responsive mobile drawer.
- **Tabs**:
  - **Overview**: Course description, syllabus learning objectives, and instructor biography card.
  - **Resources**: Downloadable lecture slides, notes, PDFs, and quick links to the *Essentials e-Library*.
  - **Community & Q&A**: Threaded discussion forum with upvotes, instructor verification badges, and "Ask a Question" composer.

### 3. Administrator Portal (`/admin`)
- **KPI Metrics**: Total Enrolled Students (1,248), Active Courses (14), Pending Applications (38), and Tuition Revenue (PKR 3.4M).
- **Course Management**: Filter between *Ilm Foundations* and *Ilm Intensives*, view enrollment vs capacity, and launch the **"Create New Course"** modal to publish courses.
- **Student Roster**: Searchable student table displaying enrolled tracks, curriculum progress %, attendance rate, and interactive **Fee Status toggling** (Paid / Pending).
- **Admissions & Review**: Review applicant education, qualifications, and actions to *Schedule Interview* or *Approve & Enroll*.
- **Class Schedule Planner**: Timetable for live Google Meet sessions and DHA Phase 6 Lahore on-campus lectures.
- **Seamless Switcher**: Includes an **"Exit to Student View"** button to toggle back to the student experience at any time.

### 4. My Courses Catalog (`/courses`)
- Search by course title or instructor.
- Category filtering (`All`, `Ilm Foundations`, `Ilm Intensives`).
- Visual progress bar cards with format badges and quick navigation.

### 5. Essentials e-Library (`/library`)
- Digital library showcasing classical Islamic texts (Tafsir Ibn Kathir, Riyadh-us-Saliheen, The Sealed Nectar, Fiqh textbooks).
- Filter by discipline (Tafsir, Hadith, Fiqh, Seerah, Arabic, Tazkiyah).
- Download and read online actions.

### 6. Branded Authentication (`/login` & `/signup`)
- Split-screen layout featuring official brand identity.
- Toggle between **Student Account** and **Administrator Portal** login.
- Pre-filled demo credentials and 1-click test buttons.

---

## 🎨 Design System & Palette

- **Primary Brand (Islamic Emerald)**:
  - `primary-950`: `#062A1F`
  - `primary-900`: `#0A3D2E`
  - `primary-800`: `#155E3D`
  - `primary-500`: `#1A7A4E`
  - `primary-50`: `#E8F5EE`
- **Accent (Scholarly Gold)**:
  - `gold-500`: `#C8A951`
  - `gold-400`: `#D4B96A`
  - `gold-50`: `#FDF8EB`
- **Backgrounds (Warm Sand)**:
  - `sand-50`: `#FAF8F5`
  - `sand-100`: `#F3EFE8`
  - `sand-200`: `#E8E0D4`
- **Typography**:
  - Headings: `Plus Jakarta Sans` (clean, contemporary sans-serif)
  - Body: `Inter` (readable, accessible sans-serif)

---

## 🚀 Getting Started

### Run in Development
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production
```bash
npm run build
```
