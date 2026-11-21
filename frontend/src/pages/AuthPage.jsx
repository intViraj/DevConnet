import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Code2, Sparkles, ArrowRight, UserCheck, Lock, Mail, User } from 'lucide-react';

const DEMO_ACCOUNTS = [
  { name: 'Sarah Chen', email: 'sarah.chen@example.com', role: 'Full-Stack Developer' },
  { name: 'Alex Rivera', email: 'alex.rivera@example.com', role: 'AI/ML & Backend' },
  { name: 'Priya Sharma', email: 'priya.sharma@example.com', role: 'Frontend & UI/UX' },
];

const AuthPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, login, signup } = useAuth();
  const { showToast } = useToast();

  const isSignupRoute = location.pathname === '/signup';
  const [isSignup, setIsSignup] = useState(isSignupRoute);

  useEffect(() => {
    setIsSignup(location.pathname === '/signup');
  }, [location.pathname]);

  // If already authenticated, redirect to Feed
  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    emailId: '',
    password: '',
    confirmPassword: '',
    age: '',
    gender: 'prefer_not_to_say',
    about: '',
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignup) {
        if (formData.password !== formData.confirmPassword) {
          showToast('Passwords do not match.', 'error');
          setLoading(false);
          return;
        }

        const payload = {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          emailId: formData.emailId.trim().toLowerCase(),
          password: formData.password,
          gender: formData.gender,
        };

        if (formData.age) {
          payload.age = Number(formData.age);
        }
        if (formData.about) {
          payload.about = formData.about.trim();
        }

        const result = await signup(payload);
        if (result.success) {
          navigate('/');
        }
      } else {
        const result = await login(formData.emailId.trim().toLowerCase(), formData.password);
        if (result.success) {
          navigate('/');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (email) => {
    setLoading(true);
    setFormData((prev) => ({ ...prev, emailId: email, password: 'Password123!' }));
    try {
      const result = await login(email, 'Password123!');
      if (result.success) {
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 shadow-xl shadow-purple-500/25 mb-4">
            <Code2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            DevConnect
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {isSignup
              ? 'Join the premier matchmaking platform for developers'
              : 'Sign in to review matches and grow your network'}
          </p>
        </div>

        {/* Auth Card */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-700/80 shadow-2xl">
          {/* Tab switch */}
          <div className="flex rounded-2xl bg-slate-900/80 p-1 mb-6 border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setIsSignup(false);
                navigate('/login');
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                !isSignup
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSignup(true);
                navigate('/signup');
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                isSignup
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Quick Demo Logins */}
          {!isSignup && (
            <div className="mb-6 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
              <p className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                1-Click Demo Accounts:
              </p>
              <div className="space-y-1.5">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    disabled={loading}
                    onClick={() => handleQuickLogin(acc.email)}
                    className="w-full text-left px-3 py-2 rounded-xl bg-slate-800/60 hover:bg-purple-600/20 hover:border-purple-500/40 border border-slate-700/50 text-xs transition-all flex items-center justify-between group"
                  >
                    <div>
                      <span className="font-semibold text-slate-200 group-hover:text-purple-300">
                        {acc.name}
                      </span>
                      <span className="text-[11px] text-slate-400 ml-2">
                        ({acc.role})
                      </span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* First & Last Name if signup */}
            {isSignup && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    First Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      name="firstName"
                      required
                      placeholder="Linus"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-purple-500 focus:outline-none text-white text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Torvalds"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-purple-500 focus:outline-none text-white text-sm"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  name="emailId"
                  required
                  placeholder="developer@example.com"
                  value={formData.emailId}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-purple-500 focus:outline-none text-white text-sm"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-purple-500 focus:outline-none text-white text-sm"
                />
              </div>
              {isSignup && (
                <p className="text-[10px] text-slate-400 mt-1">
                  At least 8 chars with uppercase, lowercase, and numbers
                </p>
              )}
            </div>

            {/* Confirm Password if signup */}
            {isSignup && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    name="confirmPassword"
                    required
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-purple-500 focus:outline-none text-white text-sm"
                  />
                </div>
              </div>
            )}

            {/* Age & Gender if signup */}
            {isSignup && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Age
                  </label>
                  <input
                    type="number"
                    name="age"
                    min="16"
                    max="120"
                    placeholder="25"
                    value={formData.age}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-purple-500 focus:outline-none text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 focus:border-purple-500 focus:outline-none text-white text-sm"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-white bg-purple-600 hover:bg-purple-500 shadow-xl shadow-purple-600/30 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 text-sm"
            >
              {loading
                ? isSignup
                  ? 'Creating Account...'
                  : 'Signing In...'
                : isSignup
                ? 'Create DevConnect Account'
                : 'Sign In to DevConnect'}
            </button>
          </form>

          {/* Switch Prompt */}
          <div className="mt-6 text-center text-xs text-slate-400">
            {isSignup ? (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignup(false);
                    navigate('/login');
                  }}
                  className="font-semibold text-purple-400 hover:underline"
                >
                  Log In
                </button>
              </p>
            ) : (
              <p>
                Don't have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignup(true);
                    navigate('/signup');
                  }}
                  className="font-semibold text-purple-400 hover:underline"
                >
                  Create one now
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
