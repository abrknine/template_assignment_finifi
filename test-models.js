require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testModel(modelName) {
  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent('Hello');
    console.log(`✅ ${modelName} - WORKS`);
    return true;
  } catch (error) {
    console.log(`❌ ${modelName} - ${error.message.split('\n')[0]}`);
    return false;
  }
}

async function findWorkingModel() {
  console.log('Testing model names...\n');
  
  const modelNames = [
    'gemini-pro',
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-2.0-flash',
    'gemini-1.5-flash-8b',
    'gemini-pro-vision'
  ];
  
  for (const model of modelNames) {
    await testModel(model);
  }
}

findWorkingModel();
