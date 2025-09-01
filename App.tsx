import React, { useState, useCallback } from 'react';
import { jsPDF } from 'jspdf';
import { generateTranscriptFromAudio, translateTranscript } from './services/geminiService';
import { NotoSansTamilBase64 } from './services/noto-sans-tamil-font';
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
  { id: 'Tamil (Tanglish)', name: 'Tamil (Tanglish)' },
  { id: 'Tamil (Script)', name: 'Tamil (Script)' },
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
    if (!translation || !audioFile) {
      return;
    }
     // Create filename from uploaded audio file
    const originalFileName = audioFile.name;
    const baseName = originalFileName.substring(0, originalFileName.lastIndexOf('.')) || originalFileName;
    
    const doc = new jsPDF();
    const fileName = `${baseName}_translation.pdf`;

    // --- Font Setup ---
    const isTamilScript = selectedLanguage === 'Tamil (Script)';
    if (isTamilScript) {
      // Embed the Noto Sans Tamil font to correctly render Tamil characters in the PDF.
      doc.addFileToVFS('NotoSansTamil-Regular.ttf', NotoSansTamilBase64);
      doc.addFont('NotoSansTamil-Regular.ttf', 'NotoSansTamil', 'normal');
      doc.addFont('NotoSansTamil-Regular.ttf', 'NotoSansTamil', 'bold'); // Register same font for bold style
    }
    
    const setDocFont = (style: 'normal' | 'bold' = 'normal') => {
        const fontName = isTamilScript ? 'NotoSansTamil' : 'helvetica';
        doc.setFont(fontName, style);
    };
    
    // --- PDF Content ---
    const fullText = translation.map(item => `[${item.timestamp}] ${item.text}`).join('\n');
    const title = getTranslationTitle();

    // PDF layout variables
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let y = margin;
    const lineHeight = 7;

    // Add title
    setDocFont('bold');
    doc.setFontSize(16);
    doc.text(title, margin, y);
    y += 15; // Space after title

    // Add content
    setDocFont('normal');
    doc.setFontSize(10);
    
    const splitText = doc.splitTextToSize(fullText, pageWidth - margin * 2);

    splitText.forEach((line: string) => {
        if (y + lineHeight > pageHeight - margin) { // Check if next line fits
            doc.addPage();
            y = margin;
            // Re-set font on new page
            setDocFont('normal');
            doc.setFontSize(10);
        }
        doc.text(line, margin, y);
        y += lineHeight;
    });

    doc.save(fileName);
  }, [translation, audioFile, selectedLanguage]);

  const getTranslationTitle = () => {
    if (selectedLanguage === 'Malayalam') return 'Translation (Manglish)';
    if (selectedLanguage === 'Tamil (Tanglish)') return 'Translation (Tanglish)';
    if (selectedLanguage === 'Tamil (Script)') return 'Translation (Tamil Script)';
    return `Translation (${selectedLanguage})`;
  }

  return (
    <div className="bg-gray-900 min-h-screen text-white font-sans flex flex-col items-center p-4">
      <div className="w-full max-w-6xl mx-auto">
        <Header />
        <main className="mt-8">
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl shadow-2xl p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <AudioUploader onFileSelect={setAudioFile} disabled={isLoading || isTranslating} />
              <div className="flex flex-col space-y-4">
                 <div className="w-full">
                  <label htmlFor="language-select" className="block mb-2 text-sm font-medium text-gray-300">
                    Translate to:
                  </label>
                  <select
                    id="language-select"
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    disabled={isLoading || isTranslating}
                    className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5"
                    aria-label="Select translation language"
                  >
                    {LANGUAGES.map((lang) => (
                      <option key={lang.id} value={lang.id}>{lang.name}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleProcessAudio}
                  disabled={!audioFile || isLoading || isTranslating}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-900/50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 flex items-center justify-center"
                  aria-busy={isLoading || isTranslating}
                >
                  {isLoading ? 'Transcribing...' : isTranslating ? 'Translating...' : 'Generate Translation'}
                </button>
              </div>
            </div>
             {error && <ErrorMessage message={error} />}
          </div>

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <TranscriptPanel 
              title="Original Transcript"
              transcript={transcript}
              isLoading={isLoading}
              placeholder="Transcript will appear here."
            />
            <TranscriptPanel 
              title={getTranslationTitle()}
              transcript={translation}
              isLoading={isTranslating}
              placeholder="Translation will appear here."
            />
          </div>

          {(transcript || translation) && (
            <div className="mt-8 text-center">
               <button
                onClick={handleSave}
                disabled={!translation}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-900/50 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300"
              >
                Save Translation
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;