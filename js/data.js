// Variables to store vocabulary data
let vocabularyData = {};
let categories = [];

// GitHub repository information
const githubRepo = 'arabic-test'; // Replace with your actual GitHub repository name
const githubUser = 'Shique88'; // Replace with your GitHub username
const excelFilePath = 'vocabulary.xlsx'; // Path to the Excel file in your repository

// Function to fetch and parse the Excel file
async function loadVocabularyData() {
    try {
        // GitHub raw content URL
        const fileUrl = `https://raw.githubusercontent.com/${githubUser}/${githubRepo}/main/${excelFilePath}`;
        
        // Fetch the Excel file
        const response = await fetch(fileUrl);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch Excel file: ${response.status} ${response.statusText}`);
        }
        
        // Convert response to array buffer
        const data = await response.arrayBuffer();
        
        // Parse the Excel file
        const workbook = XLSX.read(new Uint8Array(data), { type: 'array' });
        
        // Process only sheets with 'P' in their name
        const relevantSheets = workbook.SheetNames.filter(name => name.includes('P'));
        
        // Clear existing data
        vocabularyData = {};
        categories = [];
        
        // Process each relevant sheet
        relevantSheets.forEach(sheetName => {
            // Convert sheet to JSON
            const sheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(sheet);
            
            // Clean and process the data
            const processedData = processSheetData(jsonData);
            
            // Add to vocabulary data
            const categoryName = sheetName.replace('P', '');
            vocabularyData[categoryName] = processedData;
            
            // Add to categories
            categories.push({
                id: categoryName,
                name: categoryName,
                count: processedData.length
            });
        });
        
        // Return processed data
        return {
            categories,
            vocabularyData
        };
    } catch (error) {
        console.error('Error loading vocabulary data:', error);
        showLoadingError(error.message);
        throw error;
    }
}

// Function to process sheet data
function processSheetData(jsonData) {
    return jsonData
        .filter(item => 
            // Ensure the item has both transliteration and translation
            item.תעתיק && item.פירוש
        )
        .map(item => ({
            id: item.__EMPTY || Math.random().toString(36).substr(2, 9),
            transliteration: item.תעתיק,
            translation: item.פירוש,
            extraInfo: getExtraInfo(item)
        }));
}

// Extract extra information from a vocabulary item
function getExtraInfo(item) {
    const extraInfo = {};
    
    // Add all relevant extra fields
    if (item['יחיד/רבים']) extraInfo.number = item['יחיד/רבים'];
    if (item['זכר/נקבה']) extraInfo.gender = item['זכר/נקבה'];
    if (item['דוגמא']) extraInfo.example = item['דוגמא'];
    if (item['דוגמא 2']) extraInfo.example2 = item['דוגמא 2'];
    if (item['הקשר']) extraInfo.context = item['הקשר'];
    
    return Object.keys(extraInfo).length > 0 ? extraInfo : null;
}

// Function to generate a random exercise from a specific category
function generateExercise(categoryName, count = 6) {
    const categoryData = vocabularyData[categoryName];
    
    // If category doesn't exist or has too few items
    if (!categoryData || categoryData.length < count) {
        console.error(`Category ${categoryName} doesn't exist or has too few items`);
        return null;
    }
    
    // Get random items from the category
    const shuffledItems = [...categoryData].sort(() => 0.5 - Math.random());
    const selectedItems = shuffledItems.slice(0, count);
    
    // Create exercise data
    return {
        category: categoryName,
        wordPairs: selectedItems.map(item => ({
            id: item.id,
            arabic: item.transliteration,
            hebrew: item.translation,
            extraInfo: item.extraInfo
        }))
    };
}

// Function to display loading error
function showLoadingError(message) {
    const loadingScreen = document.getElementById('loading-screen');
    const errorMessage = document.createElement('div');
    errorMessage.className = 'alert alert-error';
    errorMessage.textContent = `שגיאה בטעינת הנתונים: ${message}`;
    
    // Remove loader
    const loader = loadingScreen.querySelector('.loader');
    if (loader) {
        loader.style.display = 'none';
    }
    
    // Add error message
    loadingScreen.appendChild(errorMessage);
    
    // Add retry button
    const retryButton = document.createElement('button');
    retryButton.textContent = 'נסה שנית';
    retryButton.className = 'retry-btn';
    retryButton.style.marginTop = '1rem';
    retryButton.addEventListener('click', () => {
        // Remove error message and retry button
        errorMessage.remove();
        retryButton.remove();
        
        // Show loader again
        if (loader) {
            loader.style.display = 'block';
        }
        
        // Retry loading data
        initApp();
    });
    
    loadingScreen.appendChild(retryButton);
}

// Get a specific vocabulary item by ID
function getVocabularyItemById(id) {
    for (const categoryName in vocabularyData) {
        const item = vocabularyData[categoryName].find(item => item.id === id);
        if (item) return item;
    }
    return null;
}

// Save user progress to Firestore
function saveProgress(categoryName, result) {
    const user = auth.currentUser;
    
    if (!user) {
        console.warn('User not logged in, progress not saved');
        return;
    }
    
    const userRef = db.collection('users').doc(user.uid);
    
    // Update Firestore with transaction to prevent race conditions
    return db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        
        if (!userDoc.exists) {
            // Create user document if it doesn't exist
            transaction.set(userRef, {
                email: user.email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                progress: {
                    completedExercises: 1,
                    categoryStats: {
                        [categoryName]: {
                            attempted: 1,
                            correct: result.score
                        }
                    }
                }
            });
            return;
        }
        
        // Get current user data
        const userData = userDoc.data();
        const progress = userData.progress || {
            completedExercises: 0,
            categoryStats: {}
        };
        
        // Get current category stats or initialize them
        const categoryStats = progress.categoryStats || {};
        const currentCategoryStats = categoryStats[categoryName] || { attempted: 0, correct: 0 };
        
        // Update with new exercise results
        const updatedCategoryStats = {
            ...categoryStats,
            [categoryName]: {
                attempted: currentCategoryStats.attempted + 1,
                correct: currentCategoryStats.correct + result.score
            }
        };
        
        // Update user document
        transaction.update(userRef, {
            'progress.completedExercises': progress.completedExercises + 1,
            'progress.categoryStats': updatedCategoryStats,
            'progress.lastUpdated': firebase.firestore.FieldValue.serverTimestamp()
        });
    });
}
