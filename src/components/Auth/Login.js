// src/components/Auth/Login.js
import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase/config';
import '../../styles/Auth.css';

const Login = ({ onSuccess, onSwitchToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('יש למלא את כל השדות');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // התחברות באמצעות Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // התחברות הצליחה
      setIsLoading(false);
      if (onSuccess) {
        onSuccess(userCredential.user);
      }
    } catch (error) {
      setIsLoading(false);
      
      // טיפול בשגיאות התחברות
      let errorMessage = 'אירעה שגיאה בהתחברות';
      
      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = 'כתובת אימייל לא תקינה';
          break;
        case 'auth/user-disabled':
          errorMessage = 'חשבון זה חסום';
          break;
        case 'auth/user-not-found':
          errorMessage = 'משתמש לא נמצא';
          break;
        case 'auth/wrong-password':
          errorMessage = 'סיסמה שגויה';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'יותר מדי ניסיונות כניסה, נסה שוב מאוחר יותר';
          break;
        default:
          errorMessage = `שגיאה: ${error.message}`;
      }
      
      setError(errorMessage);
    }
  };

  return (
    <div className="auth-form-container">
      <h2>כניסה לחשבון</h2>
      
      {error && <div className="auth-error">{error}</div>}
      
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">אימייל</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">סיסמה</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />
        </div>
        
        <button 
          type="submit" 
          className="auth-button"
          disabled={isLoading}
        >
          {isLoading ? 'מתחבר...' : 'התחבר'}
        </button>
      </form>
      
      <div className="auth-switch">
        <p>אין לך חשבון עדיין?</p>
        <button 
          className="switch-button" 
          onClick={onSwitchToRegister}
          disabled={isLoading}
        >
          הירשם עכשיו
        </button>
      </div>
    </div>
  );
};

