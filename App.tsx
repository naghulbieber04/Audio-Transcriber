
import React, { useState, useCallback } from 'react';
import { generateTranscriptFromText, translateTranscript } from './services/geminiService';
import type { TranscriptItem } from './types';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';

const SUPPORTED_LANGUAGES = [
  { id: 'Hinglish', name: 'Hinglish' },
  { id: 'Manglish', name: 'Manglish' },
  { id: 'Conversational Tamil', name: 'Conversational Tamil' },
];

const Header: React.FC = () => (
  <header className="text-center p-4 md:p-6">
    <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">
      AI Transcript Translator
    </h1>
    <p className="text-gray-400 mt-2 text-lg">
      Generate and translate timestamped transcripts into conversational languages.
    </p>
  </header>
);

interface TranscriptPanelProps {
  title: string;
  transcript: TranscriptItem[] | null;
  isLoading: boolean;
  placeholder: string;
}

const TranscriptPanel: React.FC<TranscriptPanelProps> = ({ title, transcript, isLoading, placeholder }) => (
  <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-2xl shadow-lg w-full">
    <h2 className="text-xl font-semibold text-white p-4 border-b border-gray-700">{title}</h2>
    <div className="p-4 h-96 overflow-y-auto">
      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <LoadingSpinner />
        </div>
      ) : transcript && transcript.length > 0 ? (
        <ul className="space-y-3">
          {transcript.map((item, index) => (
            <li key={index} className="flex items-start space-x-3 text-sm">
              <span className="font-mono text-indigo-400 whitespace-nowrap pt-1">[{item.timestamp}]</span>
              <p className="text-gray-200 leading-relaxed">{item.text}</p>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex items-center justify-center h-full text-gray-500">
          {placeholder}
        </div>
      )}
    </div>
  </div>
);


const App: React.FC = () => {
  const [rawText, setRawText] = useState<string>('');
  const [transcript, setTranscript] = useState<TranscriptItem[] | null>(null);
  const [translation, setTranslation] = useState<TranscriptItem[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [activeLanguage, setActiveLanguage] = useState<string | null>(null);

  const handleGenerateTranscript = useCallback(async () => {
    if (!rawText.trim()) {
      setError('Please enter some text to generate a transcript.');
      return;
    }
    setIsLoading(true);
    setError('');
    setTranscript(null);
    setTranslation(null);
    setActiveLanguage(null);
    try {
      const result = await generateTranscriptFromText(rawText);
      setTranscript(result);
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [rawText]);

  const handleTranslate = useCallback(async (language: string) => {
    if (!transcript) {
      setError('Please generate a transcript first.');
      return;
    }
    setIsTranslating(true);
    setError('');
    setTranslation(null);
    setActiveLanguage(language);
    try {
      const result = await translateTranscript(transcript, language);
      setTranslation(result);
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsTranslating(false);
    }
  }, [transcript]);

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans bg-gradient-to-br from-gray-900 via-indigo-900/40 to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Header />

        <main>
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 shadow-lg mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-white">1. Paste Your Text</h2>
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste the text from your audio file here..."
              className="w-full h-40 p-4 bg-gray-800/60 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all duration-300 resize-none"
              disabled={isLoading}
            />
            <button
              onClick={handleGenerateTranscript}
              disabled={isLoading}
              className="mt-4 px-8 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed transition-colors duration-300 flex items-center justify-center w-full sm:w-auto"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </>
              ) : 'Generate Transcript'}
            </button>
          </div>

          {error && <ErrorMessage message={error} />}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <TranscriptPanel
              title="2. Generated Transcript"
              transcript={transcript}
              isLoading={isLoading}
              placeholder="Your generated transcript with timestamps will appear here."
            />

            <div className="flex flex-col gap-4">
              <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-4 shadow-lg">
                <h2 className="text-xl font-semibold text-white mb-3">3. Translate</h2>
                <div className="flex flex-wrap gap-2">
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <button
                      key={lang.id}
                      onClick={() => handleTranslate(lang.id)}
                      disabled={isTranslating || !transcript}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200
                        ${activeLanguage === lang.id ? 'bg-purple-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}
                        disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed`}
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>
              </div>
              <TranscriptPanel
                title="Translation"
                transcript={translation}
                isLoading={isTranslating}
                placeholder="Your translation will appear here."
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
