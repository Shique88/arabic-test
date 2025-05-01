// src/components/Exercises/MatchingExercise.js
import React, { useState, useEffect } from 'react';
import { getRandomWords } from '../../utils/excelParser';
import { updateWordAfterReview } from '../../utils/srsAlgorithm';
import dataService from '../../services/dataService';
import '../../styles/MatchingExercise.css';

const MatchingExercise = ({ userId }) => {
  const [words, setWords] = useState([]);
  const [translations, setTranslations] = useState([]);
  const [selectedWord, setSelectedWord] = useState(null);
  const [selectedTranslation, setSelectedTranslation] = useState(null);
  const [matchedPairs, setMatchedPairs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [streak, setStreak] = useState(0);
  const [error, setError] = useState(null);

  // טעינת מילים חדשות לתרגול
  const loadExercise = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // ודא שהנתונים טעונים
      if (!dataService.initialized) {
        await dataService.initialize();
      }
      
      // קבל קטגוריות נבחרות
      const selectedCategories = dataService.getSelectedCategories();
      
      if (!selectedCategories || selectedCategories.length === 0) {
        setError('אנא בחר לפחות קטגוריה אחת לתרגול');
        setIsLoading(false);
        return;
      }
      
      // קבל מילים מהקטגוריות הנבחרות
      const vocabularyData = dataService.vocabularyData;
      
      // בחר 6 מילים אקראיות
      const randomWords = getRandomWords(vocabularyData, selectedCategories, 6);
      
      if (randomWords.length < 2) {
        setError('לא נמצאו מספיק מילים בקטגוריות הנבחרות');
        setIsLoading(false);
        return;
      }
      
      setWords(randomWords);
      
      // יצירת מערך של תרגומים וערבוב שלו
      const translationsArray = randomWords.map(word => ({
        id: word.id,
        text: word.translation,
        wordId: word.id
      }));
      
      // ערבוב התרגומים
      const shuffledTranslations = [...translationsArray].sort(() => 0.5 - Math.random());
      setTranslations(shuffledTranslations);
      
      // איפוס בחירות ומצב התאמה
      setSelectedWord(null);
      setSelectedTranslation(null);
      setMatchedPairs([]);
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading exercise:', error);
      setError('אירעה שגיאה בטעינת התרגיל');
      setIsLoading(false);
    }
  };
  
  // טיפול בבחירת מילה
  const handleWordSelect = (word) => {
    // אם המילה כבר הותאמה, לא לעשות כלום
    if (matchedPairs.includes(word.id)) {
      return;
    }
    
    setSelectedWord(word);
    
    // אם כבר יש תרגום נבחר, בדוק אם יש התאמה
    if (selectedTranslation) {
      checkMatch(word, selectedTranslation);
    }
  };
  
  // טיפול בבחירת תרגום
  const handleTranslationSelect = (translation) => {
    // אם התרגום כבר הותאם, לא לעשות כלום
    if (matchedPairs.includes(translation.wordId)) {
      return;
    }
    
    setSelectedTranslation(translation);
    
    // אם כבר יש מילה נבחרת, בדוק אם יש התאמה
    if (selectedWord) {
      checkMatch(selectedWord, translation);
    }
  };
  
  // קבלת הקטגוריה של מילה לפי מזהה
  const getCategoryForWord = (wordId) => {
    // חיפוש בכל הקטגוריות
    for (const categoryId in dataService.vocabularyData) {
      const words = dataService.vocabularyData[categoryId];
      
      // בדיקה אם המילה קיימת בקטגוריה זו
      const wordExists = words.some(w => w.id === wordId);
      
      if (wordExists) {
        return categoryId;
      }
    }
    
    return null;
  };
  
  // בדיקת התאמה בין מילה לתרגום
  const checkMatch = (word, translation) => {
    const isMatch = word.id === translation.wordId;
    
    if (isMatch) {
      // התאמה נכונה
      setMatchedPairs([...matchedPairs, word.id]);
      setStreak(streak + 1);
      
      // עדכון התקדמות הלמידה למילה זו
      if (userId) {
        const updatedWord = updateWordAfterReview(word, true);
        const categoryId = getCategoryForWord(word.id);
        
        if (categoryId) {
          dataService.updateWordProgress(userId, word.id, categoryId, {
            proficiency: updatedWord.proficiency,
            reviewCount: updatedWord.reviewCount,
            reviewDate: updatedWord.reviewDate
          });
        }
      }
    } else {
      // התאמה שגויה
      setStreak(0);
      
      // עדכון התקדמות הלמידה למילה זו (כשגיאה)
      if (userId) {
        const updatedWord = updateWordAfterReview(word, false);
        const categoryId = getCategoryForWord(word.id);
        
        if (categoryId) {
          dataService.updateWordProgress(userId, word.id, categoryId, {
            proficiency: updatedWord.proficiency,
            reviewCount: updatedWord.reviewCount,
            reviewDate: updatedWord.reviewDate
          });
        }
      }
    }
    
    // איפוס הבחירות
    setSelectedWord(null);
    setSelectedTranslation(null);
    
    // אם כל הזוגות הותאמו, טען תרגיל חדש
    if (isMatch && matchedPairs.length + 1 === words.length) {
      setTimeout(() => loadExercise(), 1000);
    }
  };
  
  // טעינת תרגיל חדש כשהקומפוננטה נטענת
  useEffect(() => {
    loadExercise();
  }, []);
  
  // טעינת תרגיל חדש כשהקטגוריות הנבחרות משתנות
  useEffect(() => {
    if (dataService.initialized) {
      loadExercise();
    }
  }, [dataService.getSelectedCategories()]);
  
  // רנדור הקומפוננטה
  return (
    <div className="matching-exercise">
      <h2>תרגיל התאמה</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      {isLoading ? (
        <div className="loading">טוען תרגיל...</div>
      ) : (
        <>
          <div className="exercise-stats">
            <span className="streak">רצף הצלחות: {streak}</span>
            <span className="progress">התאמות: {matchedPairs.length}/{words.length}</span>
          </div>
          
          <div className="matching-container">
            <div className="words-container">
              <h3>מילים בערבית</h3>
              <div className="words-list">
                {words.map(word => (
                  <div
                    key={word.id}
                    className={`word-item ${selectedWord?.id === word.id ? 'selected' : ''} ${matchedPairs.includes(word.id) ? 'matched' : ''}`}
                    onClick={() => handleWordSelect(word)}
                  >
                    {word.transcription}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="translations-container">
              <h3>פירוש בעברית</h3>
              <div className="translations-list">
                {translations.map(translation => (
                  <div
                    key={translation.id}
                    className={`translation-item ${selectedTranslation?.id === translation.id ? 'selected' : ''} ${matchedPairs.includes(translation.wordId) ? 'matched' : ''}`}
                    onClick={() => handleTranslationSelect(translation)}
                  >
                    {translation.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <button className="refresh-button" onClick={loadExercise}>
            רענן תרגיל
          </button>
        </>
      )}
    </div>
  );
};

export default MatchingExercise;
