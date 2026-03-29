

const initializeGemini = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.warn('GEMINI_API_KEY not found in environment variables');
    return null;
  }

  
  console.log('Gemini API initialized');
  return { apiKey };
};

module.exports = {
  initializeGemini,
  getApiKey: () => process.env.GEMINI_API_KEY,
};
