// src/App.js
import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase/config';
import Login, { Register, UserProfile } from './components/Auth/Login';
import CategorySelector from './components/VocabularyManager/CategorySelector';
import MatchingExercise from './components/Exercises/MatchingExercise';
import dataService from './services/dataService';
import './styles/App.css';

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRegisterForm, setIsRegisterForm] = useState(false);
  const [activeTab, setActiveTab] = useState('exercise'); // 'exercise', 'categories', 'profile'
  
  // בדיקת מצב האימות בעת טעינת האפליקציה
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      
      // אתחול שירות הנתונים
      dataService.initialize().catch(err => {
        console.error('Failed to initialize data service:', err);
      });
    });
    
    // ניקוי listener כשהקומפוננטה מתפרקת
    return () => unsubscribe();
  }, []);
  
  // טיפול בהתחברות / הרשמה מוצלחת
  const handleAuthSuccess = (user) => {
    setUser(user);
    setActiveTab('exercise');
  };
  
  // טיפול בהתנתקות
  const handleLogout = () => {
    setUser(null);
  };
  
  // החלפה בין מסכי התחברות והרשמה
  const toggleAuthForm = () => {
    setIsRegisterForm(!isRegisterForm);
  };
  
  // אם האפליקציה עדיין נטענת
  if (loading) {
    return (
      <div className="app-loading">
        <h1>טוען את האפליקציה...</h1>
      </div>
    );
  }
  
  // רנדור האפליקציה
  return (
    <div className="app" dir="rtl">
      <header className="app-header">
        <h1>לימוד אוצר מילים בערבית</h1>
        
        {user && (
          <nav className="app-nav">
            <button 
              className={`nav-button ${activeTab === 'exercise' ? 'active' : ''}`}
              onClick={() => setActiveTab('exercise')}
            >
              תרגול
            </button>
            <button 
              className={`nav-button ${activeTab === 'categories' ? 'active' : ''}`}
              onClick={() => setActiveTab('categories')}
            >
              קטגוריות
            </button>
            <button 
              className={`nav-button ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              פרופיל
            </button>
          </nav>
        )}
      </header>
      
      <main className="app-content">
        {!user ? (
          <div className="auth-container">
            {isRegisterForm ? (
              <Register 
                onSuccess={handleAuthSuccess} 
                onSwitchToLogin={toggleAuthForm} 
              />
            ) : (
              <Login 
                onSuccess={handleAuthSuccess} 
                onSwitchToRegister={toggleAuthForm} 
              />
            )}
          </div>
        ) : (
          <div className="app-main-content">
            {activeTab === 'exercise' && (
              <MatchingExercise userId={user.uid} />
            )}
            
            {activeTab === 'categories' && (
              <CategorySelector />
            )}
            
            {activeTab === 'profile' && (
              <UserProfile user={user} onLogout={handleLogout} />
            )}
          </div>
        )}
      </main>
      
      <footer className="app-footer">
        <p>© {new Date().getFullYear()} אפליקציה ללימוד אוצר מילים בערבית</p>
      </footer>
    </div>
  );
};

export default App;
