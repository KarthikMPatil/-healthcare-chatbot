require('dotenv').config();
const axios = require('axios');

exports.handler = async function(event, context) {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }

    const { message } = JSON.parse(event.body);
    if (!message) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Message is required' })
      };
    }

    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'API key not configured' })
      };
    }

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

    if (!response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid response from Gemini API');
    }

    const botResponse = response.data.candidates[0].content.parts[0].text;
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ response: botResponse })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to process request',
        details: error.message
      })
    };
  }
};
