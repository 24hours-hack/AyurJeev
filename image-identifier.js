document.addEventListener('DOMContentLoaded', function() {
    const uploadArea = document.getElementById('uploadArea');
    const imageInput = document.getElementById('imageInput');
    const imagePreview = document.getElementById('imagePreview');
    const previewImage = document.getElementById('previewImage');
    const removeImageBtn = document.getElementById('removeImageBtn');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const uploadImageBtn = document.getElementById('uploadImageBtn');
    const useCameraBtn = document.getElementById('useCameraBtn');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const resultsSection = document.getElementById('resultsSection');
    const resultsContainer = document.getElementById('resultsContainer');
    const urgentCareAlert = document.getElementById('urgentCareAlert');
    const urgentCareText = document.getElementById('urgentCareText');
    const finalDisclaimer = document.getElementById('finalDisclaimer');
    const additionalContext = document.getElementById('additionalContext');
    const newImageAnalysisBtn = document.getElementById('newImageAnalysisBtn');

    // Gemini API configuration
    const GEMINI_API_KEY = 'AIzaSyBcQ5YwhtqBvzsR_mXfNmMCIQL7jjjWdXw';
    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`;

    let currentImageFile = null;

    // Function to display a custom modal message instead of alert()
    function showCustomMessage(message) {
        const modal = document.createElement('div');
        modal.className = 'custom-modal';
        modal.innerHTML = `
            <div class="custom-modal-content">
                <p>${message}</p>
                <button class="custom-modal-close">OK</button>
            </div>
        `;
        document.body.appendChild(modal);

        // Basic styling for the modal (can be moved to CSS file)
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.6);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;
        modal.querySelector('.custom-modal-content').style.cssText = `
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
            text-align: center;
            max-width: 400px;
            width: 90%;
            font-family: 'Inter', sans-serif;
        `;
        modal.querySelector('p').style.cssText = `
            margin-bottom: 20px;
            font-size: 1.1em;
            color: #333;
        `;
        modal.querySelector('.custom-modal-close').style.cssText = `
            padding: 10px 20px;
            background: #007bff;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 1em;
            transition: background 0.3s ease;
        `;
        modal.querySelector('.custom-modal-close:hover').style.backgroundColor = '#0056b3';

        // Close modal on button click
        modal.querySelector('.custom-modal-close').addEventListener('click', function() {
            document.body.removeChild(modal);
        });
    }

    // Handle file upload via click on upload area
    uploadArea.addEventListener('click', function() {
        imageInput.click();
    });

    // Handle drag and drop
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        uploadArea.style.backgroundColor = '#f0f0f0';
        uploadArea.style.borderColor = '#0056b3';
    });

    uploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        uploadArea.style.backgroundColor = '';
        uploadArea.style.borderColor = '#007bff';
    });

    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        uploadArea.style.backgroundColor = '';
        uploadArea.style.borderColor = '#007bff';
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleImageUpload(files[0]);
        }
    });

    // Handle file selection from input
    imageInput.addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            handleImageUpload(e.target.files[0]);
        }
    });

    // Process uploaded image file
    function handleImageUpload(file) {
        // Check file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            showCustomMessage('File size exceeds 5MB limit. Please choose a smaller image.');
            return;
        }
        
        // Check file type
        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
        if (!validTypes.includes(file.type)) {
            showCustomMessage('Please upload a JPG, PNG, or WEBP image.');
            return;
        }
        
        currentImageFile = file;
        
        // Preview image
        const reader = new FileReader();
        reader.onload = function(event) {
            previewImage.src = event.target.result;
            uploadArea.style.display = 'none';
            imagePreview.style.display = 'flex'; // Use flex for centering image and button
            analyzeBtn.disabled = false;
            resultsSection.style.display = 'none'; // Hide results if a new image is uploaded
            urgentCareAlert.style.display = 'none'; // Hide urgent alert
        };
        reader.readAsDataURL(file);
    }

    // Remove image
    removeImageBtn.addEventListener('click', function() {
        imageInput.value = ''; // Clear file input
        previewImage.src = '#';
        uploadArea.style.display = 'flex'; // Show upload area again
        imagePreview.style.display = 'none';
        analyzeBtn.disabled = true;
        resultsSection.style.display = 'none';
        urgentCareAlert.style.display = 'none';
        currentImageFile = null;
        additionalContext.value = ''; // Clear additional context
    });

    // Convert image to base64 for API call
    function imageToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64String = reader.result.split(',')[1]; // Remove data:image/jpeg;base64, prefix
                resolve(base64String);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // Analyze button click handler
    analyzeBtn.addEventListener('click', async function() {
        if (!currentImageFile) {
            showCustomMessage('Please upload an image first.');
            return;
        }

        // Show loading indicator
        loadingIndicator.style.display = 'flex';
        resultsSection.style.display = 'none';
        analyzeBtn.disabled = true;

        try {
            const base64Image = await imageToBase64(currentImageFile);
            
            const prompt = `You are a medical AI assistant helping with preliminary assessment of visible symptoms. Please analyze this image and provide:

1.  **Possible Conditions** (list 2-3 most likely conditions with confidence percentages, e.g., "Condition A (70%), Condition B (20%)")
2.  **Key Observations** (what you observe in the image, e.g., "Redness, swelling, presence of rash, lesion type, size, location")
3.  **Severity Assessment** (Mild/Moderate/Severe)
4.  **Immediate Care Recommendations** (e.g., "Clean the area, apply cold compress, avoid scratching")
5.  **When to Seek Medical Attention** (e.g., "If symptoms worsen, fever develops, pain increases, or no improvement in X days. Emphasize for rural users to seek local doctor/clinic.")
6.  **Home Care Suggestions** (if applicable, e.g., "Rest, hydration, over-the-counter medication, specific natural remedies if safe and appropriate")

Additional context provided by user: "${additionalContext.value.trim() || 'None provided'}"

IMPORTANT DISCLAIMERS TO INCLUDE AT THE END:
- This is NOT a medical diagnosis.
- Always consult qualified healthcare professionals for proper evaluation, diagnosis, and treatment.
- In case of severe symptoms or emergencies, seek immediate medical attention (e.g., call emergency services or go to the nearest hospital).
- This analysis is for informational purposes only and should not replace professional medical advice.
- The accuracy of the analysis depends on the clarity and quality of the provided image.

Please format your response clearly with bolded section titles and bullet points for readability.`;

            // Prepare request body for Gemini API
            const requestBody = {
                contents: [{
                    parts: [
                        { text: prompt },
                        { inlineData: { mimeType: currentImageFile.type, data: base64Image } }
                    ]
                }],
                generationConfig: {
                    temperature: 0.4,
                    topK: 32,
                    topP: 1,
                    maxOutputTokens: 2048,
                },
                safetySettings: [
                    { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                    { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                    { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                    { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
                ]
            };

            // Make API call to Gemini
            const response = await fetch(GEMINI_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`API Error: ${response.status} - ${errorData.error.message || response.statusText}`);
            }

            const data = await response.json();
            
            if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                const analysisText = data.candidates[0].content.parts[0].text;
                displayResults(analysisText);
            } else {
                throw new Error('Invalid response format from API or no content generated.');
            }

        } catch (error) {
            console.error('Error analyzing image:', error);
            
            let errorMessage = 'Sorry, we encountered an error while analyzing your image. ';
            
            if (error.message.includes('400')) {
                errorMessage += 'The image format may not be supported or the image may be corrupted. Please try uploading a different image.';
            } else if (error.message.includes('403')) {
                errorMessage += 'There was an authentication issue with our service. Please try again later.';
            } else if (error.message.includes('429')) {
                errorMessage += 'Our service is currently experiencing high demand. Please wait a moment and try again.';
            } else {
                errorMessage += 'Please check your internet connection and try again. If the problem persists, please contact support.';
            }
            
            resultsContainer.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Analysis Error</h3>
                    <p>${errorMessage}</p>
                    <button onclick="location.reload()" class="btn btn-primary">Try Again</button>
                </div>
            `;
            resultsSection.style.display = 'block';
        } finally {
            loadingIndicator.style.display = 'none';
            analyzeBtn.disabled = false;
        }
    });

    // Display analysis results
    function displayResults(analysisText) {
        // Convert markdown-like formatting to HTML
        let formatted = analysisText
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
            .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
            .replace(/^- (.*)/gm, '<li>$1</li>') // Convert markdown lists to HTML list items
            .replace(/\n\n/g, '</p><p>') // Double newline to paragraph
            .replace(/\n/g, '<br>'); // Single newline to break

        // Wrap list items in ul/ol if they are not already
        formatted = formatted.replace(/<li>.*?<\/li>/g, (match) => {
            if (!match.includes('<ul>') && !match.includes('<ol>')) {
                return `<ul>${match}</ul>`;
            }
            return match;
        });

        // Clean up empty paragraph tags that might appear from multiple newlines
        formatted = formatted.replace(/<p><\/p>/g, '');

        // Add a final paragraph tag if the content doesn't start with one
        if (!formatted.startsWith('<p>')) {
            formatted = '<p>' + formatted;
        }
        // Add closing paragraph tag if the content doesn't end with one
        if (!formatted.endsWith('</p>')) {
            formatted = formatted + '</p>';
        }


        // Check for urgent care indicators (case-insensitive)
        const urgentKeywords = ['severe', 'urgent', 'immediate', 'emergency', 'serious', 'critical', 'danger'];
        const isUrgent = urgentKeywords.some(keyword => 
            analysisText.toLowerCase().includes(keyword)
        );

        // Display results
        resultsContainer.innerHTML = `<div class="analysis-results">${formatted}</div>`;
        
        // Show urgent care alert if needed
        if (isUrgent) {
            urgentCareAlert.style.display = 'block';
            urgentCareText.textContent = 'Based on the analysis, this condition may require prompt medical attention. Please consider consulting a healthcare professional soon.';
        } else {
            urgentCareAlert.style.display = 'none';
        }

        // Set final disclaimer
        finalDisclaimer.textContent = 'IMPORTANT: This analysis is for informational purposes only and is NOT a medical diagnosis. Always consult with a qualified healthcare professional for proper evaluation and treatment of any health condition.';

        resultsSection.style.display = 'block';
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }

    // Camera functionality
    useCameraBtn.addEventListener('click', async function() {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                showCustomMessage('Camera access is not supported on this device/browser. Please upload an image instead.');
                return;
            }

            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'environment' // Use back camera if available
                } 
            });
            
            // Create video element and canvas for capture
            const video = document.createElement('video');
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            video.srcObject = stream;
            video.play();
            
            // Create capture interface modal
            const captureModal = document.createElement('div');
            captureModal.className = 'camera-modal';
            captureModal.innerHTML = `
                <div class="camera-modal-content">
                    <video autoplay playsinline></video>
                    <div class="camera-controls">
                        <button class="btn btn-primary" id="capturePhotoBtn"><i class="fas fa-camera"></i> Capture Photo</button>
                        <button class="btn btn-secondary" id="cancelCameraBtn"><i class="fas fa-times"></i> Cancel</button>
                    </div>
                </div>
            `;
            document.body.appendChild(captureModal);

            const videoElement = captureModal.querySelector('video');
            videoElement.srcObject = stream;
            videoElement.play();

            const capturePhotoBtn = captureModal.querySelector('#capturePhotoBtn');
            const cancelCameraBtn = captureModal.querySelector('#cancelCameraBtn');
            
            capturePhotoBtn.onclick = function() {
                canvas.width = videoElement.videoWidth;
                canvas.height = videoElement.videoHeight;
                ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
                
                canvas.toBlob(function(blob) {
                    const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
                    handleImageUpload(file);
                    
                    // Cleanup
                    stream.getTracks().forEach(track => track.stop());
                    document.body.removeChild(captureModal);
                }, 'image/jpeg', 0.8);
            };
            
            cancelCameraBtn.onclick = function() {
                stream.getTracks().forEach(track => track.stop());
                document.body.removeChild(captureModal);
            };
            
        } catch (error) {
            console.error('Camera error:', error);
            showCustomMessage('Unable to access camera. Please check permissions or upload an image instead.');
        }
    });

    // New Analysis button
    newImageAnalysisBtn.addEventListener('click', function() {
        removeImageBtn.click(); // This will reset the form and hide results
    });

    // Mobile navigation toggle (copied from index.js for consistency, can be moved to a shared script)
    const navToggle = document.querySelector('.nav-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (navToggle && navLinks) {
        navToggle.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            navToggle.classList.toggle('active');
        });
    }
});
