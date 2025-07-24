
import { useState, useCallback, useEffect, useRef } from 'react';

export const useSpeechSynthesis = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingProgress, setSpeakingProgress] = useState(0);
  const synthRef = useRef(window.speechSynthesis);

  const speak = useCallback((text: string, voiceURI: string | null, rate: number, onEnd: () => void) => {
    if (!synthRef.current || !text) return;
    if (synthRef.current.speaking) {
      synthRef.current.cancel();
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    
    utterance.onstart = () => {
      setIsSpeaking(true);
      setSpeakingProgress(0);
    };

    utterance.onboundary = (event: SpeechSynthesisEvent) => {
      if (text.length > 0) {
        const progress = ((event.charIndex + event.charLength) / text.length) * 100;
        setSpeakingProgress(progress);
      }
    };
    
    utterance.onend = () => {
      setIsSpeaking(false);
      // Ensure the bar fills completely before resetting
      setSpeakingProgress(100);
      setTimeout(() => setSpeakingProgress(0), 500);
      onEnd();
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error', event);
      setIsSpeaking(false);
      setSpeakingProgress(0);
    };
    
    const voices = synthRef.current.getVoices();
    let selectedVoice: SpeechSynthesisVoice | undefined;

    if (voiceURI) {
        selectedVoice = voices.find(voice => voice.voiceURI === voiceURI);
    }

    if (!selectedVoice) {
        // Fallback to existing logic if no voice is selected or found
        let femaleVoice = voices.find(voice => voice.name.includes('Google US English') && (voice as any).gender === 'female');
        if (!femaleVoice) {
          femaleVoice = voices.find(voice => voice.lang === 'en-US' && voice.name.includes('Female'));
        }
        if (femaleVoice) {
            selectedVoice = femaleVoice;
        }
    }

    if (selectedVoice) {
        utterance.voice = selectedVoice;
    }
    
    synthRef.current.speak(utterance);
  }, []);
  
  // Ensure voices are loaded and cleanup on unmount
  useEffect(() => {
    const synth = synthRef.current;
    const handleVoicesChanged = () => {
      // Dummy handler to ensure voices are loaded on some browsers
    };

    if (synth) {
      synth.addEventListener('voiceschanged', handleVoicesChanged);
    }
    
    return () => {
      if (synth) {
        synth.removeEventListener('voiceschanged', handleVoicesChanged);
        if (synth.speaking) {
          synth.cancel(); // Stop any speech on component unmount
        }
      }
    };
  }, []);

  return { isSpeaking, speak, speakingProgress, isSupported: !!window.speechSynthesis };
};
