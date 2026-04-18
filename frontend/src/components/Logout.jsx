import React, { useEffect } from 'react';
import { ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';

const Logout = ({ onDone }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onDone();
        }, 3000);
        return () => clearTimeout(timer);
    }, [onDone]);

    return (
        <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6 font-inter">
            <div className="max-w-md w-full text-center animate-in fade-in zoom-in duration-700">
                <div className="w-20 h-20 rounded-3xl bg-emerald-50 text-emerald-500 flex items-center justify-center shadow-xl mx-auto mb-8 animate-bounce">
                    <ShieldCheck className="w-10 h-10" />
                </div>
                
                <h1 className="text-3xl font-bold text-slate-900 font-outfit tracking-tight mb-4">
                    Securely Signed Out
                </h1>
                <p className="text-slate-500 mb-10 leading-relaxed">
                    Your research session has been encrypted and saved. All local pipeline caches have been cleared for your privacy.
                </p>

                <div className="space-y-4">
                    <div className="flex items-center justify-center gap-2 text-sky-600 font-bold text-xs uppercase tracking-widest animate-pulse">
                        <Sparkles className="w-3 h-3" /> Returning to Terminal
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-sky-500 animate-progress origin-left" />
                    </div>
                </div>

                <button 
                    onClick={onDone}
                    className="mt-10 text-sm font-bold text-slate-400 hover:text-sky-600 transition-colors flex items-center justify-center gap-2 mx-auto"
                >
                    Return to Login Now <ArrowRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default Logout;
