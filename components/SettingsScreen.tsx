import React, { useEffect } from 'react';
import { Difficulty } from '../types';

interface SettingsScreenProps {
  voices: SpeechSynthesisVoice[];
  selectedVoice: string;
  onVoiceChange: (uri: string) => void;
  selectedRate: number;
  onRateChange: (rate: number) => void;
  difficulty: Difficulty;
  onDifficultyChange: (d: Difficulty) => void;
  trainingScenario: string;
  onTrainingScenarioChange: (value: string) => void;
  personaDirectives: string;
  onPersonaDirectivesChange: (value: string) => void;
  evaluationCriteria: string;
  onEvaluationCriteriaChange: (value: string) => void;
  country: string;
  onCountryChange: (value: string) => void;
  callTimeLimit: number;
  onCallTimeLimitChange: (seconds: number) => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ 
  voices, selectedVoice, onVoiceChange, selectedRate, onRateChange,
  difficulty, onDifficultyChange, trainingScenario, onTrainingScenarioChange,
  personaDirectives, onPersonaDirectivesChange, evaluationCriteria, onEvaluationCriteriaChange,
  country, onCountryChange, callTimeLimit, onCallTimeLimitChange
}) => {

  const countries = ['United States', 'United Kingdom', 'Canada', 'Australia', 'India', 'South Africa', 'Sri Lanka'];
  const langCodeMap: { [key: string]: string } = {
    'United States': 'en-US',
    'United Kingdom': 'en-GB',
    'Canada': 'en-CA',
    'Australia': 'en-AU',
    'India': 'en-IN',
    'South Africa': 'en-ZA',
    'Sri Lanka': 'si-LK',
  };

  useEffect(() => {
    // Set a default voice on initial load, preferring one that matches the country
    if (voices.length > 0 && !selectedVoice) {
        const langCode = langCodeMap[country] || 'en-US';
        const countryVoice = voices.find(v => v.lang === langCode);
        const defaultVoice = countryVoice || voices.find(v => v.name.includes('Google US English')) || voices.find(v => v.default) || voices[0];
        if (defaultVoice) {
            onVoiceChange(defaultVoice.voiceURI);
        }
    }
  }, [voices, selectedVoice, onVoiceChange, country]);

  const getPaceLabel = (rate: number): string => {
    if (rate < 0.8) return `Slower (${rate.toFixed(1)}x)`;
    if (rate < 1) return `Slow (${rate.toFixed(1)}x)`;
    if (rate === 1) return `Normal (1.0x)`;
    if (rate <= 1.2) return `Slightly Fast (${rate.toFixed(1)}x)`;
    if (rate <= 1.6) return `Fast (${rate.toFixed(1)}x)`;
    return `Faster (${rate.toFixed(1)}x)`;
  };

  const difficultyOptions = [
    { id: Difficulty.EASY, label: 'Easy' },
    { id: Difficulty.MEDIUM, label: 'Medium' },
    { id: Difficulty.HARD, label: 'Hard' },
  ];
  
  return (
    <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700 max-w-2xl mx-auto animate-fade-in">
        <div className="text-center">
            <h2 className="text-3xl font-bold text-cyan-400 mb-2">AI Settings</h2>
            <p className="text-lg text-slate-300 mb-8">
                Customize the AI's voice and behavior. These settings will apply to all simulations.
            </p>
        </div>

        <div className="space-y-10">

            {/* --- Simulation Setup --- */}
            <div className="space-y-6">
                <h3 className="text-2xl font-bold text-slate-200 border-b border-slate-600 pb-3">Simulation Design</h3>
                <div className="text-left">
                    <label htmlFor="training-scenario" className="block text-xl font-semibold text-slate-200 mb-3 text-center">
                        Training Scenario
                    </label>
                    <textarea
                        id="training-scenario"
                        value={trainingScenario}
                        onChange={(e) => onTrainingScenarioChange(e.target.value)}
                        placeholder="e.g., 'A sales call to pitch a new software to a potential client.'"
                        className="w-full bg-slate-900/50 border border-slate-600 rounded-lg p-3 text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                        rows={3}
                        aria-label="Training Scenario"
                    />
                    <p className="text-sm text-slate-400 mt-2 text-center">This sets the overall scene for the mock call.</p>
                </div>

                <div className="text-left">
                    <label htmlFor="persona-directives" className="block text-xl font-semibold text-slate-200 mb-3 text-center">
                        AI Persona Directives
                    </label>
                    <textarea
                        id="persona-directives"
                        value={personaDirectives}
                        onChange={(e) => onPersonaDirectivesChange(e.target.value)}
                        placeholder="e.g., 'The client is skeptical and has a very limited budget.'"
                        className="w-full bg-slate-900/50 border border-slate-600 rounded-lg p-3 text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                        rows={3}
                        aria-label="AI Persona Directives"
                    />
                     <p className="text-sm text-slate-400 mt-2 text-center">Give the AI specific instructions for its character and behavior.</p>
                </div>
                
                <div className="text-left">
                    <label htmlFor="evaluation-criteria" className="block text-xl font-semibold text-slate-200 mb-3 text-center">
                        Evaluation Criteria
                    </label>
                    <textarea
                        id="evaluation-criteria"
                        value={evaluationCriteria}
                        onChange={(e) => onEvaluationCriteriaChange(e.target.value)}
                        placeholder="e.g., 'Rapport Building, Product Knowledge, Handling Objections, Closing'"
                        className="w-full bg-slate-900/50 border border-slate-600 rounded-lg p-3 text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                        rows={2}
                        aria-label="Evaluation Criteria"
                    />
                    <p className="text-sm text-slate-400 mt-2 text-center">List the skills you want to be evaluated on, separated by commas.</p>
                </div>

                 <div className="text-left">
                    <h4 className="text-xl font-semibold text-slate-200 mb-4 text-center">Choose a Difficulty Level</h4>
                    <div className="flex justify-center gap-4 bg-slate-900/50 p-2 rounded-full">
                        {difficultyOptions.map(({ id, label }) => (
                        <button
                            key={id}
                            onClick={() => onDifficultyChange(id)}
                            className={`w-full px-6 py-2 rounded-full font-semibold transition-all duration-300 ${
                            difficulty === id
                                ? 'bg-cyan-500 text-slate-900 shadow-md'
                                : 'bg-transparent text-slate-300 hover:bg-slate-700/50'
                            }`}
                        >
                            {label}
                        </button>
                        ))}
                    </div>
                </div>

                <div className="text-left">
                    <label htmlFor="call-time-limit" className="block text-xl font-semibold text-slate-200 mb-3 text-center">
                        Call Time Limit
                    </label>
                    <select
                        id="call-time-limit"
                        value={callTimeLimit}
                        onChange={(e) => onCallTimeLimitChange(Number(e.target.value))}
                        className="w-full bg-slate-900/50 border border-slate-600 rounded-lg p-3 text-slate-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                        aria-label="Set call time limit"
                    >
                        <option value="180">3 Minutes</option>
                        <option value="300">5 Minutes</option>
                        <option value="600">10 Minutes</option>
                        <option value="0">No Limit</option>
                    </select>
                    <p className="text-sm text-slate-400 mt-2 text-center">The call will end automatically after this duration.</p>
                </div>
            </div>

            {/* --- Localization --- */}
            <div className="space-y-6">
                 <h3 className="text-2xl font-bold text-slate-200 border-b border-slate-600 pb-3">Localization</h3>
                 <div className="text-left">
                    <label htmlFor="country-select" className="block text-xl font-semibold text-slate-200 mb-3 text-center">
                        Select Country
                    </label>
                    <select
                        id="country-select"
                        value={country}
                        onChange={(e) => onCountryChange(e.target.value)}
                        className="w-full bg-slate-900/50 border border-slate-600 rounded-lg p-3 text-slate-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors"
                        aria-label="Select country for localization"
                    >
                        {countries.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <p className="text-sm text-slate-400 mt-2 text-center">Influences the AI's persona, accent, and speech recognition.</p>
                </div>
            </div>

            {/* --- Voice Settings --- */}
            <div className="space-y-6">
                <h3 className="text-2xl font-bold text-slate-200 border-b border-slate-600 pb-3">Voice & Pace</h3>
                <div className="text-left">
                    <label htmlFor="ai-voice" className="block text-xl font-semibold text-slate-200 mb-3 text-center">Select AI Voice</label>
                    <select
                        id="ai-voice"
                        value={selectedVoice}
                        onChange={(e) => onVoiceChange(e.target.value)}
                        disabled={voices.length === 0}
                        className="w-full bg-slate-900/50 border border-slate-600 rounded-lg p-3 text-slate-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Select AI voice"
                    >
                        {voices.length > 0 ? (
                        voices.map((voice) => (
                            <option key={voice.voiceURI} value={voice.voiceURI}>
                            {voice.name} ({voice.lang})
                            </option>
                        ))
                        ) : (
                        <option>Loading voices...</option>
                        )}
                    </select>
                </div>
                <div className="text-left">
                    <label htmlFor="ai-pace" className="block text-xl font-semibold text-slate-200 mb-3 text-center">
                        Set AI Voice Pace
                    </label>
                    <div className="w-full bg-slate-900/50 border border-slate-600 rounded-lg p-3 flex items-center gap-4">
                        <input
                        id="ai-pace"
                        type="range"
                        min="0.5"
                        max="2"
                        step="0.1"
                        value={selectedRate}
                        onChange={(e) => onRateChange(parseFloat(e.target.value))}
                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                        aria-label="AI voice pace"
                        />
                        <span className="text-sm font-mono text-cyan-400 w-28 text-center">{getPaceLabel(selectedRate)}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default SettingsScreen;