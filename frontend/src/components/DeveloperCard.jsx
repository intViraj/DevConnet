import React from 'react';
import { X, Heart, Sparkles, MapPin, Briefcase } from 'lucide-react';

const DeveloperCard = ({
  developer,
  onIgnore,
  onInterested,
  isLoading = false,
  showActions = true,
}) => {
  if (!developer) return null;

  const {
    firstName = 'Developer',
    lastName = '',
    photoUrl,
    age,
    gender,
    about = 'Passionate developer ready to build great software together!',
    skills = [],
  } = developer;

  const fullName = `${firstName} ${lastName}`.trim();
  const avatar = photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80';

  return (
    <div className="relative w-full max-w-md mx-auto rounded-3xl overflow-hidden glass-panel border border-slate-700/80 shadow-2xl transition-all duration-300">
      {/* Photo with Overlay */}
      <div className="relative h-96 w-full overflow-hidden bg-slate-900">
        <img
          src={avatar}
          alt={fullName}
          className="w-full h-full object-cover object-center transition-transform duration-500 hover:scale-105"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-900/80 backdrop-blur-md text-emerald-400 border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Open for Connections
          </span>
          {gender && (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-900/80 backdrop-blur-md text-purple-300 border border-purple-500/30 capitalize">
              {gender}
            </span>
          )}
        </div>

        {/* Bottom Details on Image */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-baseline gap-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-md">
              {fullName}
            </h2>
            {age && (
              <span className="text-xl font-medium text-slate-300">
                {age}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="p-6 space-y-4 bg-slate-900/60">
        {/* About Bio */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            About
          </h4>
          <p className="text-sm text-slate-300 leading-relaxed line-clamp-3">
            {about}
          </p>
        </div>

        {/* Skills */}
        {skills && skills.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Tech Stack & Skills
            </h4>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
              {skills.map((skill, index) => (
                <span
                  key={index}
                  className="px-2.5 py-1 text-xs font-medium rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/20 hover:border-purple-400/40 transition-colors"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tinder Swipe Action Buttons */}
        {showActions && (
          <div className="pt-2 flex items-center justify-center gap-8">
            {/* Ignore / Pass Button */}
            <button
              onClick={onIgnore}
              disabled={isLoading}
              className="group relative flex items-center justify-center w-16 h-16 rounded-full bg-slate-800/90 hover:bg-rose-500/20 text-rose-400 border-2 border-rose-500/30 hover:border-rose-500 transition-all duration-200 shadow-xl hover:scale-110 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
              title="Pass / Ignore"
              aria-label="Pass / Ignore"
            >
              <X className="w-8 h-8 group-hover:scale-110 transition-transform" />
              <span className="absolute -bottom-6 text-[11px] font-semibold text-slate-400 group-hover:text-rose-400 transition-colors">
                Pass
              </span>
            </button>

            {/* Connect / Interested Button */}
            <button
              onClick={onInterested}
              disabled={isLoading}
              className="group relative flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white border-2 border-white/20 transition-all duration-200 shadow-xl shadow-purple-600/30 hover:scale-110 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
              title="Connect / Interested"
              aria-label="Connect / Interested"
            >
              <Heart className="w-8 h-8 fill-white/20 group-hover:fill-white group-hover:scale-110 transition-transform" />
              <span className="absolute -bottom-6 text-[11px] font-semibold text-slate-400 group-hover:text-pink-400 transition-colors">
                Connect
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeveloperCard;
