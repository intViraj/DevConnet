import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import DeveloperCard from '../components/DeveloperCard';
import api from '../services/api';
import { 
  User, 
  Lock, 
  Sparkles, 
  Plus, 
  X, 
  Check, 
  Eye, 
  ShieldCheck, 
  Image as ImageIcon 
} from 'lucide-react';

const SUGGESTED_SKILLS = [
  'React', 'Node.js', 'Express', 'MongoDB', 'JavaScript', 
  'TypeScript', 'Python', 'TailwindCSS', 'AWS', 'Docker', 
  'GraphQL', 'PostgreSQL', 'Next.js', 'Git'
];

const SAMPLE_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&auto=format&fit=crop&q=80',
];

const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const { showToast } = useToast();

  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    age: '',
    gender: 'prefer_not_to_say',
    photoUrl: '',
    about: '',
    skills: [],
  });

  const [newSkillInput, setNewSkillInput] = useState('');
  const [saving, setSaving] = useState(false);

  // Password State
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        age: user.age ? String(user.age) : '',
        gender: user.gender || 'prefer_not_to_say',
        photoUrl: user.photoUrl || '',
        about: user.about || '',
        skills: user.skills || [],
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddSkill = (skillToAdd) => {
    const trimmed = (skillToAdd || newSkillInput).trim();
    if (!trimmed) return;
    if (formData.skills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      showToast(`'${trimmed}' is already in your skills list.`, 'info');
      setNewSkillInput('');
      return;
    }
    if (formData.skills.length >= 30) {
      showToast('Maximum 30 skills allowed.', 'error');
      return;
    }
    setFormData((prev) => ({ ...prev, skills: [...prev.skills, trimmed] }));
    setNewSkillInput('');
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skillToRemove),
    }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        photoUrl: formData.photoUrl.trim() || undefined,
        gender: formData.gender,
        about: formData.about.trim(),
        skills: formData.skills,
      };

      if (formData.age !== '') {
        const parsedAge = Number(formData.age);
        if (isNaN(parsedAge) || parsedAge < 16 || parsedAge > 120) {
          showToast('Age must be between 16 and 120.', 'error');
          setSaving(false);
          return;
        }
        payload.age = parsedAge;
      }

      await updateProfile(payload);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      showToast('Please fill in current and new passwords.', 'error');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast('New passwords do not match.', 'error');
      return;
    }

    setPasswordSaving(true);
    try {
      const response = await api.patch('/profile/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      showToast(response.data.message || 'Password updated successfully!', 'success');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      showToast(error.message || 'Failed to update password.', 'error');
    } finally {
      setPasswordSaving(false);
    }
  };

  // Preview user object for live card rendering
  const previewUser = {
    ...user,
    firstName: formData.firstName || 'Developer',
    lastName: formData.lastName || '',
    age: formData.age ? Number(formData.age) : undefined,
    gender: formData.gender,
    photoUrl: formData.photoUrl || user?.photoUrl,
    about: formData.about || 'Passionate developer looking to connect!',
    skills: formData.skills,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
          <User className="w-8 h-8 text-purple-400" />
          Developer Profile
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Customize how you appear to other developers in the matchmaking feed.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Edit Form */}
        <div className="lg:col-span-7 space-y-8">
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-700/80 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              Edit Profile Details
            </h2>

            <form onSubmit={handleProfileSubmit} className="space-y-6">
              {/* First & Last Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    First Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-purple-500 focus:outline-none text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-purple-500 focus:outline-none text-white text-sm"
                  />
                </div>
              </div>

              {/* Email (Read Only) */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Registered Email</span>
                  <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Protected & Verified
                  </span>
                </label>
                <input
                  type="text"
                  disabled
                  value={user?.emailId || ''}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-400 text-sm cursor-not-allowed"
                />
              </div>

              {/* Age and Gender */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Age
                  </label>
                  <input
                    type="number"
                    name="age"
                    min="16"
                    max="120"
                    value={formData.age}
                    onChange={handleChange}
                    placeholder="e.g. 26"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-purple-500 focus:outline-none text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-purple-500 focus:outline-none text-white text-sm"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </div>
              </div>

              {/* Profile Photo URL */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
                  Profile Photo URL
                </label>
                <input
                  type="url"
                  name="photoUrl"
                  placeholder="https://..."
                  value={formData.photoUrl}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-purple-500 focus:outline-none text-white text-sm"
                />

                {/* Preset Avatars */}
                <div className="mt-3">
                  <p className="text-[11px] text-slate-400 mb-1.5">Or choose a sample avatar:</p>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {SAMPLE_AVATARS.map((url, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, photoUrl: url }))}
                        className={`w-10 h-10 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                          formData.photoUrl === url ? 'border-purple-500 scale-110 shadow-lg' : 'border-transparent hover:border-slate-500'
                        }`}
                      >
                        <img src={url} alt={`Avatar ${i}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* About / Bio */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    About / Bio
                  </label>
                  <span className={`text-[11px] ${formData.about.length > 450 ? 'text-amber-400' : 'text-slate-400'}`}>
                    {formData.about.length} / 500
                  </span>
                </div>
                <textarea
                  name="about"
                  rows="3"
                  maxLength="500"
                  value={formData.about}
                  onChange={handleChange}
                  placeholder="What are you building? What kind of developers are you looking to connect with?"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-purple-500 focus:outline-none text-white text-sm leading-relaxed"
                />
              </div>

              {/* Skills Tag Input */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Tech Stack & Skills ({formData.skills.length} / 30)
                </label>

                {/* Input with Add button */}
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    placeholder="Type a skill (e.g. Next.js, Rust, Kubernetes)..."
                    value={newSkillInput}
                    onChange={(e) => setNewSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSkill();
                      }
                    }}
                    className="flex-1 px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 focus:border-purple-500 focus:outline-none text-white text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddSkill()}
                    className="px-4 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 border border-purple-500/40 text-xs font-bold transition-all flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> Add
                  </button>
                </div>

                {/* Active Skills Chips */}
                {formData.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-3 rounded-2xl bg-slate-900/60 border border-slate-800 mb-3">
                    {formData.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium bg-purple-500/10 text-purple-300 border border-purple-500/30"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          className="hover:text-rose-400 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Quick Add Suggestions */}
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[11px] text-slate-400 self-center mr-1">Quick add:</span>
                  {SUGGESTED_SKILLS.map((skill) => {
                    const hasSkill = formData.skills.some((s) => s.toLowerCase() === skill.toLowerCase());
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => hasSkill ? handleRemoveSkill(skill) : handleAddSkill(skill)}
                        className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-all ${
                          hasSkill
                            ? 'bg-purple-600 text-white shadow-sm'
                            : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                        }`}
                      >
                        {hasSkill ? '✓ ' : '+ '}{skill}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Submit Profile */}
              <button
                type="submit"
                disabled={saving}
                className="w-full py-3.5 px-6 rounded-2xl font-bold text-white bg-purple-600 hover:bg-purple-500 shadow-xl shadow-purple-600/25 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              >
                {saving ? 'Saving Profile...' : 'Save Profile Changes'}
              </button>
            </form>
          </div>

          {/* Change Password Card */}
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-700/80 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <Lock className="w-5 h-5 text-purple-400" />
              Change Password
            </h2>
            <p className="text-xs text-slate-400 mb-6">
              Update your account password. Must be at least 8 characters with letters and numbers.
            </p>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData((p) => ({ ...p, currentPassword: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-purple-500 focus:outline-none text-white text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData((p) => ({ ...p, newPassword: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-purple-500 focus:outline-none text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData((p) => ({ ...p, confirmPassword: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-purple-500 focus:outline-none text-white text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={passwordSaving}
                className="w-full py-3 px-6 rounded-xl font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 transition-all disabled:opacity-50 text-sm"
              >
                {passwordSaving ? 'Updating Password...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Live Feed Preview */}
        <div className="lg:col-span-5 sticky top-24">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
              <Eye className="w-4 h-4" /> Live Card Preview
            </span>
            <span className="text-[11px] text-slate-500">
              How other devs see you
            </span>
          </div>

          <DeveloperCard
            developer={previewUser}
            showActions={false}
          />
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
