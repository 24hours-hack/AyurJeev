import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', function() {
    const loginTab = document.getElementById('loginTab');
    const signupTab = document.getElementById('signupTab');
    const loginFormDiv = document.getElementById('loginForm');
    const signupFormDiv = document.getElementById('signupForm');

    const loginForm = loginFormDiv.querySelector('form');
    const signupForm = signupFormDiv.querySelector('form');

    const auth = window.getAuthInstance(); // Get Firebase Auth instance from auth.js
    const db = window.getFirestoreInstance(); // Get Firebase Firestore instance from auth.js
    const appId = window.getAppId(); // Get appId from auth.js

    // Function to switch between login and signup forms
    function showForm(formType) {
        if (formType === 'login') {
            loginTab.classList.add('active');
            signupTab.classList.remove('active');
            loginFormDiv.classList.add('active');
            signupFormDiv.classList.remove('active');
        } else {
            signupTab.classList.add('active');
            loginTab.classList.remove('active');
            signupFormDiv.classList.add('active');
            loginFormDiv.classList.remove('active');
        }
    }

    // Event listeners for tab buttons
    loginTab.addEventListener('click', () => showForm('login'));
    signupTab.addEventListener('click', () => showForm('signup'));

    // Check URL parameter for initial form display
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');
    if (action === 'signup') {
        showForm('signup');
    } else {
        showForm('login'); // Default to login
    }

    // Handle Login Form Submission
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const email = document.getElementById('loginUsername').value.trim(); // Using username field for email
        const password = document.getElementById('loginPassword').value.trim();

        if (email === '' || password === '') {
            window.showCustomMessage('Please enter both email and password.', 'error');
            return;
        }

        try {
            await signInWithEmailAndPassword(auth, email, password);
            window.showCustomMessage(`Logged in as ${email}! Redirecting...`);
            setTimeout(() => {
                window.location.href = 'index.html'; // Redirect to home page
            }, 1000);
        } catch (error) {
            console.error("Login error:", error.code, error.message);
            let errorMessage = "Login failed. Please check your credentials.";
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                errorMessage = "Invalid email or password.";
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = "Invalid email format.";
            }
            window.showCustomMessage(errorMessage, 'error');
        }
    });

    // Handle Signup Form Submission
    signupForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const username = document.getElementById('signupUsername').value.trim();
        const email = document.getElementById('signupEmail').value.trim();
        const password = document.getElementById('signupPassword').value.trim();
        const confirmPassword = document.getElementById('signupConfirmPassword').value.trim();

        if (username === '' || email === '' || password === '' || confirmPassword === '') {
            window.showCustomMessage('Please fill in all fields.', 'error');
            return;
        }

        if (password.length < 6) {
            window.showCustomMessage('Password must be at least 6 characters long.', 'error');
            return;
        }

        if (password !== confirmPassword) {
            window.showCustomMessage('Passwords do not match.', 'error');
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Initialize user profile in Firestore
            const userDocRef = doc(db, `artifacts/${appId}/users/${user.uid}/profile`, 'data');
            await setDoc(userDocRef, {
                username: username, // Use provided username
                email: email,
                credits: 100, // Initial credits
                joinedDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
                surveyHistory: [],
                chatHistory: [],
                recentActivity: [`Account created (${new Date().toLocaleDateString()})`]
            });

            window.showCustomMessage(`Account created for ${username}! Redirecting...`);
            setTimeout(() => {
                window.location.href = 'index.html'; // Redirect to home page
            }, 1000);

        } catch (error) {
            console.error("Signup error:", error.code, error.message);
            let errorMessage = "Signup failed.";
            if (error.code === 'auth/email-already-in-use') {
                errorMessage = "This email is already in use.";
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = "Invalid email format.";
            } else if (error.code === 'auth/weak-password') {
                errorMessage = "Password is too weak. Please choose a stronger one.";
            }
            window.showCustomMessage(errorMessage, 'error');
        }
    });
});
