document.addEventListener('DOMContentLoaded', function() {
    const telemedicineAuthPrompt = document.getElementById('telemedicineAuthPrompt');
    const telemedicineService = document.getElementById('telemedicineService');
    const generateLinkBtn = document.getElementById('generateLinkBtn');
    const meetingLinkDisplay = document.getElementById('meetingLinkDisplay');
    const meetingLink = document.getElementById('meetingLink');
    const copyLinkBtn = document.getElementById('copyLinkBtn');

    // Function to update the UI based on login status
    function updateTelemedicineUI() {
        if (window.isLoggedIn()) {
            telemedicineAuthPrompt.style.display = 'none';
            telemedicineService.style.display = 'block';
        } else {
            telemedicineAuthPrompt.style.display = 'block';
            telemedicineService.style.display = 'none';
            meetingLinkDisplay.style.display = 'none'; // Hide link if user logs out
        }
    }

    // Event listener for generating meeting link
    generateLinkBtn.addEventListener('click', function() {
        if (!window.isLoggedIn()) {
            window.showCustomMessage('Please log in to generate a meeting link.', 'info', () => {
                window.location.href = 'login_signin.html?action=login';
            });
            return;
        }

        // Simulate generating a unique meeting link
        const uniqueId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const generatedLink = `https://meet.google.com/${uniqueId}`; // Example: Google Meet link

        meetingLink.href = generatedLink;
        meetingLink.textContent = generatedLink;
        meetingLinkDisplay.style.display = 'block';

        window.showCustomMessage('Meeting link generated successfully! You can copy it or click to open.', 'info');

        // Optional: Deduct credits for generating link (example)
        // This part would ideally interact with Firestore via auth.js or a dedicated user data module
        // For now, it's a conceptual placeholder.
        // if (window.getCurrentUserId()) {
        //     const db = window.getFirestoreInstance();
        //     const appId = window.getAppId();
        //     const userId = window.getCurrentUserId();
        //     const userDocRef = doc(db, `artifacts/${appId}/users/${userId}/profile`, 'data');
        //     getDoc(userDocRef).then(docSnap => {
        //         if (docSnap.exists()) {
        //             const userData = docSnap.data();
        //             if (userData.credits >= 10) { // Example cost
        //                 updateDoc(userDocRef, {
        //                     credits: userData.credits - 10,
        //                     recentActivity: arrayUnion(`Generated telemedicine link (${new Date().toLocaleDateString()})`)
        //                 }).then(() => {
        //                     console.log("Credits deducted for meeting link.");
        //                 }).catch(error => console.error("Error deducting credits:", error));
        //             } else {
        //                 window.showCustomMessage("Not enough credits to generate link. Please earn more.", 'error');
        //             }
        //         }
        //     }).catch(error => console.error("Error fetching user data for credits:", error));
        // }
    });

    // Event listener for copying link to clipboard
    copyLinkBtn.addEventListener('click', function() {
        const linkToCopy = meetingLink.textContent;
        // Use document.execCommand('copy') for better compatibility in iframes
        const textarea = document.createElement('textarea');
        textarea.value = linkToCopy;
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            window.showCustomMessage('Meeting link copied to clipboard!', 'success');
        } catch (err) {
            console.error('Failed to copy text: ', err);
            window.showCustomMessage('Failed to copy link. Please copy it manually.', 'error');
        }
        document.body.removeChild(textarea);
    });

    // Initial UI update when the page loads
    updateTelemedicineUI();

    // Listen for auth state changes from auth.js to update UI
    // This is a simplified way; in a more complex app, you might use a custom event or a shared state.
    // For now, we'll re-check on DOMContentLoaded and rely on auth.js to update the nav bar.
    // A more robust solution would involve a custom event dispatched by auth.js on login/logout.
    // For this demonstration, we'll just ensure the UI reflects the initial state.
    // The nav bar itself will update dynamically due to auth.js.
});
