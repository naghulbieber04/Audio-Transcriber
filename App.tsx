import React, { useState, useCallback } from 'react';
import { generateTranscriptFromAudio, translateTranscript } from './services/geminiService';
import type { TranscriptItem } from './types';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
import AudioUploader from './components/AudioUploader';

const LANGUAGES = [
  { id: 'Arabic', name: 'Arabic' },
  { id: 'Bengali', name: 'Bengali' },
  { id: 'Chinese (Simplified)', name: 'Chinese (Simplified)' },
  { id: 'Chinese (Traditional)', name: 'Chinese (Traditional)' },
  { id: 'Czech', name: 'Czech' },
  { id: 'Danish', name: 'Danish' },
  { id: 'Dutch', name: 'Dutch' },
  { id: 'English', name: 'English' },
  { id: 'Finnish', name: 'Finnish' },
  { id: 'French', name: 'French' },
  { id: 'German', name: 'German' },
  { id: 'Greek', name: 'Greek' },
  { id: 'Gujarati', name: 'Gujarati' },
  { id: 'Hebrew', name: 'Hebrew' },
  { id: 'Hindi', name: 'Hindi' },
  { id: 'Hinglish', name: 'Hinglish' },
  { id: 'Hungarian', name: 'Hungarian' },
  { id: 'Indonesian', name: 'Indonesian' },
  { id: 'Italian', name: 'Italian' },
  { id: 'Japanese', name: 'Japanese' },
  { id: 'Kannada', name: 'Kannada' },
  { id: 'Korean', name: 'Korean' },
  { id: 'Malayalam', name: 'Malayalam' },
  { id: 'Marathi', name: 'Marathi' },
  { id: 'Norwegian', name: 'Norwegian' },
  { id: 'Persian', name: 'Persian' },
  { id: 'Polish', name: 'Polish' },
  { id: 'Portuguese', name: 'Portuguese' },
  { id: 'Punjabi', name: 'Punjabi' },
  { id: 'Romanian', name: 'Romanian' },
  { id: 'Russian', name: 'Russian' },
  { id: 'Slovak', name: 'Slovak' },
  { id: 'Spanish', name: 'Spanish' },
  { id: 'Swedish', name: 'Swedish' },
  { id: 'Tamil', name: 'Tamil' },
  { id: 'Telugu', name: 'Telugu' },
  { id: 'Thai', name: 'Thai' },
  { id: 'Turkish', name: 'Turkish' },
  { id: 'Ukrainian', name: 'Ukrainian' },
  { id: 'Urdu', name: 'Urdu' },
  { id: 'Vietnamese', name: 'Vietnamese' },
];

const Header: React.FC = () => (
  <header className="text-center p-4 md:p-6">
    <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">
      AI Transcript Translator
    </h1>
    <p className="text-gray-400 mt-2 text-lg">
      Upload an audio file, select a language, and get both a transcript and a translation.
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
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [transcript, setTranscript] = useState<TranscriptItem[] | null>(null);
  const [translation, setTranslation] = useState<TranscriptItem[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>(LANGUAGES[0].id);

  const handleProcessAudio = useCallback(async () => {
    if (!audioFile) {
      setError('Please select an audio file.');
      return;
    }
     if (!selectedLanguage) {
      setError('Please select a language.');
      return;
    }

    // Reset states
    setIsLoading(true);
    setIsTranslating(false);
    setError('');
    setTranscript(null);
    setTranslation(null);

    // Step 1: Generate Transcript
    try {
      const transcriptResult = await generateTranscriptFromAudio(audioFile);
      setTranscript(transcriptResult);
      setIsLoading(false);

      // Step 2: Translate Transcript
      setIsTranslating(true);
      try {
        const translationResult = await translateTranscript(transcriptResult, selectedLanguage);
        setTranslation(translationResult);
      } catch (translateErr: any) {
        setError(translateErr.message || 'An unknown translation error occurred.');
      } finally {
        setIsTranslating(false);
      }
      
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred during transcription.');
      setIsLoading(false); // Stop loading if transcription fails
    }
  }, [audioFile, selectedLanguage]);

  const handleSave = useCallback(() => {
    if (!transcript || !translation) {
      return;
    }

    const formatContent = (title: string, items: TranscriptItem[]) => {
      let content = `${title}\n\n`;
      items.forEach(item => {
        content += `[${item.timestamp}] ${item.text}\n`;
      });
      return content;
    };

    const originalContent = formatContent('Generated Transcript (English)', transcript);
    const translationTitle = `Translation (${selectedLanguage === 'Malayalam' ? 'Manglish' : selectedLanguage})`;
    const translatedContent = formatContent(translationTitle, translation);

    const fullContent = `${originalContent}\n\n---\n\n${translatedContent}`;

    const blob = new Blob([fullContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Sanitize filename
    const safeLanguage = selectedLanguage.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const fileName = `transcript-${safeLanguage}.txt`;
    
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [transcript, translation, selectedLanguage]);

  const isProcessing = isLoading || isTranslating;

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans bg-gradient-to-br from-gray-900 via-indigo-900/40 to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Header />

        <main>
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 shadow-lg mb-8">
            <h2 className="text-2xl font-semibold mb-4 text-white">1. Configure and Generate</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <div>
                 <label className="block text-sm font-medium text-gray-300 mb-2">Upload Audio File</label>
                 <AudioUploader onFileSelect={setAudioFile} disabled={isProcessing} />
              </div>
              <div className="w-full">
                <label htmlFor="language-select" className="block text-sm font-medium text-gray-300 mb-2">Select Target Language</label>
                <select
                  id="language-select"
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  disabled={isProcessing}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-800 disabled:text-gray-500"
                  aria-label="Select language for translation"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang.id} value={lang.id}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
             <div className="mt-6 flex flex-col sm:flex-row items-center gap-4">
              <button
                onClick={handleProcessAudio}
                disabled={isProcessing || !audioFile || !selectedLanguage}
                className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed transition-colors duration-300 flex items-center justify-center w-full sm:w-auto"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating Transcript...
                  </>
                ) : isTranslating ? (
                   <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Translating...
                  </>
                ) : 'Generate & Translate'}
              </button>

              {transcript && translation && (
                <button
                  onClick={handleSave}
                  disabled={isProcessing}
                  className="px-8 py-3 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-500 disabled:bg-purple-800 disabled:cursor-not-allowed transition-colors duration-300 flex items-center justify-center w-full sm:w-auto"
                  aria-label="Save transcript and translation"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Save Results
                </button>
              )}
            </div>
          </div>

          {error && <ErrorMessage message={error} />}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <TranscriptPanel
              title="2. Generated Transcript (English)"
              transcript={transcript}
              isLoading={isLoading}
              placeholder="Your generated transcript with timestamps will appear here."
            />
            <TranscriptPanel
              title={translation ? `3. Translation (${selectedLanguage === 'Malayalam' ? 'Manglish' : selectedLanguage})` : "3. Translation"}
              transcript={translation}
              isLoading={isTranslating}
              placeholder="Your translation will appear here after the transcript is generated."
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;