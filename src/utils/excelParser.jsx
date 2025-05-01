// src/utils/excelParser.js
import * as XLSX from 'xlsx';

/**
 * טוען את קובץ האקסל מה-GitHub ומחלץ את הנתונים הרלוונטיים
 * @returns {Promise<Object>} קטגוריות ונתונים מעובדים
 */
export const loadVocabularyData = async () => {
  try {
    // נשתמש בכתובת קבועה לקובץ האקסל ב-GitHub
    // שים לב: יש להחליף את הכתובת הזו לכתובת האמיתית של הקובץ שלך
    const excelUrl = 'https://raw.githubusercontent.com/Shique88/arabic-test/main/vocabulary.xlsx';
    
    const response = await fetch(excelUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch Excel file: ${response.status}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);
    
    // קריאת הקובץ בעזרת SheetJS
    const workbook = XLSX.read(data, { type: 'array' });
    
    // מצא את כל הגליונות שמכילים את האות P
    const pSheets = workbook.SheetNames.filter(name => name.includes('P'));
    
    // יוצר אובייקט למיפוי קטגוריות ונתונים
    const categoriesMap = {};
    const vocabularyData = {};
    
    pSheets.forEach(sheetName => {
      // יוצר שם קטגוריה ללא האות P
      const categoryName = sheetName.replace('P', '');
      
      // המר את הגיליון לאובייקטים של JSON
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet);
      
      // מעבד את הנתונים לפורמט אחיד
      const processedData = jsonData.map(item => {
        // סדר את המאפיינים בהתאם למבנה הצפוי
        return {
          id: item.__EMPTY || '',
          transcription: item['תעתיק'] || '',
          translation: item['פירוש'] || '',
          // שמירת שדות נוספים אם קיימים
          genderOrForm: item['זכר/נקבה'] || '',
          singularOrPlural: item['יחיד/רבים'] || '',
          example1: item['דוגמא'] || '',
          example2: item['דוגמא 2'] || '',
          context: item['הקשר'] || '',
          // מאפיינים לשימוש מערכת ה-SRS
          reviewDate: null,
          proficiency: 0, // 0-5 רמת שליטה
          reviewCount: 0
        };
      });
      
      categoriesMap[categoryName] = sheetName;
      vocabularyData[categoryName] = processedData;
    });
    
    return {
      categories: Object.keys(categoriesMap).map(name => ({
        id: name,
        name: name,
        originalName: categoriesMap[name],
        count: vocabularyData[name].length
      })),
      vocabularyData
    };
  } catch (error) {
    console.error('Error loading Excel data:', error);
    throw error;
  }
};

/**
 * מחלץ מילים אקראיות מקטגוריות נבחרות
 * @param {Object} data - נתוני אוצר מילים
 * @param {Array<string>} selectedCategories - קטגוריות נבחרות
 * @param {number} count - מספר המילים לשליפה
 * @returns {Array<Object>} מילים אקראיות
 */
export const getRandomWords = (data, selectedCategories, count = 6) => {
  // יצירת מערך של כל המילים מהקטגוריות הנבחרות
  const allWords = [];
  
  selectedCategories.forEach(category => {
    if (data[category]) {
      allWords.push(...data[category]);
    }
  });
  
  // אם אין מספיק מילים, החזר את כל מה שיש
  if (allWords.length <= count) {
    return allWords;
  }
  
  // ערבוב המערך ובחירת המילים הראשונות
  const shuffled = [...allWords].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};
