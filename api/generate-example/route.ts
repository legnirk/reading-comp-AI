import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function GET(_request: NextRequest) {
  try {
    // Check if API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key is missing');
      return NextResponse.json(
        { error: 'Server configuration error: API key missing' },
        { status: 500 }
      );
    }

    console.log('Generating new reading example');
    
    // List of potential topics for variety
    const topics = [
      "science (e.g., animals, space, weather)",
      "history (e.g., ancient civilizations, important events)",
      "geography (e.g., countries, landforms, ecosystems)",
      "technology (e.g., inventions, computers, robots)",
      "health (e.g., nutrition, exercise, body systems)",
      "literature (e.g., famous stories, authors)",
      "arts (e.g., music, painting, dance)",
      "social studies (e.g., cultures, communities)"
    ];
    
    // Randomly select a topic
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];

    // Prepare the prompt for OpenAI
    const prompt = `
Create an educational reading exercise for 6th grade students (approximately 900 Lexile level) about ${randomTopic}.

First, write an informative context paragraph (150-200 words) that provides clear facts and explanations about the topic. Use vocabulary and sentence structures appropriate for 6th grade students.

Then, create a completely separate question paragraph (different from the context paragraph) with 8-10 blanks. This paragraph should ask inference questions that require students to apply information they learned from the context paragraph. The blanks should test reading comprehension, inference, and critical thinking skills.

IMPORTANT FORMATTING INSTRUCTIONS:
1. Use exactly three underscores (___)  for each blank
2. Do NOT number the blanks or add any additional characters
3. The blanks should appear naturally in the sentence, like this example:
   "The water cycle begins when the sun heats water, causing it to turn into ___. This vapor rises into the ___ where it forms clouds."

Format your response as a valid JSON object with the following structure:
{
  "context": "Your informative paragraph here...",
  "questionText": "Your separate paragraph with inference questions and blanks (using ___ only) here..."
}

Make sure to:
- Use only ___ for blanks (no numbers or extra characters)
- Create a question paragraph that is different from the context
- Require inference and critical thinking to fill in the blanks
- Escape any quotes or special characters to ensure valid JSON
`;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: "You are an educational content creator specializing in grade-appropriate reading materials. Always respond with valid JSON." 
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: "json_object" }
    });

    // Parse the response
    const responseContent = completion.choices[0].message.content;
    if (!responseContent) {
      throw new Error('No content received from OpenAI');
    }
    const example = JSON.parse(responseContent);
    
    return NextResponse.json(example);
  } catch (error) {
    console.error('Error generating example:', error);
    return NextResponse.json(
      { error: `Failed to generate example: ${error instanceof Error ? error.message : 'Unknown error occurred'}` },
      { status: 500 }
    );
  }
}