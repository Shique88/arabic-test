// src/utils/srsAlgorithm.js

/**
 * מרווחי זמן בימים לפי דרגת שליטה
 * @type {Array<number>}
 */
const INTERVALS = [
  0,     // רמה 0 - לא ידוע/חדש (היום)
  1,     // רמה 1 - למידה ראשונית (מחר)
  3,     // רמה 2 - זכירה חלקית (3 ימים)
  7,     // רמה 3 - זכירה טובה (שבוע)
  14,    // רמה 4 - זכירה חזקה (שבועיים)
  30,    // רמה 5 - שליטה מלאה (חודש)
];

/**
 * חישוב תאריך החזרה הבא לפי רמת השליטה
 * @param {number} proficiency - רמת השליטה (0-5)
 * @returns {Date} תאריך החזרה הבא
 */
export const calculateNextReviewDate = (proficiency) => {
  const level = Math.max(0, Math.min(5, proficiency));
  const daysToAdd = INTERVALS[level];
  
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + daysToAdd);
  
  return nextDate;
};

/**
 * עדכון רמת השליטה בהתאם לביצועים
 * @param {number} currentProficiency - רמת השליטה הנוכחית
 * @param {boolean} isCorrect - האם התשובה נכונה
 * @returns {number} רמת השליטה המעודכנת
 */
export const updateProficiency = (currentProficiency, isCorrect) => {
  // אם התשובה נכונה, נעלה רמה (עד מקסימום 5)
  if (isCorrect) {
    return Math.min(5, currentProficiency + 1);
  }
  
  // אם התשובה שגויה, נוריד רמה (לא פחות מ-0)
  return Math.max(0, currentProficiency - 1);
};

/**
 * קבלת הפריטים שיש לחזור עליהם היום
 * @param {Array<Object>} words - כל המילים הנלמדות
 * @returns {Array<Object>} מילים לחזרה היום
 */
export const getWordsForReview = (words) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return words.filter(word => {
    // אם אין תאריך חזרה, זו מילה חדשה שצריך ללמוד
    if (!word.reviewDate) {
      return true;
    }
    
    // השוואת תאריכים
    const reviewDate = new Date(word.reviewDate);
    reviewDate.setHours(0, 0, 0, 0);
    
    // בדיקה אם תאריך החזרה הוא היום או בעבר
    return reviewDate <= today;
  });
};

/**
 * עדכון המילה לאחר תרגול
 * @param {Object} word - המילה לעדכון
 * @param {boolean} isCorrect - האם התשובה נכונה
 * @returns {Object} המילה המעודכנת
 */
export const updateWordAfterReview = (word, isCorrect) => {
  const updatedWord = { ...word };
  
  // עדכון רמת השליטה
  updatedWord.proficiency = updateProficiency(word.proficiency || 0, isCorrect);
  
  // עדכון מספר החזרות
  updatedWord.reviewCount = (word.reviewCount || 0) + 1;
  
  // חישוב תאריך החזרה הבא
  updatedWord.reviewDate = calculateNextReviewDate(updatedWord.proficiency);
  
  return updatedWord;
};
