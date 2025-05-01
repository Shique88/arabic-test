// Define spaced repetition intervals (in days) for each level
const srsIntervals = {
    0: 0,     // New word - review immediately
    1: 1,     // Review after 1 day
    2: 3,     // Review after 3 days
    3: 7,     // Review after 1 week
    4: 14,    // Review after 2 weeks
    5: 30     // Review after 1 month
};

// Function to calculate next review date based on SRS level
function calculateNextReview(level) {
    const today = new Date();
    const nextDate = new Date();
    nextDate.setDate(today.getDate() + srsIntervals[level]);
    return nextDate;
}

// Function to initialize SRS data for a word
function initializeSRS(wordId) {
    return {
        level: 0,
        lastReviewed: null,
        nextReview: new Date(), // Due immediately
        failCount: 0
    };
}

// Function to update SRS data when a word is reviewed
function updateSRS(wordId, isCorrect) {
    // Get current SRS data or initialize if it doesn't exist
    const srs = srsData[wordId] || initializeSRS(wordId);
    const today = new Date();
    
    if (isCorrect) {
        // Word was matched correctly - move up a level (max 5)
        srs.level = Math.min(5, srs.level + 1);
    } else {
        // Word was difficult - move down a level (min 0)
        srs.level = Math.max(0, srs.level - 1);
        srs.failCount = (srs.failCount || 0) + 1;
    }
    
    // Update review timestamps
    srs.lastReviewed = today;
    srs.nextReview = calculateNextReview(srs.level);
    
    // Update the global srsData object
    srsData[wordId] = srs;
    
    // Save to Firebase if user is logged in
    if (currentUser) {
        saveSRSToFirebase(wordId, srs);
    } else {
        // If not logged in, save to localStorage
        saveToLocalStorage();
    }
    
    return srs;
}

// Function to check if a word is due for review
function isDueForReview(wordId) {
    const srs = srsData[wordId];
    if (!srs || !srs.nextReview) return true; // New words are always due
    
    const today = new Date();
    return new Date(srs.nextReview) <= today;
}

// Function to get words due for review today
function getDueWords() {
    return vocabulary.filter(word => isDueForReview(word.id));
}

// Function to prioritize words for the matching game or review
function prioritizeWords(words) {
    return [...words].sort((a, b) => {
        // First priority: Words due for review today
        const aIsDue = isDueForReview(a.id);
        const bIsDue = isDueForReview(b.id);
        
        if (aIsDue && !bIsDue) return -1;
        if (!aIsDue && bIsDue) return 1;
        
        // Second priority: Lower SRS level (less well known)
        const aLevel = srsData[a.id] ? srsData[a.id].level : 0;
        const bLevel = srsData[b.id] ? srsData[b.id].level : 0;
        
        if (aLevel !== bLevel) return aLevel - bLevel;
        
        // Third priority: Higher fail count (more difficult words)
        const aFails = srsData[a.id] ? srsData[a.id].failCount || 0 : 0;
        const bFails = srsData[b.id] ? srsData[b.id].failCount || 0 : 0;
        
        if (aFails !== bFails) return bFails - aFails;
        
        // Finally, sort by ID for consistency
        return a.id - b.id;
    });
}

// Save SRS data to Firebase
function saveSRSToFirebase(wordId, srsInfo) {
    if (!currentUser) return;
    
    try {
        // Create a clean object for Firebase (no Date objects)
        const srsForFirebase = {
            level: srsInfo.level,
            lastReviewed: srsInfo.lastReviewed ? srsInfo.lastReviewed.toISOString() : null,
            nextReview: srsInfo.nextReview ? srsInfo.nextReview.toISOString() : null,
            failCount: srsInfo.failCount || 0
        };
        
        // First check if the user document exists
        db.collection('users').doc(currentUser.uid).get()
            .then((doc) => {
                if (doc.exists) {
                    // Update existing document
                    return db.collection('users').doc(currentUser.uid).update({
                        [`srs.${wordId}`]: srsForFirebase
                    });
                } else {
                    // Create new document with srs field
                    let userData = {
                        email: currentUser.email,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        srs: {}
                    };
                    userData.srs[wordId] = srsForFirebase;
                    return db.collection('users').doc(currentUser.uid).set(userData);
                }
            })
            .catch(error => {
                console.error('Error saving SRS data:', error);
            });
    } catch (error) {
        console.error('Error in saveSRSToFirebase:', error);
    }
}

