import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Library, Search, BookOpen, Download, ExternalLink, 
  BookMarked, ScrollText, FileText, Star, Filter 
} from 'lucide-react';
import Layout from '../components/layout/Layout';
import { getLibraryItems } from '../services/courseStorage';

/**
 * ELibrary Page — Digital library for course materials and Islamic texts.
 * Synchronized with Administrator e-Library Management in real-time.
 */

const typeIcons = {
  reference: BookMarked,
  textbook: BookOpen,
  'course-material': FileText,
};

export function ELibrary() {
  const [libraryList, setLibraryList] = useState(() => getLibraryItems());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  // Synchronize dynamically with Admin dashboard updates
  useEffect(() => {
    const handleUpdate = () => {
      setLibraryList(getLibraryItems());
    };

    window.addEventListener('ilm-library-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('ilm-library-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Compute dynamic category list from existing items
  const categories = useMemo(() => {
    const defaultCats = ['Tafsir', 'Hadith', 'Fiqh', 'Seerah', 'Arabic', 'Tazkiyah'];
    const dynamicCats = libraryList.map((i) => i.category).filter(Boolean);
    const combined = Array.from(new Set([...defaultCats, ...dynamicCats]));
    return ['All', ...combined];
  }, [libraryList]);

  const filteredItems = libraryList.filter((item) => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      item.title?.toLowerCase().includes(q) ||
      item.author?.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  const featuredItems = libraryList.filter((item) => item.featured);

  const handleDownload = (item) => {
    if (item.downloadUrl) {
      window.open(item.downloadUrl, '_blank', 'noopener,noreferrer');
    } else {
      alert(`Resource "${item.title}" is available for on-demand reading. Contact administration for direct PDF downloads.`);
    }
  };

  const handleReadOnline = (item) => {
    const targetUrl = item.externalUrl || item.downloadUrl;
    if (targetUrl) {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    } else {
      alert(`Online reading link for "${item.title}" will be made available shortly by faculty.`);
    }
  };

  return (
    <Layout>
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gold-100 rounded-xl flex items-center justify-center">
            <Library className="w-5 h-5 text-gold-700" />
          </div>
          <h1 className="font-heading text-3xl font-bold text-ink-900">Essentials e-Library</h1>
        </div>
        <p className="text-ink-500">Your digital collection of Islamic texts, course materials, and scholarly references</p>
      </div>

      {/* Featured Section */}
      {featuredItems.length > 0 && (
        <div className="mb-10">
          <h2 className="font-heading text-xl font-semibold text-ink-900 mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-gold-500" />
            Featured Texts
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {featuredItems.map((item, index) => {
              const TypeIcon = typeIcons[item.type] || BookOpen;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleReadOnline(item)}
                  className="bg-gradient-to-br from-primary-900 to-primary-800 rounded-2xl p-5 text-white
                             hover:shadow-elevated transition-shadow duration-300 cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-gold-500/20 rounded-lg flex items-center justify-center">
                      <TypeIcon className="w-5 h-5 text-gold-400" />
                    </div>
                    <span className="text-xs bg-gold-500/20 text-gold-300 px-2 py-1 rounded-full">
                      {item.category}
                    </span>
                  </div>
                  <h3 className="font-heading text-lg font-semibold mb-1 group-hover:text-gold-300 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-primary-200 text-sm mb-2">{item.author}</p>
                  <div className="flex items-center justify-between text-primary-300 text-xs">
                    <span>{item.pages > 0 ? `${item.pages} pages` : (item.fileSize || 'Digital Resource')}</span>
                    {item.language && <span>{item.language}</span>}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-ink-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, author, or description..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-sand-200 bg-white text-sm
                       placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 
                       focus:border-primary-500 transition-all"
          />
        </div>
        <div className="flex gap-1 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeCategory === cat
                  ? 'bg-primary-900 text-white'
                  : 'bg-white border border-sand-200 text-ink-600 hover:bg-sand-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Library Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredItems.map((item, index) => {
          const TypeIcon = typeIcons[item.type] || BookOpen;
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-xl border border-sand-200 p-5 
                         hover:shadow-soft hover:border-sand-300 transition-all duration-300 group"
            >
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-sand-100 rounded-xl flex items-center justify-center flex-shrink-0
                                group-hover:bg-primary-50 transition-colors">
                  <TypeIcon className="w-6 h-6 text-primary-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-heading text-base font-semibold text-ink-900 group-hover:text-primary-800 transition-colors">
                      {item.title}
                    </h3>
                    <span className="text-xs bg-sand-100 text-ink-600 px-2 py-1 rounded-full flex-shrink-0">
                      {item.category}
                    </span>
                  </div>
                  <p className="text-sm text-ink-500 mt-0.5">{item.author}</p>
                  <p className="text-sm text-ink-400 mt-2 line-clamp-2">{item.description}</p>
                  <div className="flex items-center gap-4 mt-3">
                    <span className="text-xs text-ink-400">{item.pages > 0 ? `${item.pages} pages` : item.fileSize}</span>
                    <button
                      onClick={() => handleDownload(item)}
                      className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-800 font-medium transition-colors cursor-pointer"
                    >
                      <Download className="w-3 h-3" />
                      Download
                    </button>
                    <button
                      onClick={() => handleReadOnline(item)}
                      className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-800 font-medium transition-colors cursor-pointer"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Read Online
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredItems.length === 0 && (
        <div className="text-center py-16">
          <ScrollText className="w-12 h-12 text-ink-300 mx-auto mb-4" />
          <h3 className="font-heading text-lg font-semibold text-ink-700 mb-2">No resources found</h3>
          <p className="text-ink-500 text-sm">Try a different search term or category.</p>
        </div>
      )}
    </Layout>
  );
}

export default ELibrary;
