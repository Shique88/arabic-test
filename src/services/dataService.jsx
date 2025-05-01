// src/services/dataService.js
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { loadVocabularyData } from '../utils/excelParser';

/**
 * מחלקה לניהול נתוני האפליקציה
 */
class DataService {
  constructor() {
    this.vocabularyData = null;
    this.categories = [];
    this.selectedCategories = [];
    this.initialized = false;
  }
  
  /**
   * אתחול מערכת הנתונים
   */
  async initialize() {
    if (this.initialized) return;
    
    try {
      // טעינת נתוני אוצר המילים מקובץ האקסל
      const { categories, vocabularyData } = await loadVocabularyData();
      
      this.categories = categories;
      this.vocabularyData = vocabularyData;
      this.selectedCategories = categories.map(cat => cat.id); // בחירת כל הקטגוריות כברירת מחדל
      this.initialized = true;
      
      return { categories, vocabularyData };
    } catch (error) {
      console.error('Failed to initialize data service:', error);
      throw error;
    }
  }
  
  /**
   * קבלת כל הקטגוריות
   */
  getCategories() {
    return this.categories;
  }
  
  /**
   * בחירת קטגוריות ללמידה
   * @param {Array<string>} categoryIds 
   */
  selectCategories(categoryIds) {
    this.selectedCategories = categoryIds;
  }
  
  /**
   * קבלת הקטגוריות הנבחרות
   */
  getSelectedCategories() {
    return this.selectedCategories;
  }
  
  /**
   * קבלת מילים מקטגוריות נבחרות
   */
  getWordsFromSelectedCategories() {
    if (!this.vocabularyData) return [];
    
    const words = [];
    
    this.selectedCategories.forEach(categoryId => {
      if (this.vocabularyData[categoryId]) {
        words.push(...this.vocabularyData[categoryId]);
      }
    });
    
    return words;
  }
  
  /**
   * שמירת התקדמות המשתמש
   * @param {string} userId - מזהה המשתמש
   * @param {Object} progress - נתוני התקדמות
   */
  async saveUserProgress(userId, progress) {
    if (!userId) return;
    
    try {
      const userProgressRef = doc(db, 'userProgress', userId);
      await setDoc(userProgressRef, progress, { merge: true });
    } catch (error) {
      console.error('Error saving user progress:', error);
      throw error;
    }
  }
  
  /**
   * טעינת התקדמות המשתמש
   * @param {string} userId - מזהה המשתמש
   */
  async loadUserProgress(userId) {
    if (!userId) return null;
    
    try {
      const userProgressRef = doc(db, 'userProgress', userId);
      const docSnap = await getDoc(userProgressRef);
      
      if (docSnap.exists()) {
        return docSnap.data();
      }
      
      return null;
    } catch (error) {
      console.error('Error loading user progress:', error);
      throw error;
    }
  }
  
  /**
   * עדכון התקדמות מילה
   * @param {string} userId - מזהה המשתמש
   * @param {string} wordId - מזהה המילה
   * @param {string} category - קטגוריית המילה
   * @param {Object} wordProgress - התקדמות המילה
   */
  async updateWordProgress(userId, wordId, category, wordProgress) {
    if (!userId) return;
    
    try {
      const userProgressRef = doc(db, 'userProgress', userId);
      const progressPath = `words.${category}.${wordId}`;
      
      await updateDoc(userProgressRef, {
        [progressPath]: wordProgress
      });
    } catch (error) {
      console.error('Error updating word progress:', error);
      throw error;
    }
  }
}

// יצירת instance יחיד של השירות
const dataService = new DataService();

export default dataService;
