"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

// Fallback examples in case API fails
const fallbackExample = {
  context: "The modern Olympic Games are a major international multi-sport event held once every four years. The Games were first held in 1896 in Athens, Greece, and were most recently held in 2021 in Tokyo, Japan (delayed from 2020 due to the COVID-19 pandemic). The International Olympic Committee (IOC) organizes the Games and oversees the host city's preparations. The Winter Olympic Games were created for snow and ice sports and are held separately from the Summer Olympic Games, starting in 1924. Originally, both the Summer and Winter Games were held in the same year, but since 1994, they have been celebrated two years apart.",
  questionText: "The Olympic Games are a ___ sporting event that occurs every ___ years. They were first held in ___ in Athens, Greece. The most recent Olympics were held in ___, Japan in ___ instead of 2020 because of the ___. The ___ is responsible for organizing the Games. The Winter Olympics, which focus on ___ sports, began in ___ and are now held ___ years apart from the Summer Games."
};

// Create a client component that uses useSearchParams
function ReadingAppContent() {
  const [context, setContext] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [feedback, setFeedback] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingExample, setIsGeneratingExample] = useState(false);
  const [blanksCount, setBlanksCount] = useState(0);
  const [showResults, setShowResults] = useState(false);
  
  const searchParams = useSearchParams();
  const isEmbedded = searchParams.get('embedded') === 'true';
  
  // Parse the question text to identify blanks
  const parseQuestionText = (text: string) => {
    const blankRegex = /___+/g;
    const matches = text.match(blankRegex) || [];
    setBlanksCount(matches.length);
    
    if (matches.length > 0) {
      // Initialize user answers array with empty strings
      setUserAnswers(new Array(matches.length).fill(''));
    }
  };

  // Handle changes to the question text
  const handleQuestionTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setQuestionText(newText);
    parseQuestionText(newText);
  };

  // Handle changes to user answers
  const handleAnswerChange = (index: number, value: string) => {
    const newAnswers = [...userAnswers];
    newAnswers[index] = value;
    setUserAnswers(newAnswers);
  };

  // Submit answers for evaluation
  const handleSubmit = async () => {
    setIsLoading(true);
    setShowResults(false);
    
    try {
      console.log('Submitting answers:', { context, questionText, userAnswers });
      
      const response = await fetch('/api/check-answers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          context,
          questionText,
          userAnswers,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to check answers');
      }
      
      setFeedback(data.feedback || 'No feedback received');
      setShowResults(true);
    } catch (error: unknown) {
      console.error('Error checking answers:', error);
      setFeedback(`Error: ${error instanceof Error ? error.message : 'An unknown error occurred'}`);
      setShowResults(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset the form
  const handleReset = () => {
    setContext('');
    setQuestionText('');
    setUserAnswers([]);
    setFeedback('');
    setBlanksCount(0);
    setShowResults(false);
  };

  // Load a random example using OpenAI
  const loadRandomExample = async () => {
    setIsGeneratingExample(true);
    
    try {
      const response = await fetch('/api/generate-example');
      
      if (!response.ok) {
        throw new Error('Failed to generate example');
      }
      
      const example = await response.json();
      
      setContext(example.context);
      setQuestionText(example.questionText);
      parseQuestionText(example.questionText);
    } catch (error) {
      console.error('Error generating example:', error);
      // Use fallback example if API fails
      setContext(fallbackExample.context);
      setQuestionText(fallbackExample.questionText);
      parseQuestionText(fallbackExample.questionText);
      alert('Could not generate a new example. Using a default example instead.');
    } finally {
      setIsGeneratingExample(false);
    }
  };

  // Add this CSS to hide the header when embedded
  useEffect(() => {
    if (isEmbedded) {
      document.querySelector('header')?.classList.add('hidden');
    }
    
    return () => {
      document.querySelector('header')?.classList.remove('hidden');
    }
  }, [isEmbedded]);

  return (
    <div className={`min-h-screen py-8 ${isEmbedded ? 'pt-0' : ''}`}>
      <div className="max-w-4xl mx-auto">
        {!isEmbedded && (
          <>
            <h1 className="text-4xl font-bold mb-6">Reading Inference App</h1>
            <p className="text-lg text-gray-600 mb-8">
              This app helps students practice reading comprehension and inference skills. 
              Enter a context paragraph and a question paragraph with blanks (use underscores like ___ for blanks). 
              Students fill in the blanks based on the context, and our AI will evaluate their answers.
            </p>
          </>
        )}
        
        <div className="mb-6 flex justify-end">
          <button
            onClick={loadRandomExample}
            disabled={isGeneratingExample}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGeneratingExample ? 'Generating...' : 'Load Random Example'}
          </button>
        </div>
        
        <div className="space-y-8">
          {/* Context Input */}
          <div>
            <label htmlFor="context" className="block text-lg font-medium mb-2">
              Context Paragraph
            </label>
            <textarea
              id="context"
              className="w-full p-3 border rounded-md h-40"
              placeholder="Enter the context paragraph here (e.g., information about the Olympics)"
              value={context}
              onChange={(e) => setContext(e.target.value)}
            />
          </div>
          
          {/* Question Input */}
          <div>
            <label htmlFor="question" className="block text-lg font-medium mb-2">
              Question Paragraph with Blanks
            </label>
            <textarea
              id="question"
              className="w-full p-3 border rounded-md h-40"
              placeholder="Enter the question paragraph with blanks (use ___ for each blank)"
              value={questionText}
              onChange={handleQuestionTextChange}
            />
            <p className="text-sm text-gray-500 mt-1">
              Use underscores (_) to create blanks. Example: The Olympics are held every ___ years.
            </p>
          </div>
          
          {/* Answer Inputs */}
          {blanksCount > 0 && (
            <div>
              <h3 className="text-xl font-medium mb-4">Fill in the Blanks</h3>
              <div className="space-y-4">
                {Array.from({ length: blanksCount }).map((_, index) => (
                  <div key={index} className="flex items-center">
                    <span className="mr-3 font-medium">Blank {index + 1}:</span>
                    <input
                      type="text"
                      className="p-2 border rounded-md w-full max-w-md"
                      value={userAnswers[index] || ''}
                      onChange={(e) => handleAnswerChange(index, e.target.value)}
                      placeholder="Your answer"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={handleSubmit}
              disabled={isLoading || blanksCount === 0 || userAnswers.some(answer => !answer)}
              className="px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Checking...' : 'Check Answers'}
            </button>
            <button
              onClick={handleReset}
              className="px-6 py-3 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition"
            >
              Reset
            </button>
          </div>
          
          {/* Results */}
          {showResults && (
            <div className="mt-8 p-6 bg-gray-50 rounded-lg border">
              <h3 className="text-xl font-medium mb-4">Feedback</h3>
              <div className="prose max-w-none whitespace-pre-line">
                {feedback}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Main page component with Suspense
export default function ReadingAppPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-[500px]">Loading...</div>}>
      <ReadingAppContent />
    </Suspense>
  );
}