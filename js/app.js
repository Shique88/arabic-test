// Start the application when the document is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the app
    initApp();
});

// Initialize app when auth state changes
auth.onAuthStateChanged(user => {
    if (user) {
        // User is signed in, load data if needed
        if (!categories || categories.length === 0) {
            initApp();
        } else {
            // Just update the categories with user progress
            initCategories();
        }
    }
});

// Event listener for Excel file changes
// This could be tied to a manual refresh button
function refreshData() {
    // Clear data cache
    vocabularyData = {};
    categories = [];
    
    // Reload data
    initApp();
}

// Add a refresh button to the UI
const headerElement = document.querySelector('header');
const refreshButton = document.createElement('button');
refreshButton.id = 'refresh-btn';
refreshButton.innerHTML = '&#x21bb; רענן נתונים'; 
refreshButton.addEventListener('click', refreshData);
refreshButton.style.marginRight = 'auto';

// Insert after the header title
headerElement.insertBefore(refreshButton, headerElement.children[1]);
// DOM Elements for Navigation
const navExerciseBtn = document.getElementById('nav-exercise');
const navProgressBtn = document.getElementById('nav-progress');
const exerciseSection = document.getElementById('category-selection');
const progressScreen = document.getElementById('progress-screen');
const progressStats = document.getElementById('progress-stats');

// Initialize the application
async function initApp() {
    try {
        // Show loading screen
        document.getElementById('loading-screen').style.display = 'flex';
        document.getElementById('category-selection').style.display = 'none';
        
        // Load vocabulary data from Excel file
        const data = await loadVocabularyData();
        
        // Initialize categories
        initCategories();
        
        // Hide loading screen
        document.getElementById('loading-screen').style.display = 'none';
        
        // If user is logged in, show category selection
        if (auth.currentUser) {
            document.getElementById('category-selection').style.display = 'block';
        }
        
        // Initialize progress screen if user is logged in
        if (auth.currentUser && window.userProgress) {
            initProgressScreen();
        }
    } catch (error) {
        console.error('Error initializing app:', error);
    }
}

// Initialize the progress screen
function initProgressScreen() {
    if (!window.userProgress) return;
    
    // Clear existing progress stats
    progressStats.innerHTML = '';
    
    // Get total completed exercises
    const totalCompleted = window.userProgress.completedExercises || 0;
    
    // Create total stats element
    const totalStats = document.createElement('div');
    totalStats.className = 'progress-total';
    
    const totalTitle = document.createElement('h3');
    totalTitle.textContent = 'סך הכל תרגילים';
    
    const totalCount = document.createElement('p');
    totalCount.textContent = `${totalCompleted} תרגילים הושלמו`;
    
    totalStats.appendChild(totalTitle);
    totalStats.appendChild(totalCount);
    progressStats.appendChild(totalStats);
    
    // Add category-specific stats
    const categoryStats = window.userProgress.categoryStats || {};
    
    for (const categoryId in categoryStats) {
        if (categoryStats.hasOwnProperty(categoryId)) {
            const stats = categoryStats[categoryId];
            
            // Create category stats element
            const categoryElement = document.createElement('div');
            categoryElement.className = 'progress-category';
            
            const categoryTitle = document.createElement('h3');
            categoryTitle.textContent = categoryId;
            
            const attemptsText = document.createElement('p');
            attemptsText.textContent = `תרגילים: ${stats.attempted}`;
            
            const correctText = document.createElement('p');
            correctText.textContent = `מילים נכונות: ${stats.correct} מתוך ${stats.attempted * 6}`;
            
            const progressPercent = Math.round((stats.correct / (stats.attempted * 6)) * 100);
            
            const percentText = document.createElement('p');
            percentText.textContent = `${progressPercent}% הצלחה`;
            
            // Create progress bar
            const progressBarContainer = document.createElement('div');
            progressBarContainer.className = 'progress-bar-container';
            
            const progressBar = document.createElement('div');
            progressBar.className = 'progress-bar';
            progressBar.style.width = `${progressPercent}%`;
            
            progressBarContainer.appendChild(progressBar);
            
            // Add all elements to the category container
            categoryElement.appendChild(categoryTitle);
            categoryElement.appendChild(attemptsText);
            categoryElement.appendChild(correctText);
            categoryElement.appendChild(percentText);
            categoryElement.appendChild(progressBarContainer);
            
            // Add to progress stats
            progressStats.appendChild(categoryElement);
        }
    }
}

// Navigation between screens
navExerciseBtn.addEventListener('click', () => {
    // Show exercise screen, hide progress screen
    exerciseSection.style.display = 'block';
    exerciseScreen.style.display = 'none';
    resultsScreen.style.display = 'none';
    progressScreen.style.display = 'none';
    
    // Update navigation buttons
    navExerciseBtn.classList.add('active');
    navProgressBtn.classList.remove('active');
});

navProgressBtn.addEventListener('click', () => {
    // Check if user is logged in
    if (!auth.currentUser) {
        alert('יש להתחבר כדי לצפות בהתקדמות');
        return;
    }
    
    // Update progress screen with latest data
    initProgressScreen();
    
    // Show progress screen, hide other screens
    exerciseSection.style.display = 'none';
    exerciseScreen.style.display = 'none';
    resultsScreen.style.display = 'none';
    progressScreen.style.display = 'block';
    
    // Update navigation buttons
    navExerciseBtn.classList.remove('active');
    navProgressBtn.classList.add('active');
});
