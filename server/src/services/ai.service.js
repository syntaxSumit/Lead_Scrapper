const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { GoogleAuth } = require('google-auth-library');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Check for Google Cloud Service Account (uses ₹28,569 credits)
const keyPath = path.resolve(__dirname, '../../google-key.json');
let googleAuth = null;
let googleProjectId = null;

if (fs.existsSync(keyPath)) {
  try {
    process.env.GOOGLE_APPLICATION_CREDENTIALS = keyPath;
    const keyData = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
    googleProjectId = keyData.project_id || process.env.GCP_PROJECT_ID;
    googleAuth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });
    console.log(`[AI] Google Cloud Vertex AI initialized from file for project ${googleProjectId}`);
  } catch (err) {
    console.error('[AI] Google Cloud Service Account warning:', err.message);
  }
} else if (process.env.GCP_SERVICE_ACCOUNT_KEY) {
  try {
    const keyData = JSON.parse(process.env.GCP_SERVICE_ACCOUNT_KEY);
    googleProjectId = keyData.project_id || process.env.GCP_PROJECT_ID;
    googleAuth = new GoogleAuth({
      credentials: keyData,
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });
    console.log(`[AI] Google Cloud Vertex AI initialized from env variable for project ${googleProjectId}`);
  } catch (err) {
    console.error('[AI] GCP_SERVICE_ACCOUNT_KEY parse error:', err.message);
  }
}

/**
 * Universal AI Caller
 * Supports:
 * 1. Google Cloud Vertex AI (uses ₹28,569 Google Cloud Credits)
 * 2. AI Gateways (OpenRouter, Cloudflare, etc.)
 * 3. Direct Google Gemini API
 */

function cleanJSONResponse(rawText) {
  if (!rawText) return {};
  const cleaned = rawText
    .trim()
    .replace(/^```json?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    // If there is surrounding text, try extracting between first { and last }
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const extracted = cleaned.substring(firstBrace, lastBrace + 1);
      return JSON.parse(extracted);
    }
    throw new Error(`Failed to parse AI JSON response: ${err.message}. Raw: ${rawText.slice(0, 200)}`);
  }
}

async function callAIGateway({ prompt, systemPrompt, modelName }) {
  let baseUrl = (process.env.AI_GATEWAY_URL || '').trim().replace(/\/+$/, '');
  if (!baseUrl.endsWith('/chat/completions')) {
    baseUrl = `${baseUrl}/chat/completions`;
  }

  const apiKey = process.env.AI_API_KEY || process.env.GEMINI_API_KEY;
  const model = modelName || process.env.AI_MODEL || 'google/gemini-2.5-flash';

  const messages = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
    // Common gateway headers (e.g. OpenRouter attribution)
    'HTTP-Referer': 'https://leadscout.local',
    'X-Title': 'LeadScout',
  };

  const response = await axios.post(
    baseUrl,
    {
      model,
      messages,
      temperature: 0.3,
      // Many modern gateways support json_object response_format
      response_format: { type: 'json_object' },
    },
    {
      headers,
      timeout: 45000,
    }
  );

  const content = response.data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('AI Gateway returned empty response');
  }

  return cleanJSONResponse(content);
}

async function callDirectGemini({ prompt, systemPrompt, modelName }) {
  const apiKey = (process.env.GEMINI_API_KEY || process.env.AI_API_KEY || '').trim();
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in .env file.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const selectedModel = modelName || process.env.GEMINI_MODEL || 'gemini-1.5-flash';

  const modelOptions = {
    model: selectedModel,
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.3,
    },
  };

  if (systemPrompt) {
    modelOptions.systemInstruction = systemPrompt;
  }

  const model = genAI.getGenerativeModel(modelOptions);

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return cleanJSONResponse(text);
  } catch (err) {
    console.error('[Gemini API Error]:', err.message);
    throw err;
  }
}

async function callGoogleCloudVertex({ prompt, systemPrompt, modelName }) {
  const client = await googleAuth.getClient();
  const token = await client.getAccessToken();
  const selectedModel = modelName || process.env.GEMINI_MODEL || 'gemini-3.5-flash';
  const location = process.env.VERTEX_LOCATION || 'global';

  const url = `https://aiplatform.googleapis.com/v1/projects/${googleProjectId}/locations/${location}/publishers/google/models/${selectedModel}:generateContent`;

  const body = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.3,
    },
  };

  if (systemPrompt) {
    body.systemInstruction = {
      parts: [{ text: systemPrompt }],
    };
  }

  const response = await axios.post(url, body, {
    headers: {
      Authorization: `Bearer ${token.token}`,
      'Content-Type': 'application/json',
    },
    timeout: 30000,
  });

  const content = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) {
    throw new Error('Google Cloud Vertex AI returned empty response');
  }

  return cleanJSONResponse(content);
}

/**
 * Main export: generateJSON
 * Automatically chooses:
 * 1. Google Cloud Vertex AI (if google-key.json is present, using ₹28,569 credits)
 * 2. Gateway or Direct Gemini
 */
async function generateJSON({ prompt, systemPrompt, modelName }) {
  if (googleAuth) {
    return callGoogleCloudVertex({ prompt, systemPrompt, modelName });
  }

  const isGateway = Boolean(process.env.AI_GATEWAY_URL);

  if (isGateway) {
    return callAIGateway({ prompt, systemPrompt, modelName });
  }

  return callDirectGemini({ prompt, systemPrompt, modelName });
}

module.exports = { generateJSON };
