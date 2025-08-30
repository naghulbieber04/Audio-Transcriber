import React, { useState, useCallback } from 'react';

interface AudioUploaderProps {
  onFileSelect: (file: File | null) => void;
  disabled: boolean;
}

const AudioUploader: React.FC<AudioUploaderProps> = ({ onFileSelect, disabled }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (files: FileList | null) => {
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('audio/')) {
        setSelectedFile(file);
        onFileSelect(file);
      } else {
        // Optionally, handle non-audio files here, e.g., show an error.
        alert("Please select a valid audio file.");
      }
    }
  };

  // Fix: Corrected the event type to HTMLLabelElement for onDragOver event handler.
  const onDragOver = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  // Fix: Corrected the event type to HTMLLabelElement for onDragLeave event handler.
  const onDragLeave = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  // Fix: Corrected the event type to HTMLLabelElement for onDrop event handler.
  const onDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (!disabled) {
      handleFileChange(e.dataTransfer.files);
    }
  }, [disabled]);

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileChange(e.target.files);
    // Reset the input value to allow selecting the same file again
    e.target.value = '';
  };
  
  const clearFile = () => {
    setSelectedFile(null);
    onFileSelect(null);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <label
        htmlFor="audio-upload"
        className={`relative flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-300
        ${disabled ? 'bg-gray-800/50 border-gray-700 cursor-not-allowed' :
        isDragging ? 'bg-indigo-900/40 border-indigo-500' : 'bg-gray-800/60 border-gray-600 hover:bg-gray-800/80 hover:border-gray-500'}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        aria-disabled={disabled}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
          </svg>
          <p className="mb-2 text-sm text-gray-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
          <p className="text-xs text-gray-500">MP3, WAV, M4A, etc.</p>
        </div>
        <input id="audio-upload" type="file" className="hidden" onChange={onFileInputChange} accept="audio/*" disabled={disabled} />
      </label>
      {selectedFile && (
        <div className="mt-4 w-full bg-gray-800 p-3 rounded-lg flex justify-between items-center text-sm">
          <p className="text-gray-300 truncate" aria-label="Selected file name">{selectedFile.name}</p>
          <button onClick={clearFile} disabled={disabled} className="text-gray-400 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed" aria-label="Clear selected file">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default AudioUploader;
