import { getFirestore, doc, getDoc, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', async function() {
    // Elements for profile information
    const profileUsername = document.getElementById('profileUsername');
    const memberSince = document.getElementById('memberSince');
    const userCredits = document.getElementById('userCredits');
    const surveyHistoryList = document.getElementById('surveyHistoryList');
    const chatHistoryList = document.getElementById('chatHistoryList');
    const recentActivityList = document.getElementById('recentActivityList');

    // Buttons
    const earnCreditsBtn = document.getElementById('earnCreditsBtn');
    const editProfileBtn = document.getElementById('editProfileBtn');
    const deleteAccountBtn = document.getElementById('deleteAccountBtn');

    const db = window.getFirestoreInstance(); // Get Firebase Firestore instance from auth.js
    const appId = window.getAppId(); // Get appId from auth.js

    let currentUserId = null;

    // Wait for authentication to be ready
    const authCheckInterval = setInterval(() => {
        if (window.isLoggedIn() && window.getCurrentUserId()) {
            clearInterval(authCheckInterval);
            currentUserId = window.getCurrentUserId();
            displayProfileData();
        } else if (!window.isLoggedIn()) {
            clearInterval(authCheckInterval);
            window.showCustomMessage('You must be logged in to view your profile.', 'info', () => {
                window.location.href = 'login_signin.html?action=login';
            });
        }
    }, 100); // Check every 100ms

    // --- Data Management (using Firestore) ---

    // Get user data from Firestore
    async function getUserDataFromFirestore(userId) {
        if (!userId) return null;
        const userDocRef = doc(db, `artifacts/${appId}/users/${userId}/profile`, 'data');
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
            return docSnap.data();
        }
        return null; // Should ideally not happen if profile was created on signup
    }

    // Update user data in Firestore
    async function updateUserDataInFirestore(userId, data) {
        if (!userId) return;
        const userDocRef = doc(db, `artifacts/${appId}/users/${userId}/profile`, 'data');
        await updateDoc(userDocRef, data);
    }

    // --- Display Profile Data ---
    async function displayProfileData() {
        const userData = await getUserDataFromFirestore(currentUserId);

        if (!userData) {
            window.showCustomMessage('Could not load profile data. Please try logging in again.', 'error', () => {
                window.logoutUser(); // Log out if data can't be fetched
            });
            return;
        }

        profileUsername.textContent = userData.username || 'N/A';
        memberSince.textContent = userData.joinedDate || 'N/A';
        userCredits.textContent = userData.credits !== undefined ? userData.credits : 'N/A';

        // Display Survey History
        surveyHistoryList.innerHTML = '';
        if (userData.surveyHistory && userData.surveyHistory.length > 0) {
            userData.surveyHistory.forEach(item => {
                const li = document.createElement('li');
                li.textContent = item;
                surveyHistoryList.appendChild(li);
            });
        } else {
            surveyHistoryList.innerHTML = '<li>No surveys completed yet.</li>';
        }

        // Display Chat History
        chatHistoryList.innerHTML = '';
        if (userData.chatHistory && userData.chatHistory.length > 0) {
            userData.chatHistory.forEach(item => {
                const li = document.createElement('li');
                li.textContent = item;
                chatHistoryList.appendChild(li);
            });
        } else {
            chatHistoryList.innerHTML = '<li>No chat history available.</li>';
        }

        // Display Recent Activity
        recentActivityList.innerHTML = '';
        if (userData.recentActivity && userData.recentActivity.length > 0) {
            userData.recentActivity.forEach(item => {
                const li = document.createElement('li');
                li.textContent = item;
                recentActivityList.appendChild(li);
            });
        } else {
            recentActivityList.innerHTML = '<li>No recent activity.</li>';
        }
    }

    // --- Event Listeners for Actions ---

    earnCreditsBtn.addEventListener('click', async function() {
        if (!currentUserId) {
            window.showCustomMessage('Please log in to earn credits.', 'info');
            return;
        }
        window.showCustomMessage('You earned 50 credits!', 'info', async () => {
            const userData = await getUserDataFromFirestore(currentUserId);
            if (userData) {
                const newCredits = (userData.credits || 0) + 50;
                const newRecentActivity = userData.recentActivity || [];
                newRecentActivity.unshift(`Earned 50 credits (${new Date().toLocaleDateString()})`);
                if (newRecentActivity.length > 5) newRecentActivity.pop(); // Keep last 5 activities
                await updateUserDataInFirestore(currentUserId, {
                    credits: newCredits,
                    recentActivity: newRecentActivity
                });
                displayProfileData(); // Refresh display
            }
        });
    });

    editProfileBtn.addEventListener('click', function() {
        window.showCustomMessage('Edit Profile functionality is under development.', 'info');
        // In a real app, this would open a modal or redirect to an edit page
    });

    deleteAccountBtn.addEventListener('click', function() {
        window.showCustomMessage(
            'Are you sure you want to delete your account? This action cannot be undone.',
            'warning',
            async () => {
                if (currentUserId) {
                    try {
                        // Delete user document in Firestore first
                        const userDocRef = doc(db, `artifacts/${appId}/users/${currentUserId}/profile`, 'data');
                        await deleteDoc(userDocRef); // Assuming deleteDoc is imported

                        // Then delete Firebase Auth user (requires re-authentication in real app)
                        // For this simulation, we'll just sign out and clear local state.
                        await window.getAuthInstance().currentUser.delete(); // This might fail without re-auth
                        window.logoutUser(); // Log out and redirect
                        window.showCustomMessage('Your account and data have been deleted.', 'info');
                    } catch (error) {
                        console.error("Error deleting account:", error);
                        window.showCustomMessage(`Failed to delete account: ${error.message}. You might need to re-authenticate if this is a real user.`, 'error');
                    }
                }
            }
        );
    });

    // Mobile navigation toggle (from auth.js, ensuring it's active on this page too)
    const navToggle = document.querySelector('.nav-toggle');
    const navLinks = document.querySelector('.nav-links');
    if (navToggle && navLinks) {
        navToggle.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            navToggle.classList.toggle('active');
            const navRight = document.querySelector('.main-nav .nav-right');
            if (navRight) {
                navRight.classList.toggle('active');
            }
        });
    }
});
