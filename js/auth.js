// Initialize auth state observer
function initAuthObserver() {
    // Add event listeners for authentication buttons
    initAuthButtons();

    // Set up Firebase auth state listener
    auth.onAuthStateChanged((user) => {
        if (user) {
            // User is signed in
            currentUser = user;
            document.getElementById('user-name').textContent = user.email;
            document.getElementById('auth-container').classList.add('logged-in');
            loadUserProgress();
            loadSRSFromFirebase(); // Load SRS data from Firebase
            hideAuthModal();
        } else {
            // User is signed out
            currentUser = null;
            document.getElementById('user-name').textContent = 'אורח';
            document.getElementById('auth-container').classList.remove('logged-in');
            learnedWords = new Set(); // Reset progress when logged out
            loadFromLocalStorage(); // Load SRS data from localStorage
            updateStats();
        }
    });
}

// Initialize authentication buttons
function initAuthButtons() {
    document.getElementById('login-button').addEventListener('click', function() {
        showAuthModal('login');
    });

    document.getElementById('register-button').addEventListener('click', function() {
        showAuthModal('register');
    });

    document.getElementById('guest-login-button').addEventListener('click', function() {
        showAuthModal('login');
    });

    document.getElementById('logout-button').addEventListener('click', function() {
        logout();
    });

    document.getElementById('submit-login').addEventListener('click', function() {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        
        if (email && password) {
            login(email, password);
        } else {
            const statusElement = document.getElementById('auth-status');
            statusElement.textContent = 'אנא הזן אימייל וסיסמה';
            statusElement.className = 'error-message';
        }
    });

    document.getElementById('submit-register').addEventListener('click', function() {
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const passwordConfirm = document.getElementById('register-password-confirm').value;
        
        if (email && password && passwordConfirm) {
            register(email, password, passwordConfirm);
        } else {
            const statusElement = document.getElementById('auth-status');
            statusElement.textContent = 'אנא מלא את כל השדות';
            statusElement.className = 'error-message';
        }
    });

    // Close button for modal
    const closeButton = document.querySelector('.close-button');
    if (closeButton) {
        closeButton.addEventListener('click', hideAuthModal);
    }

    // Add keyboard listener for Esc key to close modal
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            hideAuthModal();
        }
    });
}

// Login user
function login(email, password) {
    const statusElement = document.getElementById('auth-status');
    statusElement.textContent = 'מתחבר...';
    
    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Login successful
            statusElement.textContent = 'התחברת בהצלחה!';
            statusElement.className = 'success-message';
            
            // Hide modal after successful login
            setTimeout(hideAuthModal, 1000);
        })
        .catch((error) => {
            // Handle errors
            statusElement.textContent = getHebrewErrorMessage(error.code);
            statusElement.className = 'error-message';
        });
}

// Register new user
function register(email, password, passwordConfirm) {
    const statusElement = document.getElementById('auth-status');
    
    // Validate passwords match
    if (password !== passwordConfirm) {
        statusElement.textContent = 'הסיסמאות אינן תואמות';
        statusElement.className = 'error-message';
        return;
    }
    
    statusElement.textContent = 'יוצר חשבון...';
    
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Registration successful
            statusElement.textContent = 'החשבון נוצר בהצלחה!';
            statusElement.className = 'success-message';
            
            // Create initial user data
            const user = userCredential.user;
            return db.collection('users').doc(user.uid).set({
                email: user.email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                progress: {},
                srs: {} // Initialize SRS field
            });
        })
        .then(() => {
            // Hide modal after successful registration
            setTimeout(hideAuthModal, 1500);
        })
        .catch((error) => {
            // Handle errors
            statusElement.textContent = getHebrewErrorMessage(error.code);
            statusElement.className = 'error-message';
        });
}

// Logout user
function logout() {
    auth.signOut()
        .then(() => {
            // Sign-out successful
            learnedWords = new Set(); // Reset progress when logged out
            updateStats();
        })
        .catch((error) => {
            console.error('Logout error:', error);
        });
}

// Load user progress from Firestore
function loadUserProgress() {
    if (!currentUser) return;
    
    db.collection('users').doc(currentUser.uid).get()
        .then((doc) => {
            if (doc.exists && doc.data().progress) {
                userProgress = doc.data().progress;
                
                // Restore learned words from saved progress
                learnedWords = new Set();
                Object.keys(userProgress).forEach(wordId => {
                    if (userProgress[wordId].learned) {
                        learnedWords.add(parseInt(wordId));
                    }
                });
                
                updateStats();
            }
        })
        .catch((error) => {
            console.error('Error loading user progress:', error);
        });
}

// Save user progress to Firestore
function saveUserProgress() {
    if (!currentUser) return;
    
    // Create progress object
    const progressData = {};
    
    // Save the learned state of each word
    learnedWords.forEach(wordId => {
        progressData[wordId] = {
            learned: true,
            lastSeen: firebase.firestore.FieldValue.serverTimestamp()
        };
    });
    
    // Save to Firestore
    db.collection('users').doc(currentUser.uid).update({
        progress: progressData,
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        console.log('Progress saved successfully');
        // Show save indicator if you want
    })
    .catch((error) => {
        console.error('Error saving progress:', error);
    });
}

// Show auth modal
function showAuthModal(mode = 'login') {
    const modal = document.getElementById('auth-modal');
    modal.style.display = 'flex';
    
    // Add class for animation
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
    
    // Set the active tab
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById(`${mode}-tab`).classList.add('active');
    
    // Show the active form
    document.querySelectorAll('.auth-form').forEach(form => {
        form.style.display = 'none';
    });
    document.getElementById(`${mode}-form`).style.display = 'block';
    
    // Clear previous status messages
    document.getElementById('auth-status').textContent = '';
    document.getElementById('auth-status').className = 'auth-status';
    
    // Clear input fields
    document.querySelectorAll('.auth-form input').forEach(input => {
        input.value = '';
    });
    
    // Focus on the first input field
    const firstInput = document.querySelector(`#${mode}-form input`);
    if (firstInput) {
        setTimeout(() => firstInput.focus(), 300);
    }
}

// Hide auth modal
function hideAuthModal() {
    const modal = document.getElementById('auth-modal');
    modal.classList.remove('show');
    
    // Wait for animation to complete before hiding
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

// Switch between login and register forms
function switchAuthForm(mode) {
    showAuthModal(mode);
}

// Get Hebrew error messages for firebase auth errors
function getHebrewErrorMessage(errorCode) {
    const errorMessages = {
        'auth/email-already-in-use': 'כתובת האימייל כבר בשימוש',
        'auth/invalid-email': 'כתובת אימייל לא תקינה',
        'auth/weak-password': 'הסיסמה חלשה מדי',
        'auth/user-not-found': 'משתמש לא נמצא',
        'auth/wrong-password': 'סיסמה שגויה',
        'auth/too-many-requests': 'יותר מדי נסיונות התחברות, נסה שוב מאוחר יותר'
    };
    
    return errorMessages[errorCode] || 'אירעה שגיאה. נסה שוב.';
}
