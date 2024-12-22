require('dotenv').config();
const axios = require('axios');

exports.handler = async function(event, context) {
  console.log('Function invoked with event:', event);

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return { 
      statusCode: 200, 
      headers, 
      body: JSON.stringify({ message: 'Preflight call successful' })
    };
  }

  try {
    if (event.httpMethod !== 'POST') {
      throw new Error('Method not allowed');
    }

    console.log('Request body:', event.body);
    const { message } = JSON.parse(event.body);
    if (!message) {
      throw new Error('Message is required');
    }

    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      console.error('API key not configured');
      throw new Error('API key not configured');
    }

    console.log('Making request to Gemini API...');
    const response = await axios({
      method: 'post',
      url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
      headers: {
        'Content-Type': 'application/json'
      },
      params: {
        key: apiKey
      },
      data: {
        contents: [{
          parts: [{
            text: `You are a friendly and empathetic healthcare assistant. Analyze the user's concern and provide a clear, concise response. Format your response in a conversational way, but include these key points:

1. Brief acknowledgment of their concern
2. Possible causes (if applicable)
3. Clear, actionable recommendations
4. When to seek professional help

Keep the tone warm and supportive. Avoid medical jargon unless necessary, and if used, explain it simply.

User's concern: ${message}`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      }
    });

    console.log('Received response from Gemini API');
    console.log('Response data:', JSON.stringify(response.data));
    
    if (!response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.error('Invalid response structure:', JSON.stringify(response.data));
      throw new Error('Invalid response from Gemini API');
    }

    const botResponse = response.data.candidates[0].content.parts[0].text;
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ response: botResponse })
    };

  } catch (error) {
    console.error('Error details:', error);
    
    return {
      statusCode: error.response?.status || 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to process request',
        details: error.message,
        response: error.response?.data
      })
    };
  }
};