// src/components/Auth/UserProfile.js
import React, { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase/config';
import dataService from '../../services/dataService';
import '../../styles/Auth.css';

const UserProfile = ({ user, onLogout }) => {
  const [stats, setStats] = useState({
    totalWords: 0,
    learnedWords: 0,
    proficiencyLevels: {
      0: 0, // לא נלמד
      1: 0, // רמה 1
      2: 0, // רמה 2
      3: 0, // רמה 3
      4: 0, // רמה 4
      5: 0  // רמה 5 (נלמד היטב)
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  // טעינת סטטיסטיקות הלמידה של המשתמש
  useEffect(() => {
    const loadUserStats = async () => {
      if (!user || !user.uid) return;
      
      try {
        setIsLoading(true);
        
        // טעינת התקדמות המשתמש
        const userProgress = await dataService.loadUserProgress(user.uid);
        
        if (userProgress && userProgress.words) {
          // חישוב סטטיסטיקות
          const proficiencyLevels = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
          let learnedWords = 0;
          let totalTrackedWords = 0;
          
          // מעבר על כל הקטגוריות והמילים
          Object.values(userProgress.words).forEach(category => {
            Object.values(category).forEach(word => {
              totalTrackedWords++;
              
              // ספירת רמות שליטה
              const proficiency = word.proficiency || 0;
              proficiencyLevels[proficiency] = (proficiencyLevels[proficiency] || 0) + 1;
              
              // מילים שנלמדו (רמה 3 ומעלה)
              if (proficiency >= 3) {
                learnedWords++;
              }
            });
          });
          
          // מספר המילים הכולל במאגר
          const totalWords = dataService.getWordsFromSelectedCategories().length;
          
          setStats({
            totalWords,
            learnedWords,
            totalTrackedWords,
            proficiencyLevels
          });
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading user stats:', error);
        setIsLoading(false);
      }
    };
    
    loadUserStats();
  }, [user]);

  // התנתקות מהמערכת
  const handleLogout = async () => {
    try {
      await signOut(auth);
      if (onLogout) {
        onLogout();
      }
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // חישוב אחוז ההתקדמות
  const calculateProgress = () => {
    if (stats.totalWords === 0) return 0;
    return Math.round((stats.learnedWords / stats.totalWords) * 100);
  };

  return (
    <div className="user-profile">
      <h2>פרופיל משתמש</h2>
      
      <div className="user-info">
        <div className="user-avatar">
          <span className="avatar-placeholder">
            {user?.displayName ? user.displayName.charAt(0).toUpperCase() : '?'}
          </span>
        </div>
        
        <div className="user-details">
          <h3>{user?.displayName || 'משתמש'}</h3>
          <p className="user-email">{user?.email}</p>
        </div>
      </div>
      
      <div className="user-stats">
        <h3>התקדמות למידה</h3>
        
        {isLoading ? (
          <div className="loading">טוען נתונים...</div>
        ) : (
          <>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${calculateProgress()}%` }}
              ></div>
              <span className="progress-text">{calculateProgress()}%</span>
            </div>
            
            <div className="stats-grid">
              <div className="stat-item">
                <h4>מילים שנלמדו</h4>
                <p>{stats.learnedWords} / {stats.totalWords}</p>
              </div>
              
              <div className="stat-item">
                <h4>מילים בתהליך</h4>
                <p>{stats.totalTrackedWords - stats.learnedWords}</p>
              </div>
              
              <div className="stat-item">
                <h4>רמת שליטה גבוהה</h4>
                <p>{(stats.proficiencyLevels[4] || 0) + (stats.proficiencyLevels[5] || 0)}</p>
              </div>
            </div>
          </>
        )}
      </div>
      
      <button className="logout-button" onClick={handleLogout}>
        התנתק
      </button>
    </div>
  );
};

export default Login;
export { Register, UserProfile };

// src/components/Auth/Register.js
import React, { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../../firebase/config';
import '../../styles/Auth.css';

const Register = ({ onSuccess, onSwitchToLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // וידוא שכל השדות מלאים
    if (!name || !email || !password || !confirmPassword) {
      setError('יש למלא את כל השדות');
      return;
    }
    
    // וידוא שהסיסמאות תואמות
    if (password !== confirmPassword) {
      setError('הסיסמאות אינן תואמות');
      return;
    }
    
    // וידוא אורך הסיסמה
    if (password.length < 6) {
      setError('הסיסמה חייבת להכיל לפחות 6 תווים');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // יצירת המשתמש באמצעות Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // עדכון שם המשתמש
      await updateProfile(userCredential.user, {
        displayName: name
      });
      
      // הרשמה הצליחה
      setIsLoading(false);
      if (onSuccess) {
        onSuccess(userCredential.user);
      }
    } catch (error) {
      setIsLoading(false);
      
      // טיפול בשגיאות הרשמה
      let errorMessage = 'אירעה שגיאה בהרשמה';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'האימייל כבר קיים במערכת';
          break;
        case 'auth/invalid-email':
          errorMessage = 'כתובת אימייל לא תקינה';
          break;
        case 'auth/weak-password':
          errorMessage = 'הסיסמה חלשה מדי';
          break;
        default:
          errorMessage = `שגיאה: ${error.message}`;
      }
      
      setError(errorMessage);
    }
  };

  return (
    <div className="auth-form-container">
      <h2>הרשמה לאפליקציה</h2>
      
      {error && <div className="auth-error">{error}</div>}
      
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">שם מלא</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isLoading}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="email">אימייל</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">סיסמה</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="confirmPassword">אימות סיסמה</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isLoading}
          />
        </div>
        
        <button 
          type="submit" 
          className="auth-button"
          disabled={isLoading}
        >
          {isLoading ? 'יוצר חשבון...' : 'הירשם'}
        </button>
      </form>
      
      <div className="auth-switch">
        <p>כבר יש לך חשבון?</p>
        <button 
          className="switch-button" 
          onClick={onSwitchToLogin}
          disabled={isLoading}
        >
          התחבר
        </button>
      </div>
    </div>
  );
};
