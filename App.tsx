import React, { useState, useCallback } from 'react';
import { AppState, Persona, EvaluationReport, ChatMessage, Difficulty } from './types';
import { generatePersona, evaluateCall } from './services/geminiService';
import WelcomeScreen from './components/WelcomeScreen';
import SettingsScreen from './components/SettingsScreen';
import CallView from './components/CallView';
import ReportView from './components/ReportView';
import LoadingIndicator from './components/LoadingIndicator';
import TabNavigator from './components/TabNavigator';
import { useVoices } from './hooks/useVoices';

type Tab = 'simulation' | 'settings';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [activeTab, setActiveTab] = useState<Tab>('simulation');
  const [persona, setPersona] = useState<Persona | null>(null);
  const [report, setReport] = useState<EvaluationReport | null>(null);
  const [transcript, setTranscript] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Settings state
  const voices = useVoices();
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>('');
  const [speechRate, setSpeechRate] = useState<number>(1);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.MEDIUM);
  const [trainingScenario, setTrainingScenario] = useState<string>('A mock call between a real estate agent and a first-time home buyer.');
  const [personaDirectives, setPersonaDirectives] = useState<string>('The buyer is very excited but also nervous about the financial commitment. They have a lot of questions about hidden costs.');
  const [evaluationCriteria, setEvaluationCriteria] = useState<string>('Rapport Building, Needs Assessment, Addressing Concerns, Financial Qualification, Next Steps');
  const [selectedCountry, setSelectedCountry] = useState<string>('United States');
  const [callTimeLimit, setCallTimeLimit] = useState<number>(300); // 5 minutes in seconds, 0 for no limit


  const handleStart = useCallback(async () => {
    setAppState(AppState.GENERATING_PERSONA);
    setError(null);
    try {
      const newPersona = await generatePersona(difficulty, trainingScenario, personaDirectives, selectedCountry);
      setPersona(newPersona);
      setTranscript([]);
      setReport(null);
      setAppState(AppState.READY_FOR_CALL);
    } catch (err) {
      console.error(err);
      setError('Failed to generate an AI persona. Please check the API key and try again.');
      setAppState(AppState.IDLE);
      setActiveTab('simulation');
    }
  }, [difficulty, trainingScenario, personaDirectives, selectedCountry]);

  const handleStartCall = useCallback(() => {
    setAppState(AppState.IN_CALL);
  }, []);

  const handleEndCall = useCallback(async (finalTranscript: ChatMessage[]) => {
    setAppState(AppState.EVALUATING);
    setTranscript(finalTranscript);
    setError(null);
    try {
      if (!persona) throw new Error("Persona not available for evaluation.");
      const evaluationReport = await evaluateCall(finalTranscript, persona, trainingScenario, evaluationCriteria, selectedCountry);
      setReport(evaluationReport);
      setAppState(AppState.REPORT_READY);
    } catch (err) {
      console.error(err);
      setError('Failed to evaluate the call. Please check the API key and try again.');
      setAppState(AppState.IDLE);
      setActiveTab('simulation');
    }
  }, [persona, trainingScenario, evaluationCriteria, selectedCountry]);

  const handleReset = useCallback(() => {
    setAppState(AppState.IDLE);
    setActiveTab('simulation');
    setPersona(null);
    setReport(null);
    setTranscript([]);
    setError(null);
    // Note: We don't reset settings like voice, rate, difficulty etc.
    // as they are meant to be persistent user preferences.
  }, []);

  const handleStartFollowUp = useCallback(() => {
    setReport(null); // Clear the report
    // Transcript is preserved
    setAppState(AppState.IN_CALL); // Go directly to the call
  }, []);


  const renderContent = () => {
    switch (appState) {
      case AppState.GENERATING_PERSONA:
        return <LoadingIndicator text="Generating AI Persona..." />;
      case AppState.READY_FOR_CALL:
        if (!persona) return <LoadingIndicator text="Loading..." />;
        return <CallView persona={persona} trainingScenario={trainingScenario} onStartCall={handleStartCall} onEndCall={handleEndCall} voiceURI={selectedVoiceURI} speechRate={speechRate} initialTranscript={transcript} country={selectedCountry} callTimeLimit={callTimeLimit} />;
      case AppState.IN_CALL:
        if (!persona) return <LoadingIndicator text="Loading..." />;
        return <CallView persona={persona} trainingScenario={trainingScenario} onStartCall={handleStartCall} onEndCall={handleEndCall} isCallActiveProp={true} voiceURI={selectedVoiceURI} speechRate={speechRate} initialTranscript={transcript} country={selectedCountry} callTimeLimit={callTimeLimit} />;
      case AppState.EVALUATING:
        return <LoadingIndicator text="Evaluating your performance..." />;
      case AppState.REPORT_READY:
        if (!report) return <LoadingIndicator text="Loading Report..." />;
        return <ReportView report={report} transcript={transcript} onReset={handleReset} onStartFollowUp={handleStartFollowUp} />;
      case AppState.IDLE:
      default:
        const idleError = appState === AppState.IDLE ? error : null;
        return (
          <>
            <TabNavigator activeTab={activeTab} setActiveTab={setActiveTab} />
            {activeTab === 'simulation' && <WelcomeScreen onStart={handleStart} error={idleError} difficulty={difficulty} trainingScenario={trainingScenario} personaDirectives={personaDirectives} callTimeLimit={callTimeLimit} />}
            {activeTab === 'settings' && 
              <SettingsScreen 
                voices={voices} 
                selectedVoice={selectedVoiceURI} 
                onVoiceChange={setSelectedVoiceURI} 
                selectedRate={speechRate} 
                onRateChange={setSpeechRate} 
                difficulty={difficulty}
                onDifficultyChange={setDifficulty}
                trainingScenario={trainingScenario}
                onTrainingScenarioChange={setTrainingScenario}
                personaDirectives={personaDirectives}
                onPersonaDirectivesChange={setPersonaDirectives}
                evaluationCriteria={evaluationCriteria}
                onEvaluationCriteriaChange={setEvaluationCriteria}
                country={selectedCountry}
                onCountryChange={setSelectedCountry}
                callTimeLimit={callTimeLimit}
                onCallTimeLimitChange={setCallTimeLimit}
              />}
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl mx-auto">
        {renderContent()}
      </div>
    </div>
  );
};

export default App;
