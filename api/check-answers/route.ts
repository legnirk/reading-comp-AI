import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { context, questionText, userAnswers } = await request.json();

    if (!context || !questionText || !userAnswers) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create a filled-in version of the question text
    let filledQuestionText = questionText;
    const blankRegex = /___+/g;
    let match;
    let index = 0;
    
    while ((match = blankRegex.exec(questionText)) !== null) {
      if (index < userAnswers.length) {
        filledQuestionText = filledQuestionText.replace(match[0], userAnswers[index]);
        index++;
      }
    }

    // Prepare the prompt for OpenAI
    const prompt = `
Context paragraph: "${context}"

Original question paragraph with blanks: "${questionText}"

Student's filled-in paragraph: "${filledQuestionText}"

Evaluate if the student's answers make sense based on the context paragraph. For each blank, determine:
1. If the answer is factually accurate based on the context
2. If the answer is grammatically correct in the sentence

Provide specific feedback for each blank and an overall assessment. Be encouraging but honest.
`;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are an educational assistant that evaluates reading comprehension exercises." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const feedback = completion.choices[0].message.content;

    return NextResponse.json({ feedback });
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}