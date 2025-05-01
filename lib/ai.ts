import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

// Initialize Google Generative AI with API key
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

// Get the model
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

// Configure safety settings
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

// System prompt for the AI assistant
const systemPrompt = `
You are Pay.Qudmeet's helpful assistant. Your job is to assist users with their currency exchange needs between Naira (Nigeria) and Rupees (India).

Key information:
- We charge a flat fee of 50 Rs per transaction
- We update exchange rates daily at 11 AM
- Users can send their currency to us, and we'll send the equivalent to the recipient
- Typical processing time is within 24 hours
- We support exchanges between Nigerian Naira (NGN) and Indian Rupees (INR)

Always be helpful, concise, and accurate in your responses.
`;

export async function getAIResponse(userMessage: string): Promise<string> {
  try {
    // Start a chat
    const chat = model.startChat({
      generationConfig: {
        temperature: 0.2,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 1024,
      },
      safetySettings,
      history: [
        {
          role: 'user',
          parts: [{ text: 'You are a helpful assistant for Pay.Qudmeet currency exchange service.' }],
        },
        {
          role: 'model',
          parts: [{ text: "I'm the Pay.Qudmeet assistant, ready to help with currency exchange between Nigeria and India!" }],
        },
      ],
    });

    // Send user message
    const result = await chat.sendMessage(userMessage);
    const response = result.response.text();
    return response;
  } catch (error) {
    console.error('Error getting AI response:', error);
    return "I'm sorry, I'm having trouble processing your request right now. Please try again later or contact customer support.";
  }
}

// Helper function to handle common questions
export async function handleCommonQuestion(question: string): Promise<string | null> {
  // Map of common questions and their answers
  const commonQuestions: Record<string, string> = {
    'what is today\'s rate': 'Our current exchange rate is updated daily at 11 AM. Please check the dashboard for the latest rate.',
    'how long does it take': 'Transactions are typically processed within 24 hours after both parties have completed their payments.',
    'what is the fee': 'We charge a flat fee of 50 Rs per transaction, regardless of the amount being exchanged.',
    'where should i send my payment': 'You\'ll receive payment instructions after initiating a transaction. The details will be provided on the transaction page.',
    'is it safe': 'Yes, our platform is designed with safety in mind. We act as a trusted middleman, holding funds until both parties complete their part of the exchange.',
    'how do i start': 'To start an exchange, go to the dashboard and click on "Start Exchange", then follow the instructions provided.',
  };

  // Normalize the question
  const normalizedQuestion = question.toLowerCase().trim();
  
  // Try to find a match
  for (const [key, answer] of Object.entries(commonQuestions)) {
    if (normalizedQuestion.includes(key)) {
      return answer;
    }
  }
  
  // If no match, return null and we'll use the AI
  return null;
} 