import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { UserCheck, Check, X, Clock, Sparkles } from 'lucide-react';

const RequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const { refreshPendingCount } = useAuth();
  const { showToast } = useToast();

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/user/requests/received');
      setRequests(response.data.data || []);
      await refreshPendingCount();
    } catch (error) {
      showToast(error.message || 'Failed to load received requests.', 'error');
    } finally {
      setLoading(false);
    }
  }, [refreshPendingCount, showToast]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleReview = async (requestId, status) => {
    setProcessingId(requestId);
    try {
      const response = await api.post(`/request/review/${status}/${requestId}`);
      showToast(response.data.message || `Request ${status}!`, status === 'accepted' ? 'success' : 'info');

      // Remove from pending list
      setRequests((prev) => prev.filter((req) => req._id !== requestId));
      await refreshPendingCount();
    } catch (error) {
      showToast(error.message || `Failed to ${status} request.`, 'error');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <LoadingSpinner text="Loading your received connection requests..." />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
            <UserCheck className="w-8 h-8 text-purple-400" />
            Received Connection Requests
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Developers who saw your profile and want to connect with you.
          </p>
        </div>

        <span className="self-start sm:self-auto px-3.5 py-1.5 rounded-full text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30">
          {requests.length} Pending
        </span>
      </div>

      {/* Requests List */}
      {requests.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {requests.map((request) => {
            const sender = request.fromUserId;
            if (!sender) return null;

            const isProcessing = processingId === request._id;
            const formattedDate = new Date(request.createdAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });

            return (
              <div
                key={request._id}
                className="glass-panel rounded-2xl p-5 border border-slate-700/70 hover:border-purple-500/40 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start gap-4">
                    <img
                      src={sender.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}
                      alt={sender.firstName}
                      className="w-16 h-16 rounded-2xl object-cover ring-2 ring-purple-500/40 flex-shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <h3 className="text-lg font-bold text-white truncate">
                          {sender.firstName} {sender.lastName}
                        </h3>
                        {sender.age && (
                          <span className="text-xs font-semibold text-slate-400">
                            {sender.age} yrs
                          </span>
                        )}
                      </div>

                      {sender.gender && (
                        <span className="inline-block text-[11px] font-medium text-purple-300 capitalize mb-1">
                          {sender.gender}
                        </span>
                      )}

                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>Requested {formattedDate}</span>
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  {sender.about && (
                    <p className="text-xs text-slate-300 mt-3 line-clamp-2 leading-relaxed">
                      "{sender.about}"
                    </p>
                  )}

                  {/* Skills */}
                  {sender.skills && sender.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {sender.skills.slice(0, 5).map((skill, index) => (
                        <span
                          key={index}
                          className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20"
                        >
                          {skill}
                        </span>
                      ))}
                      {sender.skills.length > 5 && (
                        <span className="text-[10px] text-slate-400 self-center">
                          +{sender.skills.length - 5} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-5 mt-4 border-t border-slate-800">
                  <button
                    onClick={() => handleReview(request._id, 'rejected')}
                    disabled={isProcessing}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-semibold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                    Reject
                  </button>

                  <button
                    onClick={() => handleReview(request._id, 'accepted')}
                    disabled={isProcessing}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 shadow-md shadow-purple-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    Accept Connection
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={UserCheck}
          title="No pending requests"
          description="When other developers find your profile on DevConnect and want to connect, their invitations will appear right here."
        />
      )}
    </div>
  );
};

export default RequestsPage;
