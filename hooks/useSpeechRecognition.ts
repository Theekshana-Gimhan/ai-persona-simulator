import { useState, useEffect, useRef, useCallback } from 'react';

// Type definitions for Web Speech API to fix TypeScript errors
interface SpeechRecognitionResult {
    isFinal: boolean;
    [key: number]: SpeechRecognitionAlternative;
    length: number;
}
interface SpeechRecognitionAlternative {
    transcript: string;
}
interface SpeechRecognitionResultList {
    [key: number]: SpeechRecognitionResult;
    length: number;
}
interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
    resultIndex: number;
}
interface SpeechRecognitionErrorEvent extends Event {
    error: string;
}
interface SpeechRecognition {
    continuous: boolean;
    lang: string;
    interimResults: boolean;
    onresult: (event: SpeechRecognitionEvent) => void;
    onerror: (event: SpeechRecognitionErrorEvent) => void;
    onend: () => void;
    start: () => void;
    stop: () => void;
}

declare global {
    interface Window {
        SpeechRecognition: new () => SpeechRecognition;
        webkitSpeechRecognition: new () => SpeechRecognition;
    }
}


// Polyfill for browsers that support `webkitSpeechRecognition`
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

interface SpeechRecognitionOptions {
  onTranscriptReady: (transcript: string) => void;
  country: string;
}

export const useSpeechRecognition = ({ onTranscriptReady, country }: SpeechRecognitionOptions) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const transcriptRef = useRef('');

  useEffect(() => {
    if (!SpeechRecognition) {
      console.error("SpeechRecognition API not supported in this browser.");
      return;
    }
    
    const langCodeMap: { [key: string]: string } = {
        'United States': 'en-US',
        'United Kingdom': 'en-GB',
        'Canada': 'en-CA',
        'Australia': 'en-AU',
        'India': 'en-IN',
        'South Africa': 'en-ZA',
        'Sri Lanka': 'si-LK',
    };
    const langCode = langCodeMap[country] || 'en-US';

    const recognition: SpeechRecognition = new SpeechRecognition();
    recognition.continuous = true; // Listen through pauses
    recognition.lang = langCode;
    recognition.interimResults = false; // Only process final results for simplicity

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      // Build the full transcript from all final results
      const fullTranscript = Array.from(event.results)
        .map(result => result[0]) // Get the most confident alternative
        .map(alternative => alternative.transcript)
        .join(' ');
      transcriptRef.current = fullTranscript;
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      // When recognition ends (e.g., via stop()), pass the final accumulated transcript.
      if (onTranscriptReady) {
        onTranscriptReady(transcriptRef.current);
      }
    };
    
    recognitionRef.current = recognition;
    
    return () => {
        if(recognitionRef.current) {
            recognitionRef.current.stop();
        }
    }
  }, [onTranscriptReady, country]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      transcriptRef.current = ''; // Reset transcript for a new recording
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
          console.error("Error starting speech recognition:", error);
          setIsListening(false);
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      // stop() is asynchronous, it will trigger the onend event.
      recognitionRef.current.stop();
      // Set listening to false immediately for UI responsiveness
      setIsListening(false);
    }
  }, [isListening]);

  return {
    isListening,
    startListening,
    stopListening,
    isSupported: !!SpeechRecognition,
  };
};