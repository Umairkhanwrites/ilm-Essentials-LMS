// scripts/seed-supabase.js
// Seeds Supabase PostgreSQL database with initial academic catalog, instructors, users, timetable, and billing.

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local
const envPath = path.resolve(__dirname, '../.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');
const env = Object.fromEntries(
  envFile
    .split('\n')
    .filter((l) => l.trim() && !l.startsWith('#') && l.includes('='))
    .map((l) => {
      const idx = l.indexOf('=');
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
    })
);

const supabaseUrl = env.VITE_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Import mock data directly (does not load browser/Vite dependencies)
import {
  adminInstructorsList,
  adminAllCourses,
  adminStudentsList,
  courseDetailsMap,
  initialScheduleSlots,
  initialFeeInstallments,
  dailyQuotes,
  demoCredentials,
} from '../src/data/mockData.js';

async function seed() {
  console.log('🚀 Starting Supabase PostgreSQL Seeding...\n');

  // -------------------------------------------------------------
  // 1. Academic Pathways
  // -------------------------------------------------------------
  console.log('📌 Seeding Academic Pathways...');
  const pathwaysData = [
    {
      id: 'foundations',
      slug: 'foundations',
      name: 'Ilm Foundations',
      subtitle: '8-Month Flagship Certificate Programme',
      description: 'Flagship foundational curriculum across 2 structured semesters covering Tafsir, Hadith, Fiqh, and Arabic.',
      type: 'cohort',
      duration: '2 Semesters (Duration varies by course)',
      semesters: 2,
      tuition_model: 'bundled',
      default_tuition_fee: 30000,
      color: 'emerald',
      icon: 'GraduationCap',
    },
    {
      id: 'intensives',
      slug: 'intensives',
      name: 'Ilm Intensives',
      subtitle: 'Weekend Masterclasses & Short Courses Collection',
      description: 'Non-semester modular program. Houses multiple individual standalone courses and masterclasses.',
      type: 'modular',
      duration: 'Duration varies by course',
      semesters: 1,
      tuition_model: 'per_course',
      default_tuition_fee: 12000,
      color: 'gold',
      icon: 'Zap',
    },
    {
      id: 'electives',
      slug: 'electives',
      name: 'Electives & Classical Languages',
      subtitle: 'Specialized Grammar, Nahw & Sarf Electives',
      description: 'Non-semester language collection exploring classical Arabic morphology, syntax, and literary rhetoric.',
      type: 'modular',
      duration: 'Duration varies by course',
      semesters: 1,
      tuition_model: 'per_course',
      default_tuition_fee: 15000,
      color: 'purple',
      icon: 'BookOpen',
    },
  ];

  const { error: errPathways } = await supabase.from('pathways').upsert(pathwaysData, { onConflict: 'id' });
  if (errPathways) throw new Error(`Pathways error: ${errPathways.message}`);
  console.log(`✅ Seeded ${pathwaysData.length} pathways.`);

  // -------------------------------------------------------------
  // 1.1 Academic Batches / Intakes
  // -------------------------------------------------------------
  console.log('📌 Seeding Academic Batches / Intakes...');
  const batchesData = [
    {
      id: 'foundations_sem1',
      pathway_id: 'foundations',
      name: 'Ilm Foundations — Fall 2026 (Semester 1)',
      start_date: '2026-09-01',
      end_date: '2027-01-31',
      tuition_fee: 30000,
      status: 'active',
    },
    {
      id: 'cohort_2026',
      pathway_id: 'foundations',
      name: 'General Student Cohort 2026',
      start_date: '2026-09-01',
      end_date: '2027-06-30',
      tuition_fee: 30000,
      status: 'active',
    },
    {
      id: 'admin_staff',
      pathway_id: 'foundations',
      name: 'Administrative Faculty & Staff Cohort',
      start_date: '2026-01-01',
      end_date: '2030-12-31',
      tuition_fee: 0,
      status: 'archived',
    },
    {
      id: 'faculty_staff',
      pathway_id: 'foundations',
      name: 'Academic Faculty Instructors Cohort',
      start_date: '2026-01-01',
      end_date: '2030-12-31',
      tuition_fee: 0,
      status: 'archived',
    },
  ];

  const { error: errBatches } = await supabase.from('batches').upsert(batchesData, { onConflict: 'id' });
  if (errBatches) throw new Error(`Batches error: ${errBatches.message}`);
  console.log(`✅ Seeded ${batchesData.length} batches.`);

  // -------------------------------------------------------------
  // 2. Instructors Directory
  // -------------------------------------------------------------
  console.log('📌 Seeding Instructors Directory...');
  const instructorsData = [
    ...adminInstructorsList.map((inst) => ({
      id: inst.id,
      name: inst.name,
      title: inst.title || 'Instructor',
      specialization: inst.specialization || '',
      bio: inst.bio || '',
      email: inst.email,
      phone: inst.phone,
      avatar_url: inst.avatar,
      status: inst.status === 'Active' ? 'Active' : 'On Leave',
    })),
    {
      id: 'inst_008',
      name: 'Raja Zia ul Haq',
      title: 'Visiting Lecturer & Thought Leader',
      specialization: 'Contemporary Ideologies, Youth Mentorship & Islamic Worldview',
      bio: 'Renowned motivational speaker and lecturer addressing modern philosophies and existential questions.',
      email: 'raja.zia@ilmessentials.pk',
      phone: '+92 300 1234567',
      avatar_url: '/images/instructors/raja-zia-ul-haq.png',
      status: 'Active',
    },
  ];

  const { error: errInstructors } = await supabase.from('instructors').upsert(instructorsData, { onConflict: 'id' });
  if (errInstructors) throw new Error(`Instructors error: ${errInstructors.message}`);
  console.log(`✅ Seeded ${instructorsData.length} instructors.`);

  // -------------------------------------------------------------
  // 3. Auth Users & Students
  // -------------------------------------------------------------
  console.log('📌 Seeding Auth Users and Student Profiles...');
  const existingUsersRes = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const existingUsers = existingUsersRes.data?.users || [];
  const userMap = new Map(); // email -> auth.user
  for (const u of existingUsers) {
    userMap.set(u.email.toLowerCase(), u);
  }

  // Pre-seed Admin User
  const demoUsersToCreate = [
    {
      email: demoCredentials.admin.email.toLowerCase(),
      password: demoCredentials.admin.password,
      name: demoCredentials.admin.name,
      role: 'admin',
      format: 'hybrid',
      cohort_id: 'admin_staff',
    },
    {
      email: demoCredentials.student.email.toLowerCase(),
      password: demoCredentials.student.password,
      name: demoCredentials.student.name,
      role: 'student',
      format: 'online',
      cohort_id: 'foundations_sem1',
    },
    {
      email: demoCredentials.instructor.email.toLowerCase(),
      password: demoCredentials.instructor.password,
      name: demoCredentials.instructor.name,
      role: 'instructor',
      format: 'hybrid',
      cohort_id: 'faculty_staff',
    },
  ];

  // Also include students from adminStudentsList
  adminStudentsList.forEach((std) => {
    if (!demoUsersToCreate.some((u) => u.email === std.email.toLowerCase())) {
      demoUsersToCreate.push({
        email: std.email.toLowerCase(),
        password: std.password || 'password123',
        name: std.name,
        role: 'student',
        format: std.format === 'onsite' ? 'onsite' : 'online',
        cohort_id: std.program?.toLowerCase().includes('foundation') ? 'foundations_sem1' : 'cohort_2026',
      });
    }
  });

  const studentsToInsert = [];

  for (const userSpec of demoUsersToCreate) {
    let authUser = userMap.get(userSpec.email);
    if (!authUser) {
      const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
        email: userSpec.email,
        password: userSpec.password,
        email_confirm: true,
        user_metadata: { name: userSpec.name },
        app_metadata: { role: userSpec.role },
      });
      if (createErr) {
        console.warn(`Could not create auth user ${userSpec.email}:`, createErr.message);
        continue;
      }
      authUser = newUser.user;
      userMap.set(userSpec.email, authUser);
    }

    studentsToInsert.push({
      id: authUser.id,
      email: userSpec.email,
      name: userSpec.name,
      phone: '+92 300 0000000',
      role: userSpec.role,
      cohort_id: userSpec.cohort_id,
      format: userSpec.format,
      is_video_restricted: false,
    });
  }

  const { error: errStudents } = await supabase.from('students').upsert(studentsToInsert, { onConflict: 'id' });
  if (errStudents) throw new Error(`Students profile error: ${errStudents.message}`);
  console.log(`✅ Seeded ${studentsToInsert.length} students/users (including Admin and Primary Student).`);

  // -------------------------------------------------------------
  // 4. Courses
  // -------------------------------------------------------------
  console.log('📌 Seeding Courses...');
  // Helper to map instructor
  const findInstructorId = (name) => {
    const trimmed = (name || '').trim().toLowerCase();
    if (trimmed.includes('mutee')) return 'inst_001';
    if (trimmed.includes('salman')) return 'inst_002';
    if (trimmed.includes('zubair')) return 'inst_003';
    if (trimmed.includes('hamid')) return 'inst_004';
    if (trimmed.includes('ahmed khan')) return 'inst_005';
    if (trimmed.includes('saeed')) return 'inst_006';
    if (trimmed.includes('muhammad ali')) return 'inst_007';
    if (trimmed.includes('raja zia')) return 'inst_008';
    return 'inst_001';
  };

  const coursesData = adminAllCourses.map((c) => {
    let format = 'online';
    if (c.format === 'on-site' || c.classCategory === 'onsite') format = 'onsite';
    else if (c.format === 'hybrid') format = 'hybrid';

    let pathwayId = 'foundations';
    if (c.category === 'intensives' || c.id.startsWith('crs_20') || c.id.startsWith('crs_adm')) pathwayId = 'intensives';
    else if (c.category === 'electives') pathwayId = 'electives';

    const tuitionFee = typeof c.fee === 'number' ? c.fee : parseInt(String(c.fee).replace(/[^0-9]/g, ''), 10) || 0;

    return {
      id: c.id,
      pathway_id: pathwayId,
      instructor_id: findInstructorId(c.instructor),
      title: c.title,
      slug: c.id.toLowerCase().replace(/_/g, '-'),
      description: c.subtitle || `${c.title} course at Ilm Essentials`,
      format: format,
      level: 'Beginner',
      tuition_fee: tuitionFee,
      status: c.status?.toLowerCase() === 'upcoming' ? 'upcoming' : 'active',
    };
  });

  const { error: errCourses } = await supabase.from('courses').upsert(coursesData, { onConflict: 'id' });
  if (errCourses) throw new Error(`Courses error: ${errCourses.message}`);
  console.log(`✅ Seeded ${coursesData.length} courses.`);

  // -------------------------------------------------------------
  // 5. Enrollments (Primary Student & Foundations Cohort)
  // -------------------------------------------------------------
  console.log('📌 Seeding Enrollments...');
  const primaryStudent = userMap.get(demoCredentials.student.email.toLowerCase());
  const enrollmentsData = [];

  if (primaryStudent) {
    // Enroll primary student in all foundations courses
    coursesData.forEach((course) => {
      enrollmentsData.push({
        student_id: primaryStudent.id,
        course_id: course.id,
        pathway_id: course.pathway_id,
        cohort_id: 'foundations_sem1',
        status: 'active',
      });
    });
  }

  // Also enroll a few other students in crs_found_01 and crs_found_02
  for (const std of studentsToInsert.slice(0, 5)) {
    if (std.id !== primaryStudent?.id && std.role === 'student') {
      enrollmentsData.push({
        student_id: std.id,
        course_id: 'crs_found_01',
        pathway_id: 'foundations',
        cohort_id: std.cohort_id || 'foundations_sem1',
        status: 'active',
      });
      enrollmentsData.push({
        student_id: std.id,
        course_id: 'crs_found_02',
        pathway_id: 'foundations',
        cohort_id: std.cohort_id || 'foundations_sem1',
        status: 'active',
      });
    }
  }

  const { error: errEnrollments } = await supabase.from('enrollments').upsert(enrollmentsData, { onConflict: 'student_id,course_id,cohort_id' });
  if (errEnrollments) throw new Error(`Enrollments error: ${errEnrollments.message}`);
  console.log(`✅ Seeded ${enrollmentsData.length} student course enrollments.`);

  // -------------------------------------------------------------
  // 6. Curriculum Modules & Lessons
  // -------------------------------------------------------------
  console.log('📌 Seeding Curriculum Modules and Lessons...');
  // Wipe existing modules for clean sync
  await supabase.from('modules').delete().neq('title', '__NEVER_MATCH__');

  let totalModulesCount = 0;
  let totalLessonsCount = 0;

  for (const [courseId, detail] of Object.entries(courseDetailsMap)) {
    // Check if course exists in courses table
    const courseMatch = coursesData.find((c) => c.id === courseId);
    if (!courseMatch || !Array.isArray(detail.modules)) continue;

    for (let mIdx = 0; mIdx < detail.modules.length; mIdx++) {
      const mod = detail.modules[mIdx];
      const { data: insertedModule, error: modErr } = await supabase
        .from('modules')
        .insert({
          course_id: courseId,
          title: mod.title || `Module ${mIdx + 1}`,
          display_order: mIdx + 1,
        })
        .select()
        .single();

      if (modErr) {
        console.warn(`Module insert error for course ${courseId}:`, modErr.message);
        continue;
      }

      totalModulesCount++;

      if (Array.isArray(mod.lessons)) {
        const lessonsToInsert = mod.lessons.map((les, lIdx) => {
          // Parse duration "1 hr 9 min" -> 69
          let durationMinutes = 45;
          if (les.duration) {
            const hrMatch = les.duration.match(/(\d+)\s*hr/i);
            const minMatch = les.duration.match(/(\d+)\s*min/i);
            const hrs = hrMatch ? parseInt(hrMatch[1], 10) : 0;
            const mins = minMatch ? parseInt(minMatch[1], 10) : 0;
            durationMinutes = hrs * 60 + mins || 45;
          }

          // Extract Bunny Library ID & Video GUID from URL
          // URL: https://player.mediadelivery.net/embed/800731/2a2261bc-2af4-4e69-8b85-50097d00053d?autoplay=...
          let libId = '800132';
          let guid = 'a958d9df-cdaf-4316-9ef1-d61fd774bb11';
          if (les.videoUrl) {
            const urlMatch = les.videoUrl.match(/embed\/(\d+)\/([a-zA-Z0-9-]+)/);
            if (urlMatch) {
              libId = urlMatch[1];
              guid = urlMatch[2];
            }
          }

          return {
            module_id: insertedModule.id,
            title: les.title || `Lesson ${lIdx + 1}`,
            display_order: les.lessonNumber || lIdx + 1,
            duration_minutes: durationMinutes,
            bunny_library_id: libId,
            bunny_video_guid: guid,
            reading_notes: les.readingNotes || `Notes and study materials for ${les.title}`,
          };
        });

        const { error: lesErr } = await supabase.from('lessons').insert(lessonsToInsert);
        if (lesErr) {
          console.warn(`Lessons insert error for module ${insertedModule.id}:`, lesErr.message);
        } else {
          totalLessonsCount += lessonsToInsert.length;
        }
      }
    }
  }

  console.log(`✅ Seeded ${totalModulesCount} curriculum modules and ${totalLessonsCount} lessons.`);

  // -------------------------------------------------------------
  // 7. Schedule Slots (Timetable)
  // -------------------------------------------------------------
  console.log('📌 Seeding Timetable Schedule Slots...');
  await supabase.from('schedule_slots').delete().neq('course_id', '__NEVER_MATCH__');

  const slotsData = initialScheduleSlots.map((slot) => ({
    course_id: slot.courseId,
    instructor_id: slot.instructorId,
    cohort_id: slot.cohortId,
    day_of_week: slot.dayOfWeek,
    start_time: slot.startTime.length === 5 ? `${slot.startTime}:00` : slot.startTime,
    end_time: slot.endTime.length === 5 ? `${slot.endTime}:00` : slot.endTime,
    modality: slot.modality === 'onsite_campus' ? 'onsite_campus' : slot.modality === 'hybrid' ? 'hybrid' : 'online_meet',
    campus_room: slot.campusRoom || '',
    meet_link: slot.meetLink || 'https://meet.google.com/cbh-ywhg-upu',
    status: slot.status === 'cancelled' ? 'cancelled' : 'active',
  }));

  const { error: errSlots } = await supabase.from('schedule_slots').insert(slotsData);
  if (errSlots) throw new Error(`Schedule slots error: ${errSlots.message}`);
  console.log(`✅ Seeded ${slotsData.length} schedule slots.`);

  // -------------------------------------------------------------
  // 8. Financial Invoices & Installments
  // -------------------------------------------------------------
  console.log('📌 Seeding Financial Ledgers (Invoices & Installments)...');
  if (primaryStudent) {
    // Create master invoice for Primary Student
    const invoiceRecord = {
      invoice_no: 'INV-2026-001',
      student_id: primaryStudent.id,
      pathway_id: 'foundations',
      cohort_id: 'foundations_sem1',
      base_fee: 30000,
      discount_amount: 0,
      net_payable: 30000,
      paid_amount: 15000,
      status: 'Partial',
      due_date: '2026-12-15',
    };

    const { data: insertedInvoice, error: invErr } = await supabase
      .from('invoices')
      .upsert(invoiceRecord, { onConflict: 'invoice_no' })
      .select()
      .single();

    if (invErr) {
      console.warn('Invoice upsert warning:', invErr.message);
    } else {
      // Create fee installments linked to this invoice
      const installmentsData = [
        {
          invoice_id: insertedInvoice.id,
          challan_no: '23528335',
          student_id: primaryStudent.id,
          title: 'Installment 1 — Registration & Tuition',
          amount: 15000,
          due_date: '2026-10-15',
          status: 'APPROVED',
          receipt_image_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
          approved_by: 'Faculty Administrator',
          approved_at: new Date().toISOString(),
        },
        {
          invoice_id: insertedInvoice.id,
          challan_no: '23523587',
          student_id: primaryStudent.id,
          title: 'Installment 2 — Mid-Term Tuition',
          amount: 15000,
          due_date: '2026-12-15',
          status: 'UNPAID',
        },
      ];

      const { error: instErr } = await supabase.from('fee_installments').upsert(installmentsData, { onConflict: 'challan_no' });
      if (instErr) {
        console.warn('Installments warning:', instErr.message);
      } else {
        console.log(`✅ Seeded Master Invoice INV-2026-001 and ${installmentsData.length} installments.`);
      }
    }
  }

  // -------------------------------------------------------------
  // 9. Daily Quotes & Wisdom Engine
  // -------------------------------------------------------------
  console.log('📌 Seeding Daily Quotes...');
  const quotesData = dailyQuotes.map((q, idx) => ({
    text: q.text,
    source: q.source,
    type: q.type === 'quran' ? 'quran' : 'hadith',
    pinned: idx === 0,
    active: true,
  }));

  const { error: quotesErr } = await supabase.from('daily_quotes').insert(quotesData);
  if (quotesErr) {
    console.warn('Quotes insert warning:', quotesErr.message);
  } else {
    console.log(`✅ Seeded ${quotesData.length} daily quotes.`);
  }

  // -------------------------------------------------------------
  // 10. e-Library Initial Items
  // -------------------------------------------------------------
  console.log('📌 Seeding e-Library Items...');
  const libraryData = [
    {
      title: 'Al-Fiqh Al-Muyassar (Simplified Jurisprudence)',
      title_arabic: 'الفقه الميسر في ضوء الكتاب والسنة',
      author: 'Group of Prominent Scholars',
      category: 'Fiqh',
      type: 'textbook',
      language: 'Arabic / Urdu',
      pages: 420,
      storage_path: 'catalog/al-fiqh-al-muyassar.pdf',
      file_size_bytes: 18450000,
      is_download_allowed: true,
      featured: true,
      status: 'published',
    },
    {
      title: 'Taysir al-Karim al-Rahman fi Tafsir Kalam al-Mannan',
      title_arabic: 'تيسير الكريم الرحمن في تفسير كلام المنان',
      author: 'Shaykh Abd al-Rahman al-Sa’di',
      category: 'Tafsir',
      type: 'reference',
      language: 'Arabic / English',
      pages: 980,
      storage_path: 'catalog/tafsir-as-sadi.pdf',
      file_size_bytes: 35200000,
      is_download_allowed: true,
      featured: true,
      status: 'published',
    },
    {
      title: 'Matn al-Ajrumiyyah (Grammar Primer)',
      title_arabic: 'متن الآجرومية في قواعد الإعراب',
      author: 'Ibn Adjurrum',
      category: 'Arabic Language',
      type: 'primary_source',
      language: 'Arabic',
      pages: 64,
      storage_path: 'catalog/matn-al-ajrumiyyah.pdf',
      file_size_bytes: 4200000,
      is_download_allowed: true,
      featured: false,
      status: 'published',
    },
  ];

  const { error: libErr } = await supabase.from('library_items').insert(libraryData);
  if (libErr) {
    console.warn('Library items warning:', libErr.message);
  } else {
    console.log(`✅ Seeded ${libraryData.length} e-Library books.`);
  }

  console.log('\n🎉 ALL TABLES SEEDED SUCCESSFULLY IN SUPABASE POSTGRESQL!\n');
}

seed().catch((err) => {
  console.error('Fatal seed failure:', err);
  process.exit(1);
});
