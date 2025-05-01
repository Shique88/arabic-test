// src/components/VocabularyManager/CategorySelector.js
import React, { useState, useEffect } from 'react';
import dataService from '../../services/dataService';
import '../../styles/CategorySelector.css';

const CategorySelector = () => {
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // טעינת קטגוריות האוצר מילים
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // אתחול שירות הנתונים אם צריך
        if (!dataService.initialized) {
          await dataService.initialize();
        }
        
        // קבלת רשימת הקטגוריות
        const allCategories = dataService.getCategories();
        setCategories(allCategories);
        
        // טעינת הקטגוריות הנבחרות (ברירת מחדל: כולן)
        const selected = dataService.getSelectedCategories();
        setSelectedCategories(selected);
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading categories:', err);
        setError('אירעה שגיאה בטעינת הקטגוריות');
        setIsLoading(false);
      }
    };

    loadCategories();
  }, []);

  // עדכון הקטגוריות הנבחרות
  const handleCategoryChange = (categoryId) => {
    let updatedSelection;
    
    if (selectedCategories.includes(categoryId)) {
      // הסרת קטגוריה אם היא כבר נבחרה
      updatedSelection = selectedCategories.filter(id => id !== categoryId);
    } else {
      // הוספת קטגוריה אם היא לא נבחרה
      updatedSelection = [...selectedCategories, categoryId];
    }
    
    // עדכון ה-state המקומי
    setSelectedCategories(updatedSelection);
    
    // עדכון השירות עם הבחירה החדשה
    dataService.selectCategories(updatedSelection);
  };

  // בחירת כל הקטגוריות
  const selectAllCategories = () => {
    const allCategoryIds = categories.map(category => category.id);
    setSelectedCategories(allCategoryIds);
    dataService.selectCategories(allCategoryIds);
  };

  // ביטול בחירת כל הקטגוריות
  const deselectAllCategories = () => {
    setSelectedCategories([]);
    dataService.selectCategories([]);
  };

  return (
    <div className="category-selector">
      <h2>בחירת קטגוריות ללימוד</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      {isLoading ? (
        <div className="loading">טוען קטגוריות...</div>
      ) : (
        <>
          <div className="category-actions">
            <button 
              className="select-all-btn" 
              onClick={selectAllCategories}
              disabled={categories.length === selectedCategories.length}
            >
              בחר הכל
            </button>
            <button 
              className="deselect-all-btn" 
              onClick={deselectAllCategories}
              disabled={selectedCategories.length === 0}
            >
              נקה הכל
            </button>
          </div>
          
          <div className="categories-list">
            {categories.map(category => (
              <div key={category.id} className="category-item">
                <label className="category-label">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category.id)}
                    onChange={() => handleCategoryChange(category.id)}
                  />
                  <span className="category-name">{category.name}</span>
                  <span className="category-count">({category.count})</span>
                </label>
              </div>
            ))}
          </div>
          
          <div className="selection-summary">
            <p>נבחרו {selectedCategories.length} מתוך {categories.length} קטגוריות</p>
          </div>
        </>
      )}
    </div>
  );
};

export default CategorySelector;
