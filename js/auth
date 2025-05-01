// DOM Elements
const userStatus = document.getElementById('user-status');
const notLoggedIn = document.getElementById('not-logged-in');
const loggedIn = document.getElementById('logged-in');
const userEmail = document.getElementById('user-email');
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const logoutBtn = document.getElementById('logout-btn');

// Modal Elements
const loginModal = document.getElementById('login-modal');
const registerModal = document.getElementById('register-modal');
const forgotModal = document.getElementById('forgot-modal');
const closeBtns = document.querySelectorAll('.close');
const forgotPasswordLink = document.getElementById('forgot-password');

// Form Elements
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const forgotForm = document.getElementById('forgot-form');

// Auth State Observer
auth.onAuthStateChanged(user => {
    if (user) {
        // User is signed in
        notLoggedIn.style.display = 'none';
        loggedIn.style.display = 'flex';
        userEmail.textContent = user.email;
        
        // Load user progress from Firestore
        loadUserProgress(user.uid);
        
        // Show category selection screen
        document.getElementById('loading-screen').style.display = 'none';
        document.getElementById('category-selection').style.display = 'block';
    } else {
        // User is signed out
        notLoggedIn.style.display = 'flex';
        loggedIn.style.display = 'none';
        userEmail.textContent = '';
        
        // Hide progress-related screens if signed out
        document.getElementById('loading-screen').style.display = 'flex';
        document.getElementById('category-selection').style.display = 'none';
        document.getElementById('exercise-screen').style.display = 'none';
        document.getElementById('results-screen').style.display = 'none';
        document.getElementById('progress-screen').style.display = 'none';
    }
});

// Forgot Password Form Submission
forgotForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const email = document.getElementById('forgot-email').value;
    
    clearAlerts(forgotModal);
    
    // Send password reset email
    auth.sendPasswordResetEmail(email)
        .then(() => {
            showAlert(forgotModal, 'הוראות לאיפוס הסיסמה נשלחו לאימייל שלך', 'success');
            setTimeout(() => {
                forgotModal.style.display = 'none';
                loginModal.style.display = 'block';
            }, 3000);
        })
        .catch((error) => {
            showAlert(forgotModal, error.message, 'error');
        });
});

// Logout
logoutBtn.addEventListener('click', () => {
    auth.signOut()
        .then(() => {
            // Successfully signed out
            showAlert(document.querySelector('main'), 'התנתקת בהצלחה', 'success');
        })
        .catch((error) => {
            console.error('Error signing out:', error);
        });
});

// Helper Functions
function showAlert(container, message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    // Insert at the beginning of the form or container
    container.querySelector('form, .modal-content, main').prepend(alertDiv);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.parentNode.removeChild(alertDiv);
        }
    }, 5000);
}

function clearAlerts(container) {
    const alerts = container.querySelectorAll('.alert');
    alerts.forEach(alert => {
        alert.parentNode.removeChild(alert);
    });
}

function loadUserProgress(userId) {
    // Load user progress from Firestore
    db.collection('users').doc(userId).get()
        .then((doc) => {
            if (doc.exists) {
                const userData = doc.data();
                // Store user progress data in app memory for later use
                window.userProgress = userData.progress || {
                    completedExercises: 0,
                    categoryStats: {}
                };
            } else {
                console.log("No user data found!");
            }
        })
        .catch((error) => {
            console.error("Error loading user progress:", error);
        });
}

// Open Login Modal
loginBtn.addEventListener('click', () => {
    loginModal.style.display = 'block';
    // Clear any previous form data and errors
    loginForm.reset();
    clearAlerts(loginModal);
});

// Open Register Modal
registerBtn.addEventListener('click', () => {
    registerModal.style.display = 'block';
    // Clear any previous form data and errors
    registerForm.reset();
    clearAlerts(registerModal);
});

// Open Forgot Password Modal
forgotPasswordLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginModal.style.display = 'none';
    forgotModal.style.display = 'block';
    // Clear any previous form data and errors
    forgotForm.reset();
    clearAlerts(forgotModal);
});

// Close Modals
closeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        loginModal.style.display = 'none';
        registerModal.style.display = 'none';
        forgotModal.style.display = 'none';
    });
});

// Close Modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === loginModal) {
        loginModal.style.display = 'none';
    }
    if (e.target === registerModal) {
        registerModal.style.display = 'none';
    }
    if (e.target === forgotModal) {
        forgotModal.style.display = 'none';
    }
});

// Login Form Submission
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    clearAlerts(loginModal);
    
    // Sign in with email and password
    auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            loginModal.style.display = 'none';
        })
        .catch((error) => {
            showAlert(loginModal, error.message, 'error');
        });
});

// Register Form Submission
registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    
    clearAlerts(registerModal);
    
    // Check if passwords match
    if (password !== confirmPassword) {
        showAlert(registerModal, 'הסיסמאות אינן תואמות', 'error');
        return;
    }
    
    // Create user with email and password
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Create user document in Firestore
            return db.collection('users').doc(userCredential.user.uid).set({
                email: email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                progress: {
                    completedExercises: 0,
                    categoryStats: {}
                }
            });
        })
        .then(() => {
            registerModal.style.display = 'none';
            showAlert(document.querySelector('main'), 'ההרשמה הושלמה בהצלחה!', 'success');
        })
        .catch((error) => {
            showAlert(registerModal, error.message, 'error');
        });
});
