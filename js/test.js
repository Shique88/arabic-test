// Test mode variables
let testWords = [];
let selectedArabicItem = null;
let selectedHebrewItem = null;
let matchedPairs = 0;
const TEST_PAIR_COUNT = 6; // Number of word pairs in the test

// Initialize the test mode with randomly selected words
function initializeTestMode() {
    // Reset test state
    testWords = [];
    selectedArabicItem = null;
    selectedHebrewItem = null;
    matchedPairs = 0;
    
    const arabicColumn = document.getElementById('arabic-column');
    const hebrewColumn = document.getElementById('hebrew-column');
    const testFeedback = document.getElementById('test-feedback');
    
    arabicColumn.innerHTML = '';
    hebrewColumn.innerHTML = '';
    testFeedback.textContent = '';
    testFeedback.style.color = '';
    
    // Get filtered vocabulary based on current category
    let availableWords = currentCategory === 'all' 
        ? vocabulary 
        : vocabulary.filter(word => word.category === currentCategory);
    
    // If we don't have enough words in this category, use all words
    if (availableWords.length < TEST_PAIR_COUNT) {
        availableWords = vocabulary;
    }
    
    // Get words due for review based on SRS
    const dueWords = availableWords.filter(word => isDueForReview(word.id));
    
    // If we have enough due words, prioritize them
    if (dueWords.length >= TEST_PAIR_COUNT) {
        // Prioritize the due words using SRS data
        const prioritizedDueWords = prioritizeWords(dueWords);
        testWords = prioritizedDueWords.slice(0, TEST_PAIR_COUNT);
    } else {
        // Not enough due words, use some due words and some random words
        const prioritizedDueWords = prioritizeWords(dueWords);
        const nonDueWords = availableWords.filter(word => !isDueForReview(word.id));
        const shuffledNonDueWords = shuffleArray([...nonDueWords]);
        
        // Fill with due words first
        testWords = [...prioritizedDueWords];
        
        // Then add random non-due words until we reach TEST_PAIR_COUNT
        const remainingCount = TEST_PAIR_COUNT - testWords.length;
        if (remainingCount > 0 && shuffledNonDueWords.length > 0) {
            testWords = [...testWords, ...shuffledNonDueWords.slice(0, remainingCount)];
        }
        
        // If we still don't have enough, just use random words
        if (testWords.length < TEST_PAIR_COUNT) {
            const shuffledAllWords = shuffleArray([...availableWords]);
            testWords = shuffledAllWords.slice(0, TEST_PAIR_COUNT);
        }
    }
    
    // Create the matching game UI
    createMatchingGame(testWords);
}

// Create the matching game UI
function createMatchingGame(words) {
    const arabicColumn = document.getElementById('arabic-column');
    const hebrewColumn = document.getElementById('hebrew-column');
    
    // Create arrays for Arabic and Hebrew items
    const arabicItems = words.map(word => ({ id: word.id, text: word.arabic }));
    const hebrewItems = words.map(word => ({ id: word.id, text: word.hebrew }));
    
    // Shuffle the arrays to randomize the order
    shuffleArray(arabicItems);
    shuffleArray(hebrewItems);
    
    // Create and append elements for Arabic column
    arabicItems.forEach(item => {
        const element = document.createElement('div');
        element.className = 'matching-item';
        element.textContent = item.text;
        element.dataset.id = item.id;
        
        // Add SRS level class
        const srs = srsData[item.id] || { level: 0 };
        element.classList.add(`level-${srs.level}`);
        
        element.addEventListener('click', handleArabicItemClick);
        arabicColumn.appendChild(element);
    });
    
    // Create and append elements for Hebrew column
    hebrewItems.forEach(item => {
        const element = document.createElement('div');
        element.className = 'matching-item';
        element.textContent = item.text;
        element.dataset.id = item.id;
        
        // Add SRS level class
        const srs = srsData[item.id] || { level: 0 };
        element.classList.add(`level-${srs.level}`);
        
        element.addEventListener('click', handleHebrewItemClick);
        hebrewColumn.appendChild(element);
    });
}

// Handle click on Arabic item
function handleArabicItemClick(event) {
    // If the item is already matched, do nothing
    if (event.currentTarget.classList.contains('matched')) {
        return;
    }
    
    // Deselect previous Arabic item if any
    if (selectedArabicItem) {
        selectedArabicItem.classList.remove('selected');
    }
    
    // Select the clicked item
    selectedArabicItem = event.currentTarget;
    selectedArabicItem.classList.add('selected');
    
    // Check for match if both columns have a selection
    if (selectedHebrewItem) {
        checkForMatch();
    }
}

// Handle click on Hebrew item
function handleHebrewItemClick(event) {
    // If the item is already matched, do nothing
    if (event.currentTarget.classList.contains('matched')) {
        return;
    }
    
    // Deselect previous Hebrew item if any
    if (selectedHebrewItem) {
        selectedHebrewItem.classList.remove('selected');
    }
    
    // Select the clicked item
    selectedHebrewItem = event.currentTarget;
    selectedHebrewItem.classList.add('selected');
    
    // Check for match if both columns have a selection
    if (selectedArabicItem) {
        checkForMatch();
    }
}

// Check if the selected items match
function checkForMatch() {
    const testFeedback = document.getElementById('test-feedback');
    const arabicId = selectedArabicItem.dataset.id;
    const hebrewId = selectedHebrewItem.dataset.id;
    
    if (arabicId === hebrewId) {
        // It's a match!
        selectedArabicItem.classList.add('matched');
        selectedHebrewItem.classList.add('matched');
        selectedArabicItem.classList.remove('selected');
        selectedHebrewItem.classList.remove('selected');
        
        // Add animation effect for match
        selectedArabicItem.style.animation = 'matchSuccess 0.5s';
        selectedHebrewItem.style.animation = 'matchSuccess 0.5s';
        
        // Mark this word as learned
        learnedWords.add(parseInt(arabicId));
        
        // Update SRS data - correct match
        updateSRS(arabicId, true);
        
        // Update internal match count
        matchedPairs++;
        
        // Display feedback
        testFeedback.textContent = 'התאמה נכונה!';
        testFeedback.style.color = '#27ae60';
        
        // Clear selections
        selectedArabicItem = null;
        selectedHebrewItem = null;
        
        // Check if all pairs are matched
        if (matchedPairs === TEST_PAIR_COUNT) {
            // Test completed
            setTimeout(() => {
                testFeedback.textContent = 'כל הכבוד! סיימת את המבחן!';
                
                // Add completion message with stats
                testFeedback.innerHTML += `<div class="test-stats">
                    <div>מילים שהתאמת: ${matchedPairs}</div>
                </div>`;
                
                // Save progress if logged in
                if (currentUser) {
                    saveUserProgress();
                }
                
                // Update stats
                updateStats();
                
                // Reset and show new words after 2 seconds
                setTimeout(() => {
                    initializeTestMode();
                }, 2000);
            }, 500);
        }
    } else {
        // Not a match - mark both words as difficult in SRS
        updateSRS(arabicId, false);
        updateSRS(hebrewId, false);
        
        // Display feedback
        testFeedback.textContent = 'לא התאמה, נסה שוב';
        testFeedback.style.color = '#e74c3c';
        
        // Add shake animation
        selectedArabicItem.style.animation = 'shake 0.5s';
        selectedHebrewItem.style.animation = 'shake 0.5s';
        
        // Clear animations after they complete
        const clearAnimation = () => {
            selectedArabicItem.style.animation = '';
            selectedHebrewItem.style.animation = '';
            selectedArabicItem.removeEventListener('animationend', clearAnimation);
        };
        
        selectedArabicItem.addEventListener('animationend', clearAnimation);
        
        // Clear selections after a brief delay
        setTimeout(() => {
            selectedArabicItem.classList.remove('selected');
            selectedHebrewItem.classList.remove('selected');
            selectedArabicItem = null;
            selectedHebrewItem = null;
        }, 1000);
    }
}

// Add keydown event listeners for keyboard navigation
document.addEventListener('keydown', function(event) {
    // Only handle keys if in test mode
    if (document.getElementById('test-container').style.display === 'none') {
        return;
    }
    
    switch(event.key) {
        case 'ArrowUp':
        case 'ArrowDown':
            // Navigate between items
            navigateTestItems(event.key);
            break;
        case 'Enter':
        case ' ': // Space key
            // Select currently focused item
            selectFocusedTestItem();
            break;
    }
});

// Function to navigate between test items using keyboard
function navigateTestItems(direction) {
    // Implement keyboard navigation here if needed
}

// Function to select the currently focused test item
function selectFocusedTestItem() {
    // Implement keyboard selection here if needed
}

// Add shake and success animations to CSS
document.addEventListener('DOMContentLoaded', function() {
    // Create a style element for animations
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        
        @keyframes matchSuccess {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); background-color: #e8f7f0; }
            100% { transform: scale(1); }
        }
    `;
    document.head.appendChild(styleElement);
});
