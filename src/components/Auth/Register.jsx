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

export default Register;
