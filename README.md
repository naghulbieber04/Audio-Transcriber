# AI Audio Transcript Translator

This application generates a timestamped transcript from an audio file and translates it into various languages, including conversational variants. It provides a simple and efficient way to get multilingual transcripts for your audio content.

## Live Preview

[![Open Live Preview](https://img.shields.io/badge/Live%20Preview-Open-blue?style=for-the-badge)](https://ai.studio/apps/drive/17m_mHYt9oz04c747aXLoWjEGprtvkReV)

## Features

-   **Audio Transcription**: Upload an audio file (MP3, WAV, M4A, etc.) and get an accurate, timestamped transcript.
-   **Multi-language Translation**: Translate the transcript into a wide range of languages.
-   **Conversational Language Support**: Includes support for informal, mixed languages like Hinglish (Hindi-English), Manglish (Malayalam-English), and Tanglish (Tamil-English).
-   **Side-by-Side View**: Easily compare the original transcript with the translated version.
-   **Drag & Drop Interface**: A user-friendly interface for uploading files.
-   **Export a Copy**: Save the translated transcript as a PDF for offline use and sharing.

## How to Use

1.  **Upload Audio**: Drag and drop your audio file onto the upload area, or click to select a file from your computer.
2.  **Select Language**: Choose your target language for translation from the dropdown menu.
3.  **Generate**: Click the "Generate Translation" button to start the process.
4.  **Review**: The app will first generate the original transcript and then the translation. Both will be displayed in their respective panels.
5.  **Save**: Once the translation is complete, click the "Save Translation" button to download the result.

## Tech Stack

-   **Frontend**: React, TypeScript
-   **Styling**: Tailwind CSS
-   **AI Services**: Google Gemini API (`@google/genai`)
-   **PDF Generation**: jsPDF

## Running the Project

This project is set up to run in a sandboxed environment where the API key is provided as an environment variable (`process.env.API_KEY`). No local setup is required to use the deployed application.