// Main application initialization
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM loaded, initializing app");
    
    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    
    // Get Firebase services
    window.auth = firebase.auth();
    window.db = firebase.firestore();
    
    // Initialize the auth state observer
    initAuthObserver();
    
    // Set up button click handlers for modes
    initializeModeButtons();
    
    // Load SRS data
    loadFromLocalStorage();
    
    // Load vocabulary data
    loadDefaultExcelFile();
    
    console.log("App initialization complete");
});

// Initialize the mode buttons
function initializeModeButtons() {
    // Flashcard mode button
    flashcardModeButton.addEventListener('click', function() {
        switchToMode('flashcard');
    });
    
    // Test mode button
    testModeButton.addEventListener('click', function() {
        switchToMode('test');
    });
    
    // Reset progress button
    resetProgressBtn.addEventListener('click', function() {
        confirmResetContainer.style.display = 'block';
    });
    
    // Confirm reset - Yes
    confirmResetYes.addEventListener('click', function() {
        resetUserProgress();
    });
    
    // Confirm reset - No
    confirmResetNo.addEventListener('click', function() {
        confirmResetContainer.style.display = 'none';
    });
}

// Function to switch between modes
function switchToMode(mode) {
    if (mode === 'flashcard') {
        flashcardContainer.style.display = 'block';
        testContainer.style.display = 'none';
        flashcardModeButton.classList.add('active');
        testModeButton.classList.remove('active');
        // Update the current card if needed
        if (currentWords.length > 0) {
            updateCard();
        }
    } else if (mode === 'test') {
        flashcardContainer.style.display = 'none';
        testContainer.style.display = 'block';
        flashcardModeButton.classList.remove('active');
        testModeButton.classList.add('active');
        // Initialize the test mode
        initializeTestMode();
    }
}

// Reset user progress
function resetUserProgress() {
    if (!currentUser) return;
    
    try {
        // Clear learned words
        learnedWords = new Set();
        
        // Reset SRS data
        srsData = {};
        
        // Update Firebase
        db.collection('users').doc(currentUser.uid).update({
            progress: {},
            srs: {},
            lastReset: firebase.firestore.FieldValue.serverTimestamp()
        })
        .then(() => {
            console.log('Progress reset successfully');
            
            // Hide confirmation dialog
            confirmResetContainer.style.display = 'none';
            
            // Update UI
            updateStats();
            updateSRSDisplay();
            if (flashcardContainer.style.display !== 'none') {
                updateCard();
            }
            
            // Show success message
            alert('ההתקדמות שלך אופסה בהצלחה.');
        })
        .catch((error) => {
            console.error('Error resetting progress:', error);
            alert('שגיאה באיפוס ההתקדמות. נסה שוב מאוחר יותר.');
        });
    } catch (error) {
        console.error('Error in resetUserProgress:', error);
    }
}

// Function to shuffle an array (Fisher-Yates algorithm)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Update statistics display
function updateStats() {
    const total = currentWords.length;
    const learned = currentWords.filter(word => learnedWords.has(word.id)).length;
    const remaining = total - learned;
    const progress = total > 0 ? Math.round((learned / total) * 100) : 0;
    
    learnedCountElement.textContent = learned;
    remainingCountElement.textContent = remaining;
    totalCountElement.textContent = total;
    progressBar.value = progress;
    progressText.textContent = `${progress}%`;
    
    // Also update SRS stats
    updateSRSStats();
}

// Function to update SRS stats display
function updateSRSStats() {
    // Only try to update if the elements exist
    const dueCountElement = document.getElementById('due-count');
    const newCountElement = document.getElementById('new-count');
    const masteredCountElement = document.getElementById('mastered-count');
    
    if (dueCountElement && newCountElement && masteredCountElement) {
        const dueWords = getDueWords().length;
        
        // New words - level 0
        const newWords = Object.values(srsData).filter(s => s.level === 0).length;
        
        // Mastered words - level 5
        const masteredWords = Object.values(srsData).filter(s => s.level === 5).length;
        
        dueCountElement.textContent = dueWords;
        newCountElement.textContent = newWords;
        masteredCountElement.textContent = masteredWords;
    }
}

// Function to update all SRS-related displays
function updateSRSDisplay() {
    updateSRSStats();
    
    // Update the current word's SRS display if applicable
    if (currentWords.length > 0 && currentIndex < currentWords.length) {
        const currentWord = currentWords[currentIndex];
        updateWordSRSDisplay(currentWord.id);
    }
}

// Global variables - reference to DOM elements
const flashcardModeButton = document.getElementById('flashcard-mode-button');
const testModeButton = document.getElementById('test-mode-button');
const flashcardContainer = document.getElementById('flashcard-container');
const testContainer = document.getElementById('test-container');
const resetProgressBtn = document.getElementById('reset-progress-btn');
const confirmResetContainer = document.getElementById('confirm-reset-container');
const confirmResetYes = document.getElementById('confirm-reset-yes');
const confirmResetNo = document.getElementById('confirm-reset-no');
const learnedCountElement = document.getElementById('learned-count');
const remainingCountElement = document.getElementById('remaining-count');
const totalCountElement = document.getElementById('total-count');
const progressBar = document.getElementById('progress');
const progressText = document.getElementById('progress-text');
const dataInfo = document.getElementById('data-info');
const sheetsInfo = document.getElementById('sheets-info');
const statusIndicator = document.getElementById('status-indicator');
const categoriesContainer = document.getElementById('categories');

// Global state variables
let currentUser = null;
let userProgress = {};
let vocabulary = [];
let currentWords = [];
let currentIndex = 0;
let categories = [];
let learnedWords = new Set();
let sheetData = {}; // Store data by sheet
let currentCategory = 'all';
let srsData = {};
