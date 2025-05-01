// src/services/srsService.js
import dataService from './dataService';
import { getWordsForReview, updateWordAfterReview } from '../utils/srsAlgorithm';

/**
 * שירות לניהול מערכת SRS (Spaced Repetition System)
 */
class SRSService {
  constructor() {
    this.userProgress = null;
    this.currentUserId = null;
  }
  
  /**
   * טעינת התקדמות המשתמש
   * @param {string} userId - מזהה המשתמש
   */
  async loadUserProgress(userId) {
    if (!userId) return;
    
    try {
      this.currentUserId = userId;
      this.userProgress = await dataService.loadUserProgress(userId);
      
      if (!this.userProgress) {
        // יצירת מבנה נתונים ראשוני אם אין התקדמות
        this.userProgress = {
          words: {},
          lastSession: new Date().toISOString()
        };
        
        // שמירת מבנה הנתונים החדש
        await dataService.saveUserProgress(userId, this.userProgress);
      }
      
      return this.userProgress;
    } catch (error) {
      console.error('Error loading SRS progress:', error);
      throw error;
    }
  }
  
  /**
   * קבלת המילים שיש לחזור עליהן היום
   * @returns {Array<Object>} מילים לתרגול היום
   */
  async getWordsForToday() {
    if (!this.currentUserId || !this.userProgress) return [];
    
    try {
      // אם אין עדיין מילים בהתקדמות, החזר מילים חדשות
      const allUserWords = this._getAllUserWords();
      
      if (allUserWords.length === 0) {
        return this._getNewWords(10); // התחל עם 10 מילים חדשות
      }
      
      // קבל מילים לחזרה לפי האלגוריתם
      const wordsForReview = getWordsForReview(allUserWords);
      
      // אם יש פחות מ-5 מילים לחזרה, הוסף מילים חדשות
      if (wordsForReview.length < 5) {
        const newWords = this._getNewWords(5 - wordsForReview.length);
        return [...wordsForReview, ...newWords];
      }
      
      return wordsForReview;
    } catch (error) {
      console.error('Error getting words for today:', error);
      return [];
    }
  }
  
  /**
   * עדכון התקדמות למידת מילה
   * @param {Object} word - המילה שתורגלה
   * @param {boolean} isCorrect - האם התשובה היתה נכונה
   */
  async updateWordProgress(word, isCorrect) {
    if (!this.currentUserId || !word || !word.id) return;
    
    try {
      // קבל את הקטגוריה של המילה
      const categoryId = this._getCategoryForWord(word.id);
      
      if (!categoryId) return;
      
      // עדכון המילה עם האלגוריתם
      const updatedWord = updateWordAfterReview(word, isCorrect);
      
      // עדכון במסד הנתונים
      await dataService.updateWordProgress(
        this.currentUserId,
        word.id,
        categoryId,
        {
          proficiency: updatedWord.proficiency,
          reviewCount: updatedWord.reviewCount,
          reviewDate: updatedWord.reviewDate
        }
      );
      
      // עדכון מקומי
      if (!this.userProgress.words[categoryId]) {
        this.userProgress.words[categoryId] = {};
      }
      
      this.userProgress.words[categoryId][word.id] = {
        proficiency: updatedWord.proficiency,
        reviewCount: updatedWord.reviewCount,
        reviewDate: updatedWord.reviewDate
      };
      
      return updatedWord;
    } catch (error) {
      console.error('Error updating word progress:', error);
      throw error;
    }
  }
  
  /**
   * קבלת כל המילים שהמשתמש כבר למד
   * @returns {Array<Object>} מילים שכבר נלמדו
   */
  _getAllUserWords() {
    const allWords = [];
    
    if (!this.userProgress || !this.userProgress.words) {
      return allWords;
    }
    
    // איסוף כל המילים מכל הקטגוריות
    const allVocabulary = dataService.getWordsFromSelectedCategories();
    const userProgressWords = this.userProgress.words;
    
    // מיזוג מידע מהמילון עם התקדמות המשתמש
    for (const word of allVocabulary) {
      const categoryId = this._getCategoryForWord(word.id);
      
      if (!categoryId) continue;
      
      // בדיקה אם יש התקדמות למילה זו
      if (
        userProgressWords[categoryId] && 
        userProgressWords[categoryId][word.id]
      ) {
        const progress = userProgressWords[categoryId][word.id];
        
        // שילוב המידע
        allWords.push({
          ...word,
          proficiency: progress.proficiency,
          reviewCount: progress.reviewCount,
          reviewDate: progress.reviewDate
        });
      }
    }
    
    return allWords;
  }
  
  /**
   * קבלת מילים חדשות שהמשתמש עדיין לא למד
   * @param {number} count - מספר המילים החדשות לקבל
   * @returns {Array<Object>} מילים חדשות
   */
  _getNewWords(count) {
    // קבלת כל המילים מהקטגוריות הנבחרות
    const allVocabulary = dataService.getWordsFromSelectedCategories();
    
    // סינון רק מילים שעדיין לא נלמדו
    const newWords = allVocabulary.filter(word => {
      const categoryId = this._getCategoryForWord(word.id);
      
      if (!categoryId) return false;
      
      // בדיקה אם המילה כבר קיימת בהתקדמות המשתמש
      const exists = this.userProgress?.words?.[categoryId]?.[word.id];
      
      return !exists;
    });
    
    // ערבוב המילים ובחירת המספר הנדרש
    const shuffled = [...newWords].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }
  
  /**
   * קבלת הקטגוריה של מילה לפי מזהה
   * @param {string} wordId - מזהה המילה
   * @returns {string|null} מזהה הקטגוריה
   */
  _getCategoryForWord(wordId) {
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
  }
}

// יצירת instance יחיד של השירות
const srsService = new SRSService();

export default srsService;
