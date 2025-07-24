import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Persona, ChatMessage } from '../types';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { getCallHint, ai } from '../services/geminiService';
import { MicIcon } from './icons/MicIcon';
import { EndCallIcon } from './icons/EndCallIcon';
import { PhoneIcon } from './icons/PhoneIcon';
import { LightbulbIcon } from './icons/LightbulbIcon';
import { ClockIcon } from './icons/ClockIcon';
import ProgressBar from './ProgressBar';

interface CallViewProps {
  persona: Persona;
  trainingScenario?: string;
  onStartCall: () => void;
  onEndCall: (transcript: ChatMessage[]) => void;
  isCallActiveProp?: boolean;
  voiceURI: string | null;
  speechRate: number;
  initialTranscript?: ChatMessage[];
  country: string;
  callTimeLimit: number; // in seconds, 0 for no limit
}



const PersonaCard: React.FC<{ persona: Persona }> = ({ persona }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 shadow-lg">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-cyan-400">AI Persona</h2>
        <button
          onClick={() => setIsVisible(!isVisible)}
          className="px-4 py-2 text-sm font-semibold bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          aria-expanded={isVisible}
          aria-controls="persona-details-content"
        >
          {isVisible ? 'Hide Details' : 'Show Details'}
        </button>
      </div>
      <div
        id="persona-details-content"
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isVisible ? 'max-h-[500px] mt-4 pt-4 border-t border-slate-700' : 'max-h-0'
        }`}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-300">
          <div><strong>Name:</strong> {persona.name}</div>
          <div><strong>Age:</strong> {persona.age}</div>
          <div><strong>Topic of Interest:</strong> {persona.topicOfInterest}</div>
          <div><strong>Personality:</strong> {persona.personality}</div>
          <div className="md:col-span-2"><strong>Background:</strong> {persona.background}</div>
          <div className="md:col-span-2"><strong>Interests/Goals:</strong> {persona.interests}</div>
          <div className="md:col-span-2">
            <strong>Key Concerns:</strong>
            <ul className="list-disc list-inside mt-1">
              {persona.concerns.map((concern, i) => <li key={i}>{concern}</li>)}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};


const Transcript: React.FC<{ transcript: ChatMessage[] }> = ({ transcript }) => {
    const endOfTranscriptRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endOfTranscriptRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcript]);
    
    return (
        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 h-64 overflow-y-auto space-y-4">
            {transcript.map((msg, index) => (
                <div key={index} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`text-sm font-bold mb-1 ${msg.sender === 'user' ? 'text-cyan-400' : 'text-fuchsia-400'}`}>
                        {msg.sender === 'user' ? 'You' : 'AI Persona'}
                    </div>
                    <div className={`px-4 py-2 rounded-lg max-w-md ${msg.sender === 'user' ? 'bg-cyan-900/70 text-cyan-100' : 'bg-fuchsia-900/70 text-fuchsia-100'}`}>
                        {msg.text}
                    </div>
                </div>
            ))}
            <div ref={endOfTranscriptRef} />
        </div>
    );
};

type Status = 'idle' | 'ai_speaking' | 'user_prompt_to_record' | 'user_listening' | 'user_reviewing' | 'processing' | 'transcribing' | 'ending';

const CallView: React.FC<CallViewProps> = ({ persona, trainingScenario, onStartCall, onEndCall, isCallActiveProp = false, voiceURI, speechRate, initialTranscript = [], country, callTimeLimit }) => {
  const [isCallActive, setIsCallActive] = useState(isCallActiveProp);
  const [transcript, setTranscript] = useState<ChatMessage[]>(initialTranscript);
  const [status, setStatus] = useState<Status>('idle');
  const [currentUserInput, setCurrentUserInput] = useState('');
  const [hint, setHint] = useState<string | null>(null);
  const [isHintLoading, setIsHintLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // @ts-ignore: Chat type is provided by the Gemini SDK at runtime
  const chatRef = useRef<any>(null);
  const isInitialized = useRef(false);
  const { speak, speakingProgress } = useSpeechSynthesis();

  // Refs to give callbacks stable access to the latest state/props
  const statusRef = useRef(status);
  useEffect(() => { statusRef.current = status; }, [status]);

  const transcriptForCallbackRef = useRef(transcript);
  useEffect(() => { transcriptForCallbackRef.current = transcript; }, [transcript]);

  const onEndCallRef = useRef(onEndCall);
  useEffect(() => { onEndCallRef.current = onEndCall; }, [onEndCall]);


  const sendUserMessageToAI = useCallback(async (userText: string) => {
    if (!userText || !chatRef.current) return;

    setTranscript(prev => [...prev, { sender: 'user', text: userText }]);
    setStatus('processing');
    setCurrentUserInput('');

    try {
      const response = await chatRef.current.sendMessageStream({ message: userText });
      let aiResponseText = '';
      for await (const chunk of response) {
        aiResponseText += chunk.text;
      }
      setTranscript(prev => [...prev, { sender: 'ai', text: aiResponseText }]);
      setStatus('ai_speaking');
      speak(aiResponseText, voiceURI, speechRate, () => {
        setStatus('user_prompt_to_record');
      });
    } catch (error) {
        console.error("Error sending message to Gemini:", error);
        setStatus('user_prompt_to_record');
    }
  }, [speak, voiceURI, speechRate]);

  const handleSubmit = () => {
    if (currentUserInput.trim()) {
      setHint(null);
      sendUserMessageToAI(currentUserInput);
    }
  };

  const handleTranscriptReady = useCallback((text: string) => {
    if (statusRef.current === 'ending') {
        const finalTranscript = text ? [...transcriptForCallbackRef.current, { sender: 'user' as const, text }] : transcriptForCallbackRef.current;
        onEndCallRef.current(finalTranscript);
        return;
    }
    
    setCurrentUserInput(text); // Always update the input, even if it's an empty string.
    setStatus('user_reviewing');
  }, []); // Empty dependencies make this callback stable


  const { isListening, startListening, stopListening, isSupported } = useSpeechRecognition({
    onTranscriptReady: handleTranscriptReady,
    country: country
  });

  const handleEndCallClick = useCallback(() => {
    if (isListening) {
        setStatus('ending');
        stopListening();
    } else {
        onEndCall(transcript);
    }
  }, [isListening, stopListening, onEndCall, transcript]);
  
  const initializeCallSession = useCallback(async () => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    onStartCall();
    setIsCallActive(true);
    if (callTimeLimit > 0) {
      setTimeLeft(callTimeLimit);
    }
    setStatus('processing');

    const history = initialTranscript.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));
    
    const scenarioInstruction = (trainingScenario && trainingScenario.trim())
        ? `\n\nThe context for this conversation is: "${trainingScenario}"`
        : '';

    chatRef.current = ai.chats.create({
      model: 'gemini-2.5-flash',
      history: history,
      config: {
        systemInstruction: `You are an AI acting as a specific persona for a mock call.
        Your persona details are:
        Name: ${persona.name}
        Age: ${persona.age}
        Background: ${persona.background}
        Interests/Goals: ${persona.interests}
        Topic of Interest: ${persona.topicOfInterest}
        Concerns: ${persona.concerns.join(', ')}
        Personality: ${persona.personality}

        Your goal is to have a natural conversation based on this persona within the given scenario. Do not break character. Keep your responses concise and realistic for the role you are playing.${scenarioInstruction}`,
      }
    });
    
    if (history.length > 0) {
      // This is a follow-up call.
      const followUpMessage = `Hello again. I had a few more questions.`;
      const aiMessage: ChatMessage = { sender: 'ai', text: followUpMessage };
      setTranscript(prev => [...prev, aiMessage]);
      setStatus('ai_speaking');
      speak(followUpMessage, voiceURI, speechRate, () => {
        setStatus('user_prompt_to_record');
      });
    } else {
      // This is a fresh call.
      try {
        const response = await chatRef.current.sendMessageStream({ message: "Hello, please introduce yourself based on your persona." });
        let aiResponseText = '';
        for await (const chunk of response) {
          aiResponseText += chunk.text;
        }

        setTranscript([{ sender: 'ai', text: aiResponseText }]);
        setStatus('ai_speaking');
        speak(aiResponseText, voiceURI, speechRate, () => {
            setStatus('user_prompt_to_record');
        });
      } catch (error) {
          console.error("Failed to start conversation:", error);
          setStatus('idle');
      }
    }
  }, [initialTranscript, onStartCall, persona, trainingScenario, speak, speechRate, voiceURI, callTimeLimit]);

  useEffect(() => {
    if (isCallActiveProp) {
        initializeCallSession();
    }
  }, [isCallActiveProp, initializeCallSession]);

  useEffect(() => {
    if (!isCallActive || timeLeft === null) return;
  
    if (timeLeft <= 0) {
      handleEndCallClick();
      return;
    }
  
    const timerId = setInterval(() => {
      setTimeLeft(prevTime => (prevTime ? prevTime - 1 : 0));
    }, 1000);
  
    return () => clearInterval(timerId);
  }, [isCallActive, timeLeft, handleEndCallClick]);


  const handleRecordClick = () => {
    setHint(null);
    setCurrentUserInput('');
    setStatus('user_listening');
    startListening();
  };

  const handleStopRecordingClick = () => {
    setStatus('transcribing');
    stopListening();
  };
  
  const handleRerecordClick = () => {
    handleRecordClick();
  };
  
  const handleGetHint = useCallback(async () => {
    setIsHintLoading(true);
    setHint(null);
    try {
        const newHint = await getCallHint(transcript, trainingScenario || '', country);
        setHint(newHint);
    } catch (err) {
        console.error("Failed to get hint:", err);
        setHint("Sorry, the coach is busy. Please try again in a moment.");
    } finally {
        setIsHintLoading(false);
    }
  }, [transcript, trainingScenario, country]);

  const formatTime = (seconds: number): string => {
    if (seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };
  
  const getStatusText = () => {
    switch(status) {
        case 'ai_speaking': return 'AI is speaking...';
        case 'user_listening': return 'Recording... Click "Stop" when finished.';
        case 'processing': return 'AI is thinking...';
        case 'transcribing': return 'Processing audio...';
        case 'ending': return 'Finalizing call...';
        case 'user_prompt_to_record': return 'Your turn to speak.';
        case 'user_reviewing': return currentUserInput ? 'Review your response below.' : 'No speech detected.';
        case 'idle': return 'Call has not started.';
        default: return '';
    }
  };

  if (!isCallActive) {
    return (
      <div className="space-y-6">
        <PersonaCard persona={persona} />
        {!isSupported && <p className="text-center text-red-400">Your browser does not support the required Speech APIs. Please use a modern browser like Chrome.</p>}
        <div className="text-center">
          <button
            onClick={initializeCallSession}
            disabled={!isSupported}
            className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-green-500 hover:bg-green-600 text-slate-900 font-bold rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-green-500/50 disabled:bg-slate-600 disabled:cursor-not-allowed"
          >
            <PhoneIcon className="w-6 h-6" />
            <span>Start Call</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PersonaCard persona={persona} />
      <Transcript transcript={transcript} />
      
      {status === 'user_reviewing' && (
        <div className="bg-slate-800/50 p-4 rounded-xl border border-cyan-700/50 min-h-[80px]">
          <p className="text-sm font-bold mb-2 text-cyan-400">Your Response</p>
          <p className="text-slate-200">{currentUserInput || <span className="italic text-slate-500">No speech detected. Please try again.</span>}</p>
        </div>
      )}
      
      <div className={`transition-all duration-300 ease-out ${hint ? 'opacity-100' : 'opacity-0 h-0'}`}>
        {hint && (
            <div className="relative bg-slate-800/80 backdrop-blur-sm p-4 rounded-xl border border-yellow-500/50 mb-4">
                <button onClick={() => setHint(null)} className="absolute top-2 right-2 text-slate-400 hover:text-white font-bold text-xl leading-none">&times;</button>
                <div className="flex items-center gap-2">
                  <LightbulbIcon className="w-5 h-5 text-yellow-400 flex-shrink-0"/>
                  <p className="text-sm font-bold text-yellow-400">Coach's Tip</p>
                </div>
                <p className="text-slate-200 italic mt-2 ml-1">"{hint}"</p>
            </div>
        )}
      </div>

      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 space-y-3">
        <div className="flex items-center justify-between min-h-[40px]">
          <div className="flex items-center gap-3">
            {(status === 'processing' || status === 'transcribing' || status === 'ending') ? (
                <div className="w-6 h-6 border-4 border-t-cyan-400 border-r-slate-600 border-b-slate-600 border-l-slate-600 rounded-full animate-spin"></div>
            ) : (
                <MicIcon className={`w-6 h-6 ${isListening ? 'text-red-500 animate-pulse' : 'text-slate-400'}`} />
            )}
            <span className="text-slate-300 font-medium">{getStatusText()}</span>
          </div>
          
          <div className="flex items-center gap-3">
              {timeLeft !== null && (
                <>
                    <div className="flex items-center gap-2 text-yellow-400">
                        <ClockIcon className="w-5 h-5" />
                        <span className="text-lg font-mono font-bold">
                            {formatTime(timeLeft)}
                        </span>
                    </div>
                    <div className="border-l border-slate-600 h-8 mx-1"></div>
                </>
              )}

              {status === 'user_prompt_to_record' && (
                  <button onClick={handleRecordClick} className="group inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-green-500 hover:bg-green-600 text-slate-900 font-bold rounded-full transition-all duration-300 transform hover:scale-105">
                      <MicIcon className="w-5 h-5" />
                      <span>Record</span>
                  </button>
              )}

              {status === 'user_listening' && (
                  <button onClick={handleStopRecordingClick} className="group inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold rounded-full transition-all duration-300 transform hover:scale-105">
                      <span>Stop Recording</span>
                  </button>
              )}
              
              {status === 'user_reviewing' && (
                  <>
                      <button onClick={handleRerecordClick} className="group inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-600 hover:bg-slate-700 text-white font-semibold rounded-full transition-all duration-300">
                          <MicIcon className="w-5 h-5" />
                          <span>{currentUserInput ? 'Re-record' : 'Try Again'}</span>
                      </button>
                      <button onClick={handleSubmit} disabled={!currentUserInput.trim()} className="group inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-slate-900 font-bold rounded-full transition-all duration-300 transform hover:scale-105 disabled:bg-slate-600 disabled:cursor-not-allowed disabled:hover:scale-100">
                          <span>Submit</span>
                      </button>
                  </>
              )}
              
              {(status === 'user_prompt_to_record' || status === 'user_reviewing') && (
                <>
                  <div className="border-l border-slate-600 h-8 mx-1"></div>
                  <button
                    onClick={handleGetHint}
                    disabled={isHintLoading}
                    className="group inline-flex items-center justify-center gap-2 px-4 py-2 bg-yellow-600/30 hover:bg-yellow-600/50 text-yellow-200 font-semibold rounded-full transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-wait"
                    title="Get a hint from the AI Coach"
                  >
                    {isHintLoading ? (
                        <div className="w-5 h-5 border-2 border-t-yellow-200 border-r-yellow-200 border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                    ) : (
                        <LightbulbIcon className="w-5 h-5" />
                    )}
                    <span className="hidden sm:inline">Coach</span>
                  </button>
                </>
              )}

              <button 
                onClick={handleEndCallClick} 
                disabled={['processing', 'transcribing', 'ending', 'ai_speaking'].includes(status)}
                className="group inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full transition-all duration-300 transform hover:scale-105 disabled:bg-slate-600 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                  <EndCallIcon className="w-5 h-5" />
                  <span className="hidden sm:inline">End Call</span>
              </button>
          </div>
        </div>
        {status === 'ai_speaking' && <ProgressBar progress={speakingProgress} />}
      </div>
    </div>
  );
};

export default CallView;