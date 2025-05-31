// Firebase SDK imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Firebase Configuration (provided by the user)
const firebaseConfig = {
    apiKey: "AIzaSyA1FoKK-wAfLWT9Kbzx5ddrszHkwAKeiPY",
    authDomain: "ayurjeev-a42dc.firebaseapp.com",
    projectId: "ayurjeev-a42dc",
    storageBucket: "ayurjeev-a42dc.firebasestorage.app",
    messagingSenderId: "72665554338",
    appId: "1:72665554338:web:cb84c3f56817543b75e6fb",
    measurementId: "G-KM4YYXL4V9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Global variables for Canvas environment
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// --- Custom Modal for Alerts (replacing window.alert/confirm) ---
function showCustomMessage(message, type = 'info', onConfirm = null) {
    const modal = document.createElement('div');
    modal.className = 'custom-modal';
    modal.innerHTML = `
        <div class="custom-modal-content">
            <p>${message}</p>
            <div class="custom-modal-actions">
                <button class="custom-modal-close btn btn-primary">OK</button>
                ${onConfirm ? '<button class="custom-modal-confirm btn btn-secondary">Confirm</button>' : ''}
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // Apply button styles from styles.css
    modal.querySelector('.custom-modal-close').classList.add('btn');
    if (type === 'error') {
        modal.querySelector('.custom-modal-close').classList.add('btn-danger');
    } else {
        modal.querySelector('.custom-modal-close').classList.add('btn-primary');
    }

    // Close modal on OK button click
    modal.querySelector('.custom-modal-close').addEventListener('click', function() {
        document.body.removeChild(modal);
    });

    // Handle confirm button if present
    if (onConfirm) {
        const confirmBtn = modal.querySelector('.custom-modal-confirm');
        confirmBtn.classList.add('btn'); // Apply general btn style
        confirmBtn.classList.add('btn-secondary'); // Apply secondary btn style
        confirmBtn.addEventListener('click', function() {
            document.body.removeChild(modal);
            onConfirm(); // Execute callback
        });
    }
}

// Expose showCustomMessage globally for other scripts
window.showCustomMessage = showCustomMessage;

// --- Authentication State Management (using Firebase Auth) ---

let currentUserId = null;
let isAuthReady = false;

// Function to get user data from Firestore
async function getUserProfile(userId) {
    const userDocRef = doc(db, `artifacts/${appId}/users/${userId}/profile`, 'data');
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
        return docSnap.data();
    } else {
        // Initialize new user profile
        const newProfile = {
            username: auth.currentUser.email || 'User', // Fallback to email if display name not set
            credits: 100, // Initial credits
            joinedDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
            surveyHistory: [],
            chatHistory: [],
            recentActivity: []
        };
        await setDoc(userDocRef, newProfile);
        return newProfile;
    }
}

// Function to update user data in Firestore
async function updateFirestoreUserData(userId, data) {
    const userDocRef = doc(db, `artifacts/${appId}/users/${userId}/profile`, 'data');
    await updateDoc(userDocRef, data);
}

// Global functions for other scripts to use
window.isLoggedIn = () => !!auth.currentUser;
window.getCurrentUserId = () => currentUserId;
window.getAuthInstance = () => auth; // Provide auth instance for other scripts if needed
window.getFirestoreInstance = () => db; // Provide firestore instance
window.getAppId = () => appId; // Provide app ID

// Firebase Authentication Listener
onAuthStateChanged(auth, async (user) => {
    isAuthReady = true;
    if (user) {
        currentUserId = user.uid;
        console.log("User logged in:", user.uid);
        // Ensure user profile exists in Firestore
        await getUserProfile(user.uid);
    } else {
        currentUserId = null;
        console.log("User logged out.");
    }
    updateAuthUI(); // Update UI whenever auth state changes
});

// Initial sign-in with custom token if available (for Canvas environment)
if (initialAuthToken) {
    signInWithCustomToken(auth, initialAuthToken)
        .then(() => console.log("Signed in with custom token."))
        .catch((error) => console.error("Error signing in with custom token:", error));
} else {
    // If no custom token, sign in anonymously (or handle as per your app's auth flow)
    // For this app, we'll rely on explicit login/signup
    console.log("No custom auth token provided. User will need to log in manually.");
}


// --- Dynamic Navigation Bar Update ---
function updateAuthUI() {
    const navRight = document.querySelector('.main-nav .nav-right');
    if (!navRight) return; // Exit if nav-right element isn't found

    navRight.innerHTML = ''; // Clear existing buttons

    if (window.isLoggedIn()) {
        // Show Profile button
        const profileBtn = document.createElement('a');
        profileBtn.href = 'profile.html';
        profileBtn.className = 'btn btn-primary';
        profileBtn.innerHTML = '<i class="fas fa-user-circle"></i> Profile';
        navRight.appendChild(profileBtn);

        // Show Logout button
        const logoutBtn = document.createElement('button');
        logoutBtn.className = 'btn btn-secondary';
        logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout';
        logoutBtn.addEventListener('click', async () => {
            try {
                await signOut(auth);
                window.showCustomMessage('You have been logged out.');
                // Redirect to home or login page after logout
                if (window.location.pathname.includes('profile.html')) {
                    window.location.href = 'index.html';
                }
            } catch (error) {
                console.error("Error logging out:", error);
                window.showCustomMessage(`Logout failed: ${error.message}`, 'error');
            }
        });
        navRight.appendChild(logoutBtn);
    } else {
        // Show Login button
        const loginBtn = document.createElement('a');
        loginBtn.href = 'login_signin.html?action=login';
        loginBtn.className = 'btn btn-primary';
        loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
        navRight.appendChild(loginBtn);

        // Show Signup button
        const signupBtn = document.createElement('a');
        signupBtn.href = 'login_signin.html?action=signup';
        signupBtn.className = 'btn btn-secondary';
        signupBtn.innerHTML = '<i class="fas fa-user-plus"></i> Signup';
        navRight.appendChild(signupBtn);
    }
}

// --- Mobile Navigation Toggle ---
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');

if (navToggle && navLinks) {
    navToggle.addEventListener('click', function() {
        navLinks.classList.toggle('active');
        navToggle.classList.toggle('active');
        // Toggle visibility for nav-right as well in mobile view
        const navRight = document.querySelector('.main-nav .nav-right');
        if (navRight) {
            navRight.classList.toggle('active');
        }
    });
}

// Initial UI update when the page loads (will be updated again by onAuthStateChanged)
updateAuthUI();
