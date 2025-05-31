document.addEventListener('DOMContentLoaded', function() {
    const educationForm = document.getElementById('educationForm');
    const diagnosisInput = document.getElementById('diagnosis');
    const backgroundInfoTextarea = document.getElementById('backgroundInfo');
    const preferredLanguageSelect = document.getElementById('preferredLanguage');
    const educationResults = document.getElementById('educationResults');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const submitBtn = educationForm.querySelector('button[type="submit"]');

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
        const inputs = educationForm.querySelectorAll('input, textarea, select');
        if (isLoading) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = 'Generating Resources...';
            inputs.forEach(input => input.disabled = true);
            loadingIndicator.style.display = 'flex'; // Show loading spinner
            educationResults.style.display = 'none'; // Hide previous results
        } else {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Get Educational Resources';
            inputs.forEach(input => input.disabled = false);
            loadingIndicator.style.display = 'none'; // Hide loading spinner
        }
    }
    
    // Function to display educational resources
    function displayEducationResults(resources) {
        let htmlContent = `
            <div class="results-header">
                <h2>Your Health Education Materials</h2>
                <p>Based on your diagnosis and background:</p>
            </div>
            <div class="resources-container">
        `;
        
        resources.forEach((resource, index) => {
            htmlContent += `
                <div class="resource-item">
                    <strong>${index + 1}.</strong> ${resource}
                </div>
            `;
        });
        
        htmlContent += `
            </div>
            <div class="results-disclaimer">
                <strong>Important:</strong> This information is for general guidance only. Always consult healthcare professionals for personalized medical advice.
            </div>
            <div class="actions">
                <button type="button" class="btn btn-secondary" onclick="window.print()">Print</button>
                <button type="button" class="btn btn-primary" id="newEducationSearchBtn">New Search</button>
            </div>
        `;
        
        educationResults.innerHTML = htmlContent;
        educationResults.style.display = 'block';
        educationResults.scrollIntoView({ behavior: 'smooth' });

        // Add event listener for the "New Search" button
        document.getElementById('newEducationSearchBtn').addEventListener('click', function() {
            educationResults.style.display = 'none';
            diagnosisInput.value = '';
            backgroundInfoTextarea.value = '';
            preferredLanguageSelect.value = ''; // Reset select to default
            diagnosisInput.focus();
        });
    }
    
    // Function to display error messages
    function displayError(message) {
        educationResults.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Unable to Generate Resources</h3>
                <p>${message}</p>
                <button type="button" class="btn btn-primary" onclick="location.reload()">Try Again</button>
            </div>
        `;
        
        educationResults.style.display = 'block';
        educationResults.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Demo function for testing without backend (fallback)
    function generateDemoResources(diagnosis, background, language) {
        return [
            `Understanding ${diagnosis}: Basic information about your condition and how it affects your body.`,
            `Symptom management: Practical tips for managing common symptoms of ${diagnosis}.`,
            `Lifestyle modifications: Diet and exercise recommendations for people with ${diagnosis}.`,
            `Medication adherence: How to properly take prescribed medications for ${diagnosis}.`,
            `Warning signs: When to seek immediate medical attention for ${diagnosis}.`,
            `Daily care routine: Step-by-step self-care guide for managing ${diagnosis}.`,
            `Support resources: Finding help and support groups in your community.`
        ];
    }

    /**
     * Generates personalized health education prompt for Gemini API
     * @param {Object} input - The input parameters (diagnosis, background, language)
     * @returns {string} - The formatted prompt
     */
    function generateHealthEducationPrompt(input) {
        const { diagnosis, background, language } = input;
        
        return `You are a healthcare expert who provides personalized health education materials to patients.

Based on the patient's diagnosis, background, and preferred language, curate a list of relevant educational resources.
Consider the patient's cultural context and education level when selecting the resources. The educational resources should be short and easy to understand.
Respond in the patient's preferred language.

Diagnosis: ${diagnosis}
Background: ${background}
Language: ${language}

Please provide educational resources in the following categories:
- Basic Information about the condition
- Symptoms to watch for
- Treatment and management tips
- Lifestyle modifications
- When to seek medical help
- Preventive measures
- Home remedies (if applicable and safe)

Format your response as a JSON object with an "educationalResources" array containing detailed, practical information tailored to the patient's background and education level.

Example format:
{
  "educationalResources": [
    "Understanding [condition]: Simple explanation of what [condition] is and how it affects your body",
    "Managing symptoms: Practical tips for dealing with [specific symptoms]",
    "Diet recommendations: Foods to eat and avoid with [condition]",
    "Exercise guidelines: Safe physical activities for people with [condition]",
    "Medication management: How to take prescribed medications properly",
    "Warning signs: When to contact your doctor immediately",
    "Daily care routine: Step-by-step guide for daily self-care"
  ]
}

Make sure the information is:
1. Culturally appropriate
2. Easy to understand based on education level
3. Actionable and practical
4. Medically accurate
5. In the requested language`;
    }

    // Main function to get personalized health education materials from Gemini API
    async function getPersonalizedHealthEducation(input) {
        try {
            // Generate prompt
            const prompt = generateHealthEducationPrompt(input);

            // Prepare request body for Gemini API
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
                throw new Error(`Gemini API Error: ${response.status} - ${errorData.error.message || response.statusText}`);
            }

            const data = await response.json();
            
            if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
                throw new Error('Invalid response format from Gemini API or no content generated.');
            }

            const responseText = data.candidates[0].content.parts[0].text;
            
            // Try to parse JSON response
            let parsedResponse;
            try {
                // Extract JSON from response if it's wrapped in markdown code blocks
                const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) || 
                                responseText.match(/```\s*([\s\S]*?)\s*```/) ||
                                [null, responseText];
                
                parsedResponse = JSON.parse(jsonMatch[1] || responseText);
            } catch (parseError) {
                // If JSON parsing fails, create a structured response from the text
                console.warn('Failed to parse JSON response, creating structured response from text:', parseError);
                // Attempt to split by common headings if JSON parsing fails
                const sections = responseText.split(/^(?:- )?(Basic Information about the condition|Symptoms to watch for|Treatment and management tips|Lifestyle modifications|When to seek medical help|Preventive measures|Home remedies \(if applicable and safe\)):/im);
                const educationalResources = [];
                for (let i = 1; i < sections.length; i += 2) {
                    educationalResources.push(`${sections[i].trim()}: ${sections[i+1].trim()}`);
                }
                parsedResponse = {
                    educationalResources: educationalResources.length > 0 ? educationalResources : [responseText]
                };
            }

            // Validate the response structure
            if (!parsedResponse.educationalResources || !Array.isArray(parsedResponse.educationalResources)) {
                throw new Error('Invalid response structure: educationalResources array is required');
            }

            return parsedResponse;

        } catch (error) {
            console.error('Error in getPersonalizedHealthEducation:', error);
            throw error; // Re-throw to be caught by the form submit handler
        }
    }
    
    // Event listener for form submission
    educationForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const diagnosis = diagnosisInput.value.trim();
        const backgroundInfo = backgroundInfoTextarea.value.trim();
        const language = preferredLanguageSelect.value;
        
        if (!diagnosis || !language) {
            showCustomMessage('Please fill in the Diagnosis and Preferred Language fields.');
            return;
        }
        
        setLoadingState(true);
        
        try {
            const inputData = {
                diagnosis: diagnosis,
                background: backgroundInfo,
                language: language
            };
            
            const result = await getPersonalizedHealthEducation(inputData);
            displayEducationResults(result.educationalResources);
            
        } catch (error) {
            console.error('Health education generation failed:', error.message);
            
            let errorMessage = `Failed to generate personalized health education materials: ${error.message}. `;
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
            
            // Fallback to demo resources if API fails
            setTimeout(() => {
                const demoResources = generateDemoResources(diagnosis, backgroundInfo, language);
                displayEducationResults(demoResources);
                showCustomMessage('API call failed, displaying demo resources. Please try again later.');
            }, 1000);

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
