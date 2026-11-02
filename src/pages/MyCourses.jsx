import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  BookOpen, Search, Filter, GraduationCap, Zap, 
  Clock, Users, MapPin, Video, PlayCircle, ChevronRight 
} from 'lucide-react';
import Layout from '../components/layout/Layout';
import { enrolledCourses, courseFormats } from '../data/mockData';

/**
 * MyCourses Page — Lists all enrolled courses with filtering.
 * Supports filtering by category (Foundations/Intensives) and format.
 * 
 * TODO: Connect to backend API for course listing
 * TODO: Add pagination for large course lists
 */
export function MyCourses() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // --- Filter courses ---
  const filteredCourses = enrolledCourses.filter((course) => {
    const matchesCategory = activeCategory === 'all' || course.category === activeCategory;
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          course.instructor.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // --- Format icon mapping ---
  const formatIcons = {
    'on-site': MapPin,
    'live-online': Video,
    'self-paced': PlayCircle,
  };

  const categories = [
    { id: 'all', label: 'All Courses', icon: BookOpen, count: enrolledCourses.length },
    { id: 'foundations', label: 'Ilm Foundations', icon: GraduationCap, count: enrolledCourses.filter(c => c.category === 'foundations').length },
    { id: 'intensives', label: 'Ilm Intensives', icon: Zap, count: enrolledCourses.filter(c => c.category === 'intensives').length },
  ];

  return (
    <Layout>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-ink-900 mb-2">My Courses</h1>
        <p className="text-ink-500">Track your progress across all enrolled programmes</p>
      </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-ink-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search courses..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-sand-200 bg-white text-sm
                         placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 
                         focus:border-primary-500 transition-all"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex gap-1 bg-white border border-sand-200 rounded-xl p-1">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeCategory === cat.id
                    ? 'bg-primary-900 text-white shadow-sm'
                    : 'text-ink-600 hover:bg-sand-100'
                }`}
              >
                <cat.icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{cat.label}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeCategory === cat.id ? 'bg-white/20' : 'bg-sand-100'
                }`}>
                  {cat.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Course Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course, index) => {
            const FormatIcon = formatIcons[course.format] || BookOpen;
            const format = courseFormats[course.format];

            return (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  to={`/course/${course.id}`}
                  className="block bg-white rounded-2xl border border-sand-200 overflow-hidden
                             hover:shadow-soft hover:border-sand-300 transition-all duration-300 group"
                >
                  {/* Course Color Banner */}
                  <div
                    className="h-2"
                    style={{ backgroundColor: course.color }}
                  />

                  <div className="p-5">
                    {/* Category & Format Badges */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold uppercase tracking-wider text-primary-600">
                        {course.category === 'foundations' ? 'Foundations' : 'Intensive'}
                      </span>
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${format?.color || 'bg-sand-100 text-ink-600'}`}>
                        <FormatIcon className="w-3 h-3" />
                        {format?.label || course.format}
                      </span>
                    </div>

                    {/* Title & Instructor */}
                    <h3 className="font-heading text-lg font-semibold text-ink-900 mb-1 group-hover:text-primary-800 transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-sm text-ink-500 mb-4">{course.instructor}</p>

                    {/* Progress */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-ink-500">{course.completedLessons}/{course.totalLessons} lessons</span>
                        <span className="font-semibold text-primary-700">{course.progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-sand-100 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-primary-600 to-primary-400"
                          initial={{ width: 0 }}
                          animate={{ width: `${course.progress}%` }}
                          transition={{ duration: 1, delay: index * 0.1 + 0.3 }}
                        />
                      </div>
                    </div>

                    {/* Continue Arrow */}
                    <div className="flex items-center justify-end mt-4 text-sm text-primary-600 font-medium 
                                    group-hover:text-primary-800 transition-colors">
                      Continue
                      <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredCourses.length === 0 && (
          <div className="text-center py-16">
            <BookOpen className="w-12 h-12 text-ink-300 mx-auto mb-4" />
            <h3 className="font-heading text-lg font-semibold text-ink-700 mb-2">No courses found</h3>
            <p className="text-ink-500 text-sm">Try adjusting your search or filter criteria.</p>
          </div>
        )}
    </Layout>
  );
}

export default MyCourses;
