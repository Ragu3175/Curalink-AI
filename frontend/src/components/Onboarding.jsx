import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sparkles, Check, ArrowRight, Loader2, FlaskConical, Microscope, Stethoscope, Dna, Activity, Brain } from 'lucide-react';

const INTERESTS = [
    { id: 'clinical_trials', label: 'Clinical Trial Analytics', icon: <FlaskConical className="w-5 h-5" /> },
    { id: 'drug_discovery', label: 'Drug Discovery', icon: <Microscope className="w-5 h-5" /> },
    { id: 'genomics', label: 'Genomics & Sequencing', icon: <Dna className="w-5 h-5" /> },
    { id: 'patient_care', label: 'In-Patient Care', icon: <Stethoscope className="w-5 h-5" /> },
    { id: 'epidemiology', label: 'Epidemiology', icon: <Activity className="w-5 h-5" /> },
    { id: 'neurology', label: 'Neurological Research', icon: <Brain className="w-5 h-5" /> },
];

const Onboarding = () => {
    const { finalizeOnboarding } = useAuth();
    const [selectedInterests, setSelectedInterests] = useState([]);
    const [medicalFocus, setMedicalFocus] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const toggleInterest = (id) => {
        if (selectedInterests.includes(id)) {
            setSelectedInterests(selectedInterests.filter(i => i !== id));
        } else {
            setSelectedInterests([...selectedInterests, id]);
        }
    };

    const handleComplete = async () => {
        if (selectedInterests.length === 0 || !medicalFocus) return;
        setIsLoading(true);
        try {
            await finalizeOnboarding({ 
                interests: selectedInterests, 
                medicalFocus 
            });
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center py-12 px-6 font-inter overflow-y-auto">
            <div className="max-w-2xl w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center mb-10">
                    <span className="inline-block px-4 py-1 rounded-full bg-sky-100 text-sky-600 text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                        Researcher Profile Setup
                    </span>
                    <h1 className="text-4xl font-bold text-slate-900 font-outfit tracking-tight mb-4">
                        Personalize your intelligence pipeline
                    </h1>
                    <p className="text-slate-500 text-lg max-w-lg mx-auto">
                        Tell us what you're working on, and we'll tailor the Curalink engine to your specific needs.
                    </p>
                </div>

                <div className="bg-white rounded-[3rem] shadow-2xl shadow-sky-900/10 border border-slate-100 p-10 md:p-14">
                    <div className="space-y-10">
                        {/* Section 1: Interests */}
                        <div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-sky-500" />
                                Area of Interest
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {INTERESTS.map((item) => (
                                    <div 
                                        key={item.id}
                                        onClick={() => toggleInterest(item.id)}
                                        className={`group cursor-pointer p-5 rounded-2xl border-2 transition-all flex items-center gap-4 ${
                                            selectedInterests.includes(item.id)
                                                ? 'bg-sky-50 border-sky-400 shadow-lg shadow-sky-500/10'
                                                : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                                        }`}
                                    >
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                                            selectedInterests.includes(item.id) 
                                                ? 'bg-sky-500 text-white shadow-lg' 
                                                : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                                        }`}>
                                            {item.icon}
                                        </div>
                                        <div className="flex-1">
                                            <span className={`block font-bold text-[14px] ${selectedInterests.includes(item.id) ? 'text-sky-900' : 'text-slate-700'}`}>
                                                {item.label}
                                            </span>
                                        </div>
                                        {selectedInterests.includes(item.id) && (
                                            <div className="w-6 h-6 rounded-full bg-sky-500 flex items-center justify-center animate-in zoom-in">
                                                <Check className="w-3.5 h-3.5 text-white" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Section 2: Input */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                <ArrowRight className="w-4 h-4 text-sky-500" />
                                Primary Medical Focus
                            </h3>
                            <input 
                                type="text"
                                placeholder="e.g. Advanced neurodegenerative genomics in elderly populations"
                                className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-sky-400 focus:bg-white transition-all text-slate-800 font-medium"
                                value={medicalFocus}
                                onChange={(e) => setMedicalFocus(e.target.value)}
                            />
                        </div>

                        {/* Action */}
                        <button 
                            onClick={handleComplete}
                            disabled={isLoading || selectedInterests.length === 0 || !medicalFocus}
                            className="w-full medical-gradient text-white py-5 px-6 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl shadow-sky-600/20 hover:shadow-sky-600/40 hover:-translate-y-1 active:translate-y-0 transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed group"
                        >
                            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                                <>
                                    <span>Initialize Research Pipeline</span>
                                    <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </div>
                </div>

                <div className="mt-8 flex justify-center items-center gap-6 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                    <span className="flex items-center gap-2 tracking-normal capitalize">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Active Profile
                    </span>
                    <span className="w-1 h-1 rounded-full bg-slate-200" />
                    <span>On-Device Encryption Active</span>
                </div>
            </div>
        </div>
    );
};

export default Onboarding;
