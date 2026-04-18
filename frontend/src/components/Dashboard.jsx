import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Users, BookOpen, FlaskConical, History, 
  MapPin, Stethoscope, ChevronRight, Info, ExternalLink,
  Loader2, Sparkles, PlusCircle, Search
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { sendMessage, getHistory, getConversation } from '../api';
import gsap from 'gsap';

const Dashboard = ({ user, logout, handleLogout }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('RETRIEVING DATA');
  const [isSwitching, setIsSwitching] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [history, setHistory] = useState([]);
  const [publications, setPublications] = useState([]);
  const [trials, setTrials] = useState([]);
  const [activeTab, setActiveTab] = useState('publications');
  // Patient Context State
  const [context, setContext] = useState({
    name: user?.username || 'Researcher',
    disease: user?.medicalFocus || 'General Research',
    location: 'Global',
    intent: 'Active Research'
  });

  const chatEndRef = useRef(null);

  // INITIALIZATION: Only runs once when Dashboard MOUNTS for a specific user
  useEffect(() => {
    const initialize = async () => {
      await fetchHistory();
      const savedId = localStorage.getItem('curalink_cid');
      if (savedId) {
        handleLoadConversation(savedId);
      } else {
        startFreshWelcome();
      }
    };
    initialize();
  }, []);

  // RE-SYNC SIDEBAR: Whenever a conversationId is set (after first save), refresh sidebar
  useEffect(() => {
    if (conversationId) {
      fetchHistory();
    }
  }, [conversationId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startFreshWelcome = () => {
    setMessages([{
      role: 'assistant',
      content: `Welcome back, ${user?.username || 'Researcher'}. I've initialized the intelligence pipeline for our session. I see your research focus is ${user?.medicalFocus || 'General Medicine'}. I've brought up some pioneering papers based on your interests in the sidebar—shall we start there?`
    }]);
  };

  const fetchHistory = async () => {
    try {
      const data = await getHistory();
      setHistory(data);
    } catch (e) { console.error(e); }
  };

  const handleNewChat = () => {
    localStorage.removeItem('curalink_cid');
    setConversationId(null);
    setMessages([]);
    setPublications([]);
    setTrials([]);
    setContext({
      name: user?.username || 'Researcher',
      disease: user?.medicalFocus || 'General Research',
      location: 'Global',
      intent: 'New Inquiry'
    });
    startFreshWelcome();
  };

  const handleLoadConversation = async (id) => {
    if (conversationId === id) return;
    setIsSwitching(true);
    try {
      const data = await getConversation(id);
      setConversationId(data._id);
      localStorage.setItem('curalink_cid', data._id);
      setMessages(data.history || []);
      setPublications(data.publications || []);
      setTrials(data.clinicalTrials || []);
      setContext(data.patientContext || context);
    } catch (error) {
      console.error('Failed to load conversation:', error);
      handleNewChat();
    } finally {
      setIsSwitching(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading || isSwitching) return;

    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setLoadingStep('RETRIEVING DATA');

    const steps = ['RETRIEVING DATA', 'ANALYZING EVIDENCE', 'SYNTHESIZING REPORT'];
    let stepIdx = 0;
    const interval = setInterval(() => {
      if (stepIdx < steps.length - 1) {
        stepIdx++;
        setLoadingStep(steps[stepIdx]);
      }
    }, 3500);

    try {
      const data = await sendMessage(input, conversationId, context);
      setMessages(prev => [...prev, { role: 'assistant', content: data.report }]);
      setConversationId(data.conversationId);
      localStorage.setItem('curalink_cid', data.conversationId);
      
      if (data.publications && data.publications.length > 0) setPublications(data.publications);
      if (data.clinicalTrials && data.clinicalTrials.length > 0) setTrials(data.clinicalTrials);
      if (data.context) setContext(data.context);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Research alert: An interruption occurred in the medical intelligence pipeline." }]);
    } finally {
      clearInterval(interval);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-inter text-slate-800">
      {/* Sidebar - History & Context */}
      <aside className="w-80 border-r border-slate-200 bg-white flex flex-col z-10">
        <div className="p-6 border-b border-slate-100 shadow-sm bg-white">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg medical-gradient flex items-center justify-center shadow-lg">
              <Sparkles className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight font-outfit">Curalink AI</h1>
          </div>

          <button 
            onClick={handleNewChat}
            disabled={isLoading || isSwitching}
            className="w-full mb-6 flex items-center justify-center gap-2 py-3 px-4 bg-sky-600 text-white rounded-xl font-bold text-sm hover:bg-sky-700 transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            <PlusCircle className="w-4 h-4" /> New Research
          </button>

          <div className="space-y-4">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <Users className="w-3 h-3" /> Focus Area
            </h3>
            <div className="space-y-2">
              <ContextItem icon={<Stethoscope className="w-4 h-4" />} label="Subject" value={context.disease} />
            </div>
            {user.interests && user.interests.length > 0 && (
               <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 mt-4">
                 <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Interests</div>
                 <div className="flex flex-wrap gap-1.5">
                   {user.interests.map((int, i) => (
                     <span key={i} className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-medium text-slate-600">{int.replace('_', ' ')}</span>
                   ))}
                 </div>
               </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          <div>
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 px-2 flex items-center gap-2">
              <History className="w-3 h-3" /> Recent History
            </h3>
            <div className="space-y-1">
              {history.map((conv) => (
                <div 
                  key={conv._id} 
                  onClick={() => handleLoadConversation(conv._id)}
                  className={`p-3 rounded-xl cursor-pointer transition-all text-sm group relative ${
                    conversationId === conv._id 
                    ? 'bg-sky-50 text-sky-900 border-l-4 border-sky-500 rounded-l-none' 
                    : 'hover:bg-slate-50 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <div className={`font-semibold truncate pr-4`}>
                    {conv.patientContext.disease || 'General Research'}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 flex justify-between items-center">
                    <span>{new Date(conv.lastUpdated).toLocaleDateString()}</span>
                    <ChevronRight className={`w-3 h-3 transition-transform ${conversationId === conv._id ? 'translate-x-0' : '-translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'}`} />
                  </div>
                </div>
              ))}
              {history.length === 0 && (
                <div className="text-center py-6 px-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Awaiting Research</div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* User Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center text-sky-600 font-bold text-xs">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-slate-900 truncate">{user.username}</div>
              <div className="text-[10px] text-slate-400 truncate">{user.email}</div>
            </div>
            <button 
              onClick={handleLogout}
              className="p-1.5 rounded-lg hover:bg-rose-50 hover:text-rose-500 text-slate-300 transition-colors"
              title="Logout"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col bg-slate-50 relative">
        <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-thin scrollbar-thumb-slate-200">
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                <div className={`max-w-[85%] p-5 rounded-3xl shadow-sm border ${
                  msg.role === 'user' 
                    ? 'bg-sky-600 text-white border-sky-500 rounded-tr-none' 
                    : 'bg-white text-slate-800 border-slate-200 rounded-tl-none prose prose-slate prose-sm'
                }`}>
                  <div className="prose prose-slate prose-sm max-w-none prose-p:leading-relaxed prose-headings:mb-2 prose-headings:mt-4 first:prose-headings:mt-0">
                    {msg.role === 'assistant' ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                    ) : (
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {(isLoading || isSwitching) && (
              <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300 pb-10">
                <div className="bg-white px-6 py-4 rounded-3xl rounded-tl-none shadow-sm border border-slate-200 flex flex-col gap-2 min-w-[200px]">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <div className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-bounce"></div>
                    </div>
                    <span className="text-[10px] text-sky-600 font-black tracking-[0.2em] uppercase font-outfit">Researching...</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.1em] animate-pulse">
                      {loadingStep}
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-8 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent">
          <form 
            onSubmit={handleSend}
            className="max-w-4xl mx-auto flex items-center gap-3 bg-white p-2 rounded-2xl shadow-2xl border border-slate-200 focus-within:border-sky-400 transition-colors"
          >
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Query specialized drug data, trial results, or technical publications..."
              className="flex-1 px-4 py-3 outline-none text-slate-700 bg-transparent text-sm placeholder:text-slate-400"
            />
            <button 
              type="submit" 
              disabled={isLoading || isSwitching}
              className="w-12 h-12 rounded-xl bg-sky-600 flex items-center justify-center text-white hover:bg-sky-700 transition-all shadow-lg active:scale-90 disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
          <div className="max-w-4xl mx-auto mt-3 px-4 text-[10px] text-slate-400 flex items-center gap-2">
            <Info className="w-3 h-3" /> Curalink logic is optimized for precision. Follow-up memory is isolated per research thread.
          </div>
        </div>
      </main>

      {/* Research Sidebar */}
      <aside className="w-96 border-l border-slate-200 bg-white flex flex-col shadow-2xl z-10">
        <div className="p-6 pb-2 bg-white sticky top-0 z-20">
          <h2 className="text-lg font-bold text-slate-900 font-outfit tracking-tight mb-4">Study Highlights</h2>
          <div className="flex p-1 bg-slate-100 rounded-xl gap-1">
            <button onClick={() => setActiveTab('publications')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'publications' ? 'bg-white text-sky-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <BookOpen className={`w-3.5 h-3.5 ${activeTab === 'publications' ? 'text-sky-600' : 'text-slate-400'}`} />
              Papers ({publications.length})
            </button>
            <button onClick={() => setActiveTab('trials')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'trials' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <FlaskConical className={`w-3.5 h-3.5 ${activeTab === 'trials' ? 'text-emerald-600' : 'text-slate-400'}`} />
              Trials ({trials.length})
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-200">
          {activeTab === 'publications' ? (
            <div className="space-y-4">
              {publications.length > 0 ? publications.map((pub, i) => (
                <div key={i} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-sky-200 transition-all group">
                  <div className="text-[10px] font-bold text-sky-600 uppercase mb-2 flex items-center gap-2">
                     <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>{pub.source}
                  </div>
                  <h4 className="text-[14px] font-bold text-slate-900 leading-snug mb-2">{pub.title}</h4>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <span className="bg-slate-200 px-2 py-0.5 rounded">{pub.year}</span>
                    <span className="truncate">{pub.authors}</span>
                  </div>
                  <a href={pub.url} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-[11px] font-bold text-sky-600">
                    Source Evidence <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )) : (
                <div className="text-center py-20 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
                  <BookOpen className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                  <div className="text-[11px] font-bold text-slate-400 uppercase">Awaiting Research</div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {trials.length > 0 ? trials.map((trial, i) => (
                <div key={i} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-emerald-200 transition-all group">
                  <div className={`text-[9px] font-black px-2 py-1 rounded-md inline-block mb-3 ${trial.status === 'RECRUITING' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {trial.status}
                  </div>
                  <h4 className="text-[14px] font-bold text-slate-900 leading-snug mb-3">{trial.title}</h4>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{trial.location}</span>
                  </div>
                  <a href={trial.url} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-[11px] font-bold text-emerald-600">
                    Trial Record <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )) : (
                <div className="text-center py-20 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
                  <FlaskConical className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                  <div className="text-[11px] font-bold text-slate-400 uppercase">Awaiting Discovery</div>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};

const ContextItem = ({ icon, label, value }) => (
  <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-100/50 border border-slate-200 shadow-inner">
    <div className="mt-0.5 text-sky-600">{icon}</div>
    <div>
      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">{label}</div>
      <div className="text-[13px] font-bold text-slate-900 leading-tight">{value}</div>
    </div>
  </div>
);

export default Dashboard;
