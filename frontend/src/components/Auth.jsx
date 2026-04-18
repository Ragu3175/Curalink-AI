import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Mail, Lock, User, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

const Auth = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({ username: '', email: '', password: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [loggedOut, setLoggedOut] = useState(false);
    const { login, register, error } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            if (isLogin) {
                await login(formData.email, formData.password);
            } else {
                await register(formData.username, formData.email, formData.password);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center py-12 px-6 font-inter overflow-y-auto">
            <div className="max-w-md w-full animate-in fade-in zoom-in duration-500">
                {/* Logo & Header */}
                <div className="text-center mb-10">
                    <div className="w-16 h-16 rounded-2xl medical-gradient flex items-center justify-center shadow-xl mx-auto mb-6 transform hover:rotate-6 transition-transform">
                        <Sparkles className="text-white w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 font-outfit tracking-tight mb-2">
                        {isLogin ? 'Welcome Back' : 'Create Researcher Account'}
                    </h1>
                    <p className="text-slate-500 text-sm">
                        {isLogin ? 'Access your private medical intelligence pipeline.' : 'Join 2,000+ researchers using Curalink AI.'}
                    </p>
                </div>

                {/* Auth Card */}
                <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-sky-900/10 border border-slate-100 p-8 md:p-10 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 medical-gradient opacity-80" />
                    
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 text-rose-600 text-sm animate-in slide-in-from-top-2">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <p className="font-medium">{error}</p>
                            </div>
                        )}

                        {!isLogin && (
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Username</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-sky-500 transition-colors">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <input 
                                        type="text"
                                        required
                                        placeholder="Dr. Smith"
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-sky-400 focus:bg-white transition-all text-slate-800"
                                        value={formData.username}
                                        onChange={(e) => setFormData({...formData, username: e.target.value})}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-sky-500 transition-colors">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <input 
                                    type="email"
                                    required
                                    placeholder="researcher@institute.org"
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-sky-400 focus:bg-white transition-all text-slate-800"
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-sky-500 transition-colors">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <input 
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-sky-400 focus:bg-white transition-all text-slate-800"
                                    value={formData.password}
                                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                                />
                            </div>
                        </div>

                        <button 
                            type="submit"
                            disabled={isLoading}
                            className="w-full medical-gradient text-white py-4 px-6 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl shadow-sky-600/20 hover:shadow-sky-600/40 hover:-translate-y-1 active:translate-y-0 transition-all disabled:opacity-70 disabled:hover:translate-y-0"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                <>
                                    <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-slate-100 text-center">
                        <button 
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-sm font-bold text-slate-500 hover:text-sky-600 transition-colors"
                        >
                            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                        </button>
                    </div>
                </div>

                <p className="mt-10 text-center text-xs text-slate-400 font-medium">
                    Protected by Curalink Medical-Grade Encryption. 
                    <br/>
                    By signing in, you agree to our Research Ethics Protocol.
                </p>
            </div>
        </div>
    );
};

export default Auth;
