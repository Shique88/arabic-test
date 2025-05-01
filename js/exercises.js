// DOM Elements
const categorySelection = document.getElementById('category-selection');
const exerciseScreen = document.getElementById('exercise-screen');
const resultsScreen = document.getElementById('results-screen');
const categoriesContainer = document.getElementById('categories');
const categoryTitle = document.getElementById('category-title');
const arabicWordsContainer = document.getElementById('arabic-words');
const hebrewWordsContainer = document.getElementById('hebrew-words');
const progressText = document.getElementById('progress-text');
const timerElement = document.getElementById('timer');
const checkBtn = document.getElementById('check-btn');
const nextBtn = document.getElementById('next-btn');
const backBtn = document.getElementById('back-btn');
const newExerciseBtn = document.getElementById('new-exercise-btn');
const backToCategoriesBtn = document.getElementById('back-to-categories-btn');

// Exercise state
let currentExercise = null;
let currentCategory = null;
let selectedArabic = null;
let selectedHebrew = null;
let matchedPairs = [];
let timerInterval = null;
let startTime = null;
let elapsedTime = 0;

// Initialize categories
function initCategories() {
    // Clear existing categories
    categoriesContainer.innerHTML = '';
    
    // Add category cards
    categories.forEach(category => {
        const categoryCard = document.createElement('div');
        categoryCard.className = 'category-card';
        categoryCard.dataset.category = category.id;
        
        const categoryName = document.createElement('h3');
        categoryName.textContent = category.name;
        
        const categoryCount = document.createElement('p');
        categoryCount.textContent = `${category.count} מילים`;
        
        categoryCard.appendChild(categoryName);
        categoryCard.appendChild(categoryCount);
        
        // Add progress information if available
        if (window.userProgress && window.userProgress.categoryStats && window.userProgress.categoryStats[category.id]) {
            const stats = window.userProgress.categoryStats[category.id];
            const progressInfo = document.createElement('div');
            progressInfo.className = 'category-progress';
            
            const progressPercent = Math.round((stats.correct / (stats.attempted * 6)) * 100);
            
            const progressText = document.createElement('p');
            progressText.textContent = `התקדמות: ${progressPercent}%`;
            
            const progressBarContainer = document.createElement('div');
            progressBarContainer.className = 'progress-bar-container';
            
            const progressBar = document.createElement('div');
            progressBar.className = 'progress-bar';
            progressBar.style.width = `${progressPercent}%`;
            
            progressBarContainer.appendChild(progressBar);
            progressInfo.appendChild(progressText);
            progressInfo.appendChild(progressBarContainer);
            
            categoryCard.appendChild(progressInfo);
        }
        
        // Add click event
        categoryCard.addEventListener('click', () => startExercise(category.id));
        
        categoriesContainer.appendChild(categoryCard);
    });
}

// Start a new exercise
function startExercise(categoryId) {
    currentCategory = categoryId;
    
    // Display correct category name (without the P)
    categoryTitle.textContent = categoryId;
    
    // Generate exercise
    currentExercise = generateExercise(categoryId);
    
    if (!currentExercise) {
        alert('שגיאה בטעינת התרגיל, אנא נסה שנית');
        return;
    }
    
    // Reset exercise state
    selectedArabic = null;
    selectedHebrew = null;
    matchedPairs = [];
    
    // Clear selected elements
    const selectedElements = document.querySelectorAll('.word-card.selected');
    selectedElements.forEach(el => el.classList.remove('selected'));
    
    // Update UI
    updateExerciseUI();
    
    // Show exercise screen
    categorySelection.style.display = 'none';
    exerciseScreen.style.display = 'block';
    resultsScreen.style.display = 'none';
    
    // Start timer
    startTimer();
}

// Update exercise UI
function updateExerciseUI() {
    // Clear containers
    arabicWordsContainer.innerHTML = '';
    hebrewWordsContainer.innerHTML = '';
    
    // Get words to display
    const { arabicWords, hebrewWords } = prepareWordsForDisplay();
    
    // Add Arabic words
    arabicWords.forEach(word => {
        const wordCard = createWordCard(word, 'arabic');
        arabicWordsContainer.appendChild(wordCard);
    });
    
    // Add Hebrew words
    hebrewWords.forEach(word => {
        const wordCard = createWordCard(word, 'hebrew');
        hebrewWordsContainer.appendChild(wordCard);
    });
    
    // Update progress text
    progressText.textContent = `${matchedPairs.length}/6`;
    
    // Update check button state
    checkBtn.disabled = !(selectedArabic && selectedHebrew);
}

// Prepare words for display (shuffle translations)
function prepareWordsForDisplay() {
    // Filter out matched pairs
    const unmatchedPairs = currentExercise.wordPairs.filter(
        pair => !matchedPairs.includes(pair.id)
    );
    
    // Get matched pairs
    const matchedPairsData = currentExercise.wordPairs.filter(
        pair => matchedPairs.includes(pair.id)
    );
    
    // Create arrays for both columns
    const arabicWords = [
        ...unmatchedPairs.map(pair => ({ id: pair.id, text: pair.arabic, matched: false })),
        ...matchedPairsData.map(pair => ({ id: pair.id, text: pair.arabic, matched: true }))
    ];
    
    const hebrewWords = [
        ...unmatchedPairs.map(pair => ({ id: pair.id, text: pair.hebrew, matched: false })),
        ...matchedPairsData.map(pair => ({ id: pair.id, text: pair.hebrew, matched: true }))
    ];
    
    // Shuffle the unmatched Hebrew words
    const unmatchedHebrewWords = hebrewWords.filter(word => !word.matched);
    shuffleArray(unmatchedHebrewWords);
    
    // Replace the unmatched Hebrew words with the shuffled ones
    let unmatchedIndex = 0;
    for (let i = 0; i < hebrewWords.length; i++) {
        if (!hebrewWords[i].matched) {
            hebrewWords[i] = unmatchedHebrewWords[unmatchedIndex++];
        }
    }
    
    return { arabicWords, hebrewWords };
}

// Create a word card element
function createWordCard(word, type) {
    const wordCard = document.createElement('div');
    wordCard.className = 'word-card';
    wordCard.dataset.id = word.id;
    wordCard.dataset.type = type;
    wordCard.textContent = word.text;
    
    // If already matched, mark as matched
    if (word.matched) {
        wordCard.classList.add('matched');
        return wordCard;
    }
    
    // Add click event for selection
    wordCard.addEventListener('click', () => {
        if (word.matched) return; // Ignore if already matched
        
        // Deselect current word of same type if any
        const currentSelected = type === 'arabic' ? selectedArabic : selectedHebrew;
        if (currentSelected) {
            document.querySelector(`.word-card[data-type="${type}"][data-id="${currentSelected}"]`)
                .classList.remove('selected');
        }
        
        // Update selection state
        if (type === 'arabic') {
            selectedArabic = word.id === selectedArabic ? null : word.id;
        } else {
            selectedHebrew = word.id === selectedHebrew ? null : word.id;
        }
        
        // Update UI
        if ((type === 'arabic' && selectedArabic === word.id) || 
            (type === 'hebrew' && selectedHebrew === word.id)) {
            wordCard.classList.add('selected');
        }
        
        // Update check button state
        checkBtn.disabled = !(selectedArabic && selectedHebrew);
    });
    
    return wordCard;
}

// Check if the selected pair is correct
function checkSelectedPair() {
    if (!selectedArabic || !selectedHebrew) return;
    
    // Check if the IDs match (correct pair)
    const isCorrect = selectedArabic === selectedHebrew;
    
    if (isCorrect) {
        // Add to matched pairs
        matchedPairs.push(selectedArabic);
        
        // Reset selection
        selectedArabic = null;
        selectedHebrew = null;
        
        // Update UI
        updateExerciseUI();
        
        // Check if exercise is complete
        if (matchedPairs.length === currentExercise.wordPairs.length) {
            completeExercise();
        }
    } else {
        // Show error feedback
        const arabicCard = document.querySelector(`.word-card[data-type="arabic"][data-id="${selectedArabic}"]`);
        const hebrewCard = document.querySelector(`.word-card[data-type="hebrew"][data-id="${selectedHebrew}"]`);
        
        arabicCard.classList.add('error');
        hebrewCard.classList.add('error');
        
        // Reset selection after a delay
        setTimeout(() => {
            arabicCard.classList.remove('error', 'selected');
            hebrewCard.classList.remove('error', 'selected');
            selectedArabic = null;
            selectedHebrew = null;
            checkBtn.disabled = true;
        }, 1000);
    }
}

// Complete the exercise
function completeExercise() {
    // Stop timer
    stopTimer();
    
    // Calculate score
    const score = matchedPairs.length;
    
    // Save progress
    if (auth.currentUser) {
        saveProgress(currentCategory, { score, time: elapsedTime });
    }
    
    // Show results screen
    exerciseScreen.style.display = 'none';
    resultsScreen.style.display = 'block';
    
    // Update results information
    document.getElementById('time-taken').textContent = formatTime(elapsedTime);
    document.getElementById('correct-answers').textContent = score;
}

// Timer functions
function startTimer() {
    // Reset timer
    elapsedTime = 0;
    timerElement.textContent = '00:00';
    startTime = Date.now();
    
    // Start interval
    timerInterval = setInterval(updateTimer, 1000);
}

function updateTimer() {
    elapsedTime = Math.floor((Date.now() - startTime) / 1000);
    timerElement.textContent = formatTime(elapsedTime);
}

function stopTimer() {
    clearInterval(timerInterval);
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Helper function to shuffle an array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Event Listeners
checkBtn.addEventListener('click', checkSelectedPair);

nextBtn.addEventListener('click', () => {
    startExercise(currentCategory);
});

backBtn.addEventListener('click', () => {
    stopTimer();
    exerciseScreen.style.display = 'none';
    categorySelection.style.display = 'block';
});

newExerciseBtn.addEventListener('click', () => {
    startExercise(currentCategory);
});

backToCategoriesBtn.addEventListener('click', () => {
    resultsScreen.style.display = 'none';
    categorySelection.style.display = 'block';
});
