
import { useState, useEffect } from 'react';

// A hook to safely get the list of speech synthesis voices
export const useVoices = () => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    const getAndSetVoices = () => {
      if (typeof window.speechSynthesis === 'undefined') {
        return;
      }
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
        // Filter for English voices, as they are most relevant for this app.
        const englishVoices = availableVoices.filter(v => v.lang.startsWith('en'));
        setVoices(englishVoices);
      }
    };

    // Voices are loaded asynchronously. The 'voiceschanged' event is fired when they are ready.
    if (typeof window.speechSynthesis !== 'undefined') {
        window.speechSynthesis.addEventListener('voiceschanged', getAndSetVoices);
    }
    
    getAndSetVoices(); // Initial attempt to get voices, in case they are already loaded.

    return () => {
      if (typeof window.speechSynthesis !== 'undefined') {
        window.speechSynthesis.removeEventListener('voiceschanged', getAndSetVoices);
      }
    };
  }, []);

  return voices;
};
