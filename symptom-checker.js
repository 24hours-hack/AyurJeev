document.addEventListener('DOMContentLoaded', function() {
    const symptomForm = document.getElementById('symptomForm');
    const symptomsTextarea = document.getElementById('symptoms');
    const symptomResults = document.getElementById('symptomResults');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const submitBtn = symptomForm.querySelector('button[type="submit"]');

    // Gemini API configuration
    const GEMINI_API_KEY = 'AIzaSyBcQ5YwhtqBvzsR_mXfNmMCIQL7jjjWdXw';
    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`;

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

    // Function to set loading state
    function setLoadingState(isLoading) {
        if (isLoading) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = 'Analyzing Symptoms...';
            symptomsTextarea.disabled = true;
            loadingIndicator.style.display = 'flex'; // Show loading spinner
            symptomResults.style.display = 'none'; // Hide previous results
        } else {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Check Symptoms';
            symptomsTextarea.disabled = false;
            loadingIndicator.style.display = 'none'; // Hide loading spinner
        }
    }

    // Function to display symptom analysis results
    function displaySymptomResults(potentialCauses, nextSteps) {
        const htmlContent = `
            <div class="results-header">
                <h2>Symptom Analysis Results</h2>
                <p>Based on the symptoms you described:</p>
            </div>
            
            <div class="causes-section">
                <h3>Potential Causes</h3>
                <div class="content-box">
                    ${potentialCauses.replace(/\n/g, '<br>')}
                </div>
            </div>
            
            <div class="steps-section">
                <h3>Recommended Next Steps</h3>
                <div class="content-box">
                    ${nextSteps.replace(/\n/g, '<br>')}
                </div>
            </div>
            
            <div class="results-disclaimer">
                <strong>⚠️ Important Medical Disclaimer:</strong><br>
                This tool provides general information only and is not a substitute for professional medical advice, diagnosis, or treatment. 
                Always seek the advice of qualified healthcare providers with any questions about medical conditions. 
                In case of emergency, contact emergency services immediately.
            </div>
            
            <div class="actions">
                <button type="button" class="btn btn-secondary" onclick="window.print()">Print Results</button>
                <button type="button" class="btn btn-primary" id="newSymptomCheckBtn">New Symptom Check</button>
            </div>
        `;
        
        symptomResults.innerHTML = htmlContent;
        symptomResults.style.display = 'block';
        symptomResults.scrollIntoView({ behavior: 'smooth' });

        // Add event listener for the "New Symptom Check" button
        document.getElementById('newSymptomCheckBtn').addEventListener('click', function() {
            symptomResults.style.display = 'none';
            symptomsTextarea.value = '';
            symptomsTextarea.focus();
        });
    }

    // Function to display error messages
    function displayError(message) {
        symptomResults.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Unable to Analyze Symptoms</h3>
                <p>${message}</p>
                <button type="button" class="btn btn-primary" onclick="location.reload()">Try Again</button>
            </div>
        `;
        
        symptomResults.style.display = 'block';
        symptomResults.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Function to call Gemini API for symptom analysis
    async function analyzeSymptoms(symptoms) {
        const prompt = `You are an AI medical assistant providing potential causes and next steps based on symptoms. 
        
        Symptoms: ${symptoms}
        
        Please provide a comprehensive analysis in JSON format with the following structure:
        {
          "potentialCauses": "List potential causes for these symptoms, formatted with bullet points. Include both common and less common possibilities. Always emphasize that this is not a definitive diagnosis.",
          "nextSteps": "Provide recommended next steps considering this is for a rural population with limited access to medical specialists. Include immediate care, when to seek help, and rural healthcare options."
        }
        
        Important guidelines:
        - Be thorough but not alarmist
        - Consider rural healthcare access limitations
        - Always emphasize the need for professional medical evaluation
        - Include emergency warning signs
        - Suggest practical self-care when appropriate
        - Format with bullet points for readability`;

        const requestBody = {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                temperature: 0.3, // Lower temperature for more consistent, factual responses
                topK: 32,
                topP: 1,
                maxOutputTokens: 2048,
            },
            safetySettings: [
                {
                    category: "HARM_CATEGORY_HARASSMENT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    category: "HARM_CATEGORY_HATE_SPEECH",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                    threshold: "BLOCK_MEDIUM_AND_ABOVE"
                }
            ]
        };

        const response = await fetch(GEMINI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`Gemini API Error: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
            throw new Error('Invalid response from Gemini API');
        }

        const responseText = data.candidates[0].content.parts[0].text;
        
        try {
            // Try to parse JSON response
            const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) || 
                            responseText.match(/```\s*([\s\S]*?)\s*```/) ||
                            [null, responseText];
            
            const parsedResponse = JSON.parse(jsonMatch[1] || responseText);
            return parsedResponse;
        } catch (parseError) {
            // If JSON parsing fails, attempt to extract information from plain text
            console.warn('Failed to parse JSON response, attempting to extract from plain text:', parseError);
            let potentialCauses = 'No specific potential causes identified. Please consult a healthcare professional.';
            let nextSteps = 'Please consult with a healthcare professional for proper evaluation and treatment recommendations.';

            const lines = responseText.split('\n');
            let inCausesSection = false;
            let inStepsSection = false;

            for (const line of lines) {
                const lowerLine = line.toLowerCase();
                if (lowerLine.includes('potential causes') || lowerLine.includes('causes:')) {
                    inCausesSection = true;
                    inStepsSection = false;
                    potentialCauses = ''; // Reset if found
                    continue;
                }
                if (lowerLine.includes('next steps') || lowerLine.includes('recommendations:')) {
                    inStepsSection = true;
                    inCausesSection = false;
                    nextSteps = ''; // Reset if found
                    continue;
                }

                if (inCausesSection && line.trim() && !lowerLine.startsWith('important guidelines:')) {
                    potentialCauses += line.trim() + '\n';
                } else if (inStepsSection && line.trim() && !lowerLine.startsWith('important guidelines:')) {
                    nextSteps += line.trim() + '\n';
                }
            }
            
            return {
                potentialCauses: potentialCauses.trim() || 'No specific potential causes identified. Please consult a healthcare professional.',
                nextSteps: nextSteps.trim() || 'Please consult with a healthcare professional for proper evaluation and treatment recommendations.'
            };
        }
    }
    
    // Event listener for form submission
    symptomForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const symptoms = symptomsTextarea.value.trim();
        
        if (!symptoms) {
            showCustomMessage('Please describe your symptoms.');
            return;
        }
        
        if (symptoms.length < 20) { // Increased minimum length for better AI analysis
            showCustomMessage('Please provide a more detailed description of your symptoms (at least 20 characters).');
            return;
        }
        
        setLoadingState(true);
        
        try {
            const analysis = await analyzeSymptoms(symptoms);
            displaySymptomResults(analysis.potentialCauses, analysis.nextSteps);
            
        } catch (error) {
            console.error('Gemini API call failed:', error.message);
            
            let errorMessage = `Analysis failed: ${error.message}. `;
            if (error.message.includes('400')) {
                errorMessage += 'There might be an issue with the request format. Please try again with different phrasing.';
            } else if (error.message.includes('403')) {
                errorMessage += 'Authentication failed. Please check your API key or contact support.';
            } else if (error.message.includes('429')) {
                errorMessage += 'Too many requests. Please wait a moment and try again.';
            } else {
                errorMessage += 'Please check your internet connection and try again. If the problem persists, please contact support.';
            }
            displayError(errorMessage);
        } finally {
            setLoadingState(false);
        }
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
