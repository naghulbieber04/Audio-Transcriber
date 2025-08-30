import { GoogleGenAI, Type } from "@google/genai";
import type { TranscriptItem } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const transcriptSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      timestamp: {
        type: Type.STRING,
        description: "Timestamp range for the speech segment, strictly in MM:SS-MM:SS format, indicating start and end times."
      },
      text: {
        type: Type.STRING,
        description: "The transcribed text for this timestamp."
      },
    },
    required: ["timestamp", "text"],
  },
};

// Helper function to convert a File to a base64 string and format it for the Gemini API
const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });

  const base64EncodedData = await base64EncodedDataPromise;

  return {
    inlineData: {
      data: base64EncodedData,
      mimeType: file.type,
    },
  };
};

export const generateTranscriptFromAudio = async (audioFile: File): Promise<TranscriptItem[]> => {
  try {
    const audioPart = await fileToGenerativePart(audioFile);

    const prompt = `
      You are an expert audio transcriber. Your task is to transcribe the provided audio file with accurate timestamps for each sentence.

      Instructions:
      1. Listen to the audio and identify complete sentences or distinct speech segments.
      2. For each segment, determine its start and end time in the audio.
      3. Create a timestamp range, formatted strictly as MM:SS-MM:SS (start_minutes:start_seconds-end_minutes:end_seconds).
      4. The output must be a valid JSON array of objects, where each object contains a "timestamp" and "text" key.

      Example of the desired output format:
      \`\`\`json
      [
        {
          "timestamp": "00:02-00:05",
          "text": "Hello and welcome to our podcast."
        },
        {
          "timestamp": "00:06-00:11",
          "text": "Today we'll be discussing the latest advancements in AI."
        }
      ]
      \`\`\`

      Now, please transcribe the audio file provided and follow these instructions precisely.
    `;
    
    const textPart = { text: prompt };

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts: [textPart, audioPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: transcriptSchema,
      },
    });
    
    const jsonString = response.text;
    const parsedJson = JSON.parse(jsonString);
    return parsedJson as TranscriptItem[];

  } catch (error) {
    console.error("Error generating transcript:", error);
    throw new Error("Failed to generate transcript from audio. The model may have returned an invalid format or the audio could not be processed. Please check the console for details.");
  }
};


export const translateTranscript = async (transcript: TranscriptItem[], language: string): Promise<TranscriptItem[]> => {
  try {
    // Format the transcript without extra brackets for clarity.
    const transcriptString = transcript.map(item => `${item.timestamp} ${item.text}`).join('\n');
    
    let targetLanguageInstruction = language;
    let specialInstructions = '';
    let exampleOutput = '';

    if (language === 'Malayalam') {
      targetLanguageInstruction = 'Manglish (Malayalam written phonetically using English letters)';
      exampleOutput = `[
        {
          "timestamp": "00:02-00:05",
          "text": "Hello, swagatham."
        },
        {
          "timestamp": "00:06-00:10",
          "text": "Nammal AI-ine kurichu charcha cheyyum."
        }
      ]`;
    } else if (language === 'Tamil (Tanglish)') {
      targetLanguageInstruction = 'Tanglish (conversational Tamil written phonetically using English letters)';
      specialInstructions = `
      IMPORTANT TANGLISH TRANSLATION RULE:
      - Translate into a natural, conversational style.
      - The output text must be written phonetically using English letters (Tanglish).
      - Do NOT translate common technical English words (e.g., AI, podcast, software, database). Keep them in English.`;
      exampleOutput = `[
        {
          "timestamp": "00:02-00:05",
          "text": "Vanakkam matrum varaverkirom."
        },
        {
          "timestamp": "00:06-00:10",
          "text": "Naam AI patri vivaathippom."
        }
      ]`;
    } else if (language === 'Tamil (Script)') {
      targetLanguageInstruction = 'Tamil language using the Tamil script';
       specialInstructions = `
      IMPORTANT TRANSLATION RULE:
      - Translate into a natural, conversational Tamil.
      - The output text MUST be in the Tamil script.`;
      exampleOutput = `[
        {
          "timestamp": "00:02-00:05",
          "text": "வணக்கம் மற்றும் வரவேற்கிறோம்."
        },
        {
          "timestamp": "00:06-00:10",
          "text": "நாம் AI பற்றி விவாதிப்போம்."
        }
      ]`;
    } else { // Generic example for other languages like Spanish
      exampleOutput = `[
        {
          "timestamp": "00:02-00:05",
          "text": "Hola y bienvenido."
        },
        {
          "timestamp": "00:06-00:10",
          "text": "Discutiremos la IA."
        }
      ]`;
    }

    const prompt = `
      You are an expert multilingual translator. Your task is to translate the provided transcript into ${targetLanguageInstruction}.

      Instructions:
      1. Translate the text portion of each line into natural and fluent ${targetLanguageInstruction}.
      2. The original transcript has timestamp ranges in MM:SS-MM:SS format. You MUST preserve these timestamps exactly as they are in your translated output. Do not change them.
      3. The output must be a valid JSON array of objects, where each object contains the original "timestamp" and the translated "text".
      ${specialInstructions}

      Example of an input transcript and the desired output format:
      Input:
      ---
      00:02-00:05 Hello and welcome.
      00:06-00:10 We will discuss AI.
      ---
      
      Desired JSON Output (for ${language}):
      \`\`\`json
      ${exampleOutput.trim()}
      \`\`\`

      Now, translate the following transcript into ${targetLanguageInstruction}, preserving the timestamps and adhering to all instructions and the JSON schema.

      Original Transcript:
      ---
      ${transcriptString}
      ---
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: transcriptSchema,
      },
    });

    const jsonString = response.text;
    const parsedJson = JSON.parse(jsonString);
    return parsedJson as TranscriptItem[];

  } catch (error) {
    console.error(`Error translating to ${language}:`, error);
    throw new Error(`Failed to translate to ${language}. The model may have returned an invalid format. Please check the console for details.`);
  }
};