import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import DeveloperCard from '../components/DeveloperCard';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { useToast } from '../context/ToastContext';
import { Flame, RefreshCw, Sparkles, Filter, ChevronRight } from 'lucide-react';

const FeedPage = () => {
  const [feed, setFeed] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedSkillFilter, setSelectedSkillFilter] = useState('All');
  const { showToast } = useToast();

  const fetchFeed = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/user/feed?page=1&limit=30');
      setFeed(response.data.data || []);
      setCurrentIndex(0);
    } catch (error) {
      showToast(error.message || 'Failed to fetch developer feed.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  // Handle request actions: status is 'interested' or 'ignored'
  const handleRequest = async (status) => {
    if (currentIndex >= feed.length || actionLoading) return;
    const targetUser = feed[currentIndex];

    setActionLoading(true);
    try {
      const response = await api.post(`/request/send/${status}/${targetUser._id}`);
      showToast(response.data.message || 'Action recorded!', status === 'interested' ? 'success' : 'info');
      // Advance to next card
      setCurrentIndex((prev) => prev + 1);
    } catch (error) {
      showToast(error.message || 'Action failed.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Keyboard navigation: Left Arrow for Pass, Right Arrow for Connect
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        handleRequest('ignored');
      } else if (e.key === 'ArrowRight') {
        handleRequest('interested');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, feed, actionLoading]);

  // Available filter skills from the feed
  const allSkills = Array.from(
    new Set(feed.flatMap((dev) => dev.skills || []))
  ).slice(0, 8);

  const filteredFeed = selectedSkillFilter === 'All'
    ? feed
    : feed.filter((dev) => dev.skills?.includes(selectedSkillFilter));

  const currentDev = filteredFeed[currentIndex];
  const remainingCount = Math.max(0, filteredFeed.length - currentIndex);

  if (loading) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center">
        <LoadingSpinner text="Finding talented developers in your area..." />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header with stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
            <Flame className="w-8 h-8 text-purple-500 fill-purple-500/20" />
            Developer Matchmaking
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Discover peer developers, match on shared tech stacks, and collaborate on real projects.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchFeed}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700 transition-all hover:scale-105 active:scale-95"
            title="Refresh feed"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Feed
          </button>
          {remainingCount > 0 && (
            <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
              {remainingCount} dev{remainingCount === 1 ? '' : 's'} in queue
            </span>
          )}
        </div>
      </div>

      {/* Skills quick filter bar */}
      {allSkills.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 text-xs no-scrollbar">
          <span className="text-slate-400 font-medium flex items-center gap-1 flex-shrink-0">
            <Filter className="w-3 h-3 text-purple-400" /> Filter:
          </span>
          <button
            onClick={() => {
              setSelectedSkillFilter('All');
              setCurrentIndex(0);
            }}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex-shrink-0 ${
              selectedSkillFilter === 'All'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            All
          </button>
          {allSkills.map((skill) => (
            <button
              key={skill}
              onClick={() => {
                setSelectedSkillFilter(skill);
                setCurrentIndex(0);
              }}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex-shrink-0 ${
                selectedSkillFilter === skill
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white'
              }`}
            >
              {skill}
            </button>
          ))}
        </div>
      )}

      {/* Main Tinder Card Deck Area */}
      {currentDev ? (
        <div className="flex flex-col items-center">
          <DeveloperCard
            developer={currentDev}
            onIgnore={() => handleRequest('ignored')}
            onInterested={() => handleRequest('interested')}
            isLoading={actionLoading}
          />

          {/* Keyboard instructions badge */}
          <div className="mt-8 flex items-center justify-center gap-6 text-xs text-slate-400 select-none">
            <span className="flex items-center gap-1.5">
              <kbd className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono">
                ←
              </kbd>
              Pass
            </span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono">
                →
              </kbd>
              Connect
            </span>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={Sparkles}
          title="You've reached the end of the feed!"
          description="You have reviewed all discoverable developers in your area for now. Check back as new developers join or invite your teammates!"
          actionLabel="Refresh Feed"
          onAction={fetchFeed}
        />
      )}
    </div>
  );
};

export default FeedPage;