// Load SRS data from Firebase
function loadSRSFromFirebase() {
    if (!currentUser) return;
    
    db.collection('users').doc(currentUser.uid).get()
        .then((doc) => {
            if (doc.exists && doc.data().srs) {
                const firebaseSRS = doc.data().srs;
                
                // Convert string dates to Date objects
                Object.keys(firebaseSRS).forEach(wordId => {
                    const srs = firebaseSRS[wordId];
                    srsData[wordId] = {
                        level: srs.level,
                        lastReviewed: srs.lastReviewed ? new Date(srs.lastReviewed) : null,
                        nextReview: srs.nextReview ? new Date(srs.nextReview) : null,
                        failCount: srs.failCount || 0
                    };
                });
                
                console.log('SRS data loaded from Firebase');
                
                // Update displays after loading
                updateSRSDisplay();
            }
        })
        .catch((error) => {
            console.error('Error loading SRS data:', error);
        });
}

// Save SRS data to localStorage when not logged in
function saveToLocalStorage() {
    try {
        // Convert Date objects to strings for localStorage
        const srsForStorage = {};
        Object.keys(srsData).forEach(wordId => {
            const srs = srsData[wordId];
            srsForStorage[wordId] = {
                level: srs.level,
                lastReviewed: srs.lastReviewed ? srs.lastReviewed.toISOString() : null,
                nextReview: srs.nextReview ? srs.nextReview.toISOString() : null,
                failCount: srs.failCount || 0
            };
        });
        
        localStorage.setItem('arabicVocabSRS', JSON.stringify(srsForStorage));
        console.log('SRS data saved to localStorage');
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
}

// Load SRS data from localStorage when not logged in
function loadFromLocalStorage() {
    try {
        const storedSRS = localStorage.getItem('arabicVocabSRS');
        if (storedSRS) {
            const parsedSRS = JSON.parse(storedSRS);
            
            // Convert string dates back to Date objects
            Object.keys(parsedSRS).forEach(wordId => {
                const srs = parsedSRS[wordId];
                srsData[wordId] = {
                    level: srs.level,
                    lastReviewed: srs.lastReviewed ? new Date(srs.lastReviewed) : null,
                    nextReview: srs.nextReview ? new Date(srs.nextReview) : null,
                    failCount: srs.failCount || 0
                };
            });
            
            console.log('SRS data loaded from localStorage');
        }
    } catch (error) {
        console.error('Error loading from localStorage:', error);
    }
}

// Function to update the SRS display for a specific word
function updateWordSRSDisplay(wordId) {
    const srsContainer = document.getElementById('word-srs-status');
    if (!srsContainer) return;
    
    const srs = srsData[wordId];
    if (!srs) {
        // Initialize if not exists
        srsData[wordId] = initializeSRS(wordId);
        return updateWordSRSDisplay(wordId);
    }
    
    // Remove all existing level classes
    for (let i = 0; i <= 5; i++) {
        srsContainer.classList.remove(`level-${i}`);
    }
    
    // Add the correct level class
    srsContainer.classList.add(`level-${srs.level}`);
    
    // Update the text content
    let statusText = '';
    switch (srs.level) {
        case 0:
            statusText = 'חדש';
            break;
        case 1:
        case 2:
            statusText = 'בלימוד';
            break;
        case 3:
        case 4:
            statusText = 'כמעט מוכר';
            break;
        case 5:
            statusText = 'נלמד היטב';
            break;
    }
    
    // Update the status text if the container has a child element for it
    const statusTextElement = srsContainer.querySelector('.status-text');
    if (statusTextElement) {
        statusTextElement.textContent = statusText;
    }
    
    // Calculate next review date
    const nextReviewDate = srs.nextReview ? new Date(srs.nextReview) : new Date();
    const today = new Date();
    
    let reviewText = '';
    if (nextReviewDate <= today) {
        reviewText = 'יש לסקור היום';
    } else {
        const diffTime = Math.abs(nextReviewDate - today);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        reviewText = `סקירה הבאה בעוד ${diffDays} ימים`;
    }
    
    // Update the review text if the container has a child element for it
    const reviewTextElement = srsContainer.querySelector('.review-text');
    if (reviewTextElement) {
        reviewTextElement.textContent = reviewText;
    }
}
