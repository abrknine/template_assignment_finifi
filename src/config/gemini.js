// Gemini API Configuration
// Add your Gemini API key to .env as GEMINI_API_KEY

const initializeGemini = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.warn('GEMINI_API_KEY not found in environment variables');
    return null;
  }

  // Initialize Gemini client here when implemented
  // For now, this is a placeholder
  console.log('Gemini API initialized');
  return { apiKey };
};

module.exports = {
  initializeGemini,
  getApiKey: () => process.env.GEMINI_API_KEY,
};
