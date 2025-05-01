import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getAIResponse, handleCommonQuestion } from '@/lib/ai';

export async function POST(req: Request) {
  const { userId } = auth();
  if (!userId) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const body = await req.json();
    const { message } = body;

    if (!message) {
      return new NextResponse('Message is required', { status: 400 });
    }

    // First check if it's a common question we can answer directly
    const commonAnswer = await handleCommonQuestion(message);
    
    if (commonAnswer) {
      // It's a common question, return the pre-defined answer
      return NextResponse.json({ 
        answer: commonAnswer,
        source: 'common' 
      });
    }

    // If not a common question, use the AI
    const aiResponse = await getAIResponse(message);
    
    return NextResponse.json({ 
      answer: aiResponse,
      source: 'ai' 
    });
  } catch (error) {
    console.error('Error getting AI response:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 