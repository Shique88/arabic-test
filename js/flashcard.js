// Initialize flashcard functionality
document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const flashcard = document.getElementById('flashcard');
    const flipButton = document.getElementById('flip');
    const prevButton = document.getElementById('prev');
    const nextButton = document.getElementById('next');
    const easyButton = document.getElementById('easy-button');
    const hardButton = document.getElementById('hard-button');
    
    // Set up button click handlers
    flashcard.addEventListener('click', flipCard);
    flipButton.addEventListener('click', flipCard);
    prevButton.addEventListener('click', showPreviousCard);
    nextButton.addEventListener('click', showNextCard);
    
    // SRS feedback buttons
    if (easyButton && hardButton) {
        easyButton.addEventListener('click', () => {
            if (currentWords.length === 0) return;
            const currentWord = currentWords[currentIndex];
            updateSRS(currentWord.id, true); // Mark as correct/easy
            updateWordSRSDisplay(currentWord.id);
            showNextCard();
        });
        
        hardButton.addEventListener('click', () => {
            if (currentWords.length === 0) return;
            const currentWord = currentWords[currentIndex];
            updateSRS(currentWord.id, false); // Mark as incorrect/hard
            updateWordSRSDisplay(currentWord.id);
            showNextCard();
        });
    }
});

// Flip the flashcard
function flipCard() {
    const flashcard = document.getElementById('flashcard');
    flashcard.classList.toggle('flipped');
    
    // Mark as learned when flipped to see translation
    if (flashcard.classList.contains('flipped') && currentWords.length > 0) {
        const currentWord = currentWords[currentIndex];
        learnedWords.add(currentWord.id);
        updateStats();
        
        // Save progress if logged in
        if (currentUser) {
            saveUserProgress();
        }
    }
}

// Show the next flashcard
function showNextCard() {
    if (currentIndex < currentWords.length - 1) {
        const flashcard = document.getElementById('flashcard');
        
        // First ensure card is showing front side
        if (flashcard.classList.contains('flipped')) {
            // Add transition end listener to update card after flip completes
            const updateAfterFlip = function() {
                currentIndex++;
                updateCard();
                updateControls();
                flashcard.removeEventListener('transitionend', updateAfterFlip);
            };
            
            flashcard.addEventListener('transitionend', updateAfterFlip);
            flashcard.classList.remove('flipped');
        } else {
            // If already showing front, just update normally
            currentIndex++;
            updateCard();
            updateControls();
        }
    }
}

// Show the previous flashcard
function showPreviousCard() {
    if (currentIndex > 0) {
        const flashcard = document.getElementById('flashcard');
        
        // First ensure card is showing front side
        if (flashcard.classList.contains('flipped')) {
            // Add transition end listener to update card after flip completes
            const updateAfterFlip = function() {
                currentIndex--;
                updateCard();
                updateControls();
                flashcard.removeEventListener('transitionend', updateAfterFlip);
            };
            
            flashcard.addEventListener('transitionend', updateAfterFlip);
            flashcard.classList.remove('flipped');
        } else {
            // If already showing front, just update normally
            currentIndex--;
            updateCard();
            updateControls();
        }
    }
}

// Update the flashcard content
function updateCard() {
    const wordElement = document.getElementById('word');
    const translationElement = document.getElementById('translation');
    const flashcard = document.getElementById('flashcard');
    
    if (currentWords.length === 0) {
        wordElement.textContent = 'אין מילים זמינות';
        translationElement.textContent = '';
        return;
    }
    
    const currentWord = currentWords[currentIndex];
    
    // Reset card to front side
    if (flashcard.classList.contains('flipped')) {
        flashcard.classList.remove('flipped');
    }
    
    wordElement.textContent = currentWord.arabic;
    translationElement.textContent = currentWord.hebrew;
    
    // Update SRS display for this word
    updateWordSRSDisplay(currentWord.id);
}

// Update navigation controls
function updateControls() {
    const prevButton = document.getElementById('prev');
    const nextButton = document.getElementById('next');
    
    prevButton.disabled = currentIndex === 0;
    nextButton.disabled = currentIndex === currentWords.length - 1;
}

// Switch to review mode (only due cards)
function enableReviewMode() {
    // Filter cards to only those due for review
    const dueWords = getDueWords();
    
    if (dueWords.length === 0) {
        alert('אין מילים לסקירה כרגע!');
        return;
    }
    
    // Prioritize the review deck
    currentWords = prioritizeWords(dueWords);
    currentIndex = 0;
    
    // Update UI
    updateCard();
    updateControls();
    updateStats();
    
    // Update mode buttons if they exist
    const studyModeButton = document.getElementById('study-mode-button');
    const reviewModeButton = document.getElementById('review-mode-button');
    
    if (studyModeButton && reviewModeButton) {
        studyModeButton.classList.remove('active');
        reviewModeButton.classList.add('active');
    }
}

// Switch to study mode (all cards in current category)
function disableReviewMode() {
    // Restore all words in the current category
    if (currentCategory === 'all') {
        currentWords = [...vocabulary];
    } else {
        currentWords = vocabulary.filter(word => word.category === currentCategory);
    }
    
    // Shuffle the words
    currentWords = shuffleArray([...currentWords]);
    currentIndex = 0;
    
    // Update UI
    updateCard();
    updateControls();
    updateStats();
    
    // Update mode buttons if they exist
    const studyModeButton = document.getElementById('study-mode-button');
    const reviewModeButton = document.getElementById('review-mode-button');
    
    if (studyModeButton && reviewModeButton) {
        studyModeButton.classList.add('active');
        reviewModeButton.classList.remove('active');
    }
}
