import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { useToast } from '../context/ToastContext';
import { Users, Mail, Copy, Check, Search, Calendar, Sparkles, MessageSquare } from 'lucide-react';

const ConnectionsPage = () => {
  const navigate = useNavigate();
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedEmail, setCopiedEmail] = useState(null);
  const { showToast } = useToast();

  const fetchConnections = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/user/connections');
      setConnections(response.data.data || []);
    } catch (error) {
      showToast(error.message || 'Failed to fetch connections.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  const copyToClipboard = (email) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    showToast(`Copied ${email} to clipboard!`, 'info');
    setTimeout(() => setCopiedEmail(null), 2500);
  };

  const filteredConnections = connections.filter((conn) => {
    const fullName = `${conn.firstName || ''} ${conn.lastName || ''}`.toLowerCase();
    const skills = (conn.skills || []).join(' ').toLowerCase();
    const about = (conn.about || '').toLowerCase();
    const query = searchTerm.toLowerCase();
    return fullName.includes(query) || skills.includes(query) || about.includes(query);
  });

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <LoadingSpinner text="Loading your developer network..." />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
            <Users className="w-8 h-8 text-purple-400" />
            My Developer Network
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Developers you have connected with on DevConnect. Reach out to collaborate!
          </p>
        </div>

        <span className="self-start sm:self-auto px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          {connections.length} Connected Peer{connections.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Search Bar */}
      {connections.length > 0 && (
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search connections by name, bio, or tech stack (e.g., React, Python, AWS)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-2xl glass-panel border border-slate-700/80 focus:border-purple-500 focus:outline-none text-sm text-white placeholder-slate-400 transition-all"
          />
        </div>
      )}

      {/* Connections Grid */}
      {filteredConnections.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredConnections.map((conn) => {
            const formattedDate = conn.connectedSince
              ? new Date(conn.connectedSince).toLocaleDateString(undefined, {
                  month: 'short',
                  year: 'numeric',
                })
              : 'Recent';

            return (
              <div
                key={conn._id}
                className="glass-panel rounded-2xl p-5 border border-slate-700/70 hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-500/5 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start gap-4 mb-4">
                    <img
                      src={conn.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}
                      alt={conn.firstName}
                      className="w-16 h-16 rounded-2xl object-cover ring-2 ring-emerald-500/40 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-white truncate">
                        {conn.firstName} {conn.lastName}
                      </h3>
                      {conn.age && (
                        <p className="text-xs text-slate-400">
                          {conn.age} yrs {conn.gender ? `• ${conn.gender}` : ''}
                        </p>
                      )}
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1">
                        <Calendar className="w-3 h-3 text-emerald-400" />
                        <span>Connected {formattedDate}</span>
                      </div>
                    </div>
                  </div>

                  {conn.about && (
                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed mb-4">
                      {conn.about}
                    </p>
                  )}

                  {conn.skills && conn.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {conn.skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Contact Actions */}
                <div className="pt-4 border-t border-slate-800/80 flex items-center gap-2">
                  <button
                    onClick={() => navigate('/chat', { state: { recipientId: conn._id } })}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Chat
                  </button>

                  <a
                    href={`mailto:${conn.emailId}?subject=DevConnect Collaboration`}
                    className="flex items-center justify-center gap-1 py-2 px-3 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition-all"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Email
                  </a>

                  {conn.emailId && (
                    <button
                      onClick={() => copyToClipboard(conn.emailId)}
                      className="p-2 rounded-xl text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition-all"
                      title="Copy email address"
                    >
                      {copiedEmail === conn.emailId ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : connections.length > 0 ? (
        <EmptyState
          icon={Search}
          title="No connections match your search"
          description={`No developers in your connections matched "${searchTerm}". Try a different name or technology keyword.`}
          actionLabel="Clear Search"
          onAction={() => setSearchTerm('')}
        />
      ) : (
        <EmptyState
          icon={Users}
          title="No connections yet"
          description="Browse the matchmaking feed, swipe right or click connect on developers you'd like to build with!"
          actionLabel="Go to Feed"
          onAction={() => window.location.href = '/'}
        />
      )}
    </div>
  );
};

export default ConnectionsPage;
