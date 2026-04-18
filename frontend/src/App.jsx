import React, { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import './App.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import Auth from './components/Auth';
import Onboarding from './components/Onboarding';
import LogoutPage from './components/Logout';
import Dashboard from './components/Dashboard';

const App = () => {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
};

const MainContent = () => {
  const { user, loading, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = () => {
    setIsLoggingOut(true);
  };

  const onLogoutDone = () => {
    logout();
    setIsLoggingOut(false);
    // Explicitly clear local history pointers
    localStorage.removeItem('curalink_cid');
  };

  if (loading) {
    return (
      <div className="h-screen w-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl medical-gradient flex items-center justify-center shadow-xl mx-auto animate-pulse">
            <Sparkles className="text-white w-8 h-8" />
          </div>
          <div className="text-sky-600 font-bold tracking-widest text-xs uppercase animate-pulse">INITIALIZING PIPELINE...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  if (!user.onboardingComplete) {
    return <Onboarding />;
  }

  if (isLoggingOut) {
    return <LogoutPage onDone={onLogoutDone} />;
  }

  // Keyed by user._id to force a complete component re-mount (and state reset) on user change
  return (
    <Dashboard 
      key={user._id} 
      user={user} 
      logout={logout} 
      handleLogout={handleLogout} 
    />
  );
};

export default App;
