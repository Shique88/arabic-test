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

  export default Login;

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
