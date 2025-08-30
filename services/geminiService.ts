
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
        description: "Timestamp in MM:SS.mmm format."
      },
      text: {
        type: Type.STRING,
        description: "The transcribed text for this timestamp."
      },
    },
    required: ["timestamp", "text"],
  },
};

export const generateTranscriptFromText = async (rawText: string): Promise<TranscriptItem[]> => {
  try {
    const prompt = `
      You are an expert audio transcriber. Your task is to take a block of text and format it into a detailed transcript with plausible timestamps.
      Process the following text and convert it into a transcript format.
      - Assign timestamps in the [MM:SS.mmm] format, starting from 00:00.000.
      - Distribute the timestamps logically, assuming a natural speaking pace where each sentence or clause takes a few seconds.
      - Break down long sentences into smaller, timestamped segments.
      - Ensure the output is a valid JSON array matching the provided schema.

      Here is the text:
      ---
      ${rawText}
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
    console.error("Error generating transcript:", error);
    throw new Error("Failed to generate transcript. The model may have returned an invalid format. Please check the console for details.");
  }
};

export const translateTranscript = async (transcript: TranscriptItem[], language: string): Promise<TranscriptItem[]> => {
  try {
    const transcriptString = transcript.map(item => `[${item.timestamp}] ${item.text}`).join('\n');

    const prompt = `
      You are an expert multilingual translator specializing in conversational, code-mixed languages.
      Translate the following transcript into ${language}.
      - Preserve the timestamps exactly as they are in the output.
      - The translation should be natural and conversational.
      - For 'Hinglish', mix Hindi (using Latin script) and English.
      - For 'Manglish', mix Malayalam (using Latin script) and English.
      - For 'Conversational Tamil', use informal, spoken Tamil (using Latin script).
      - Ensure the output is a valid JSON array matching the provided schema.

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
