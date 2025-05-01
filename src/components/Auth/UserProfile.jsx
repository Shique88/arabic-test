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

export default UserProfile;
