import React from 'react';
import { PhoneIcon } from './icons/PhoneIcon';
import { Difficulty } from '../types';

interface WelcomeScreenProps {
  onStart: () => void;
  error?: string | null;
  difficulty: Difficulty;
  trainingScenario: string;
  personaDirectives: string;
  callTimeLimit: number;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart, error, difficulty, trainingScenario, personaDirectives, callTimeLimit }) => {

  return (
    <div className="text-center bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700 max-w-2xl mx-auto animate-fade-in">
      <h1 className="text-4xl font-bold text-cyan-400 mb-2">AI Persona Simulator</h1>
      <p className="text-lg text-slate-300 mb-6">
        Ready to start your mock call? The current settings are listed below. You can change them in the "Settings" tab.
      </p>
      
      <div className="mb-8 bg-slate-900/50 border border-slate-700 rounded-lg p-6 text-left">
        <h3 className="text-xl font-semibold text-slate-200 mb-4 text-center">Current Configuration</h3>
        <ul className="space-y-4 text-slate-300">
            <li className="flex justify-between items-center">
                <span className="font-semibold">Difficulty:</span>
                <span className="px-3 py-1 text-sm font-bold rounded-full bg-cyan-500/20 text-cyan-300">{difficulty}</span>
            </li>
             <li className="flex justify-between items-center">
                <span className="font-semibold">Time Limit:</span>
                <span className="px-3 py-1 text-sm font-bold rounded-full bg-slate-700 text-slate-300">
                    {callTimeLimit > 0 ? `${callTimeLimit / 60} Minutes` : 'No Limit'}
                </span>
            </li>
            <li className="flex flex-col">
                <span className="font-semibold">Training Scenario:</span>
                <p className="text-slate-400 italic mt-1 pl-2 border-l-2 border-slate-600">
                    {trainingScenario || "Not set"}
                </p>
            </li>
            <li className="flex flex-col">
                <span className="font-semibold">AI Persona Directives:</span>
                <p className="text-slate-400 italic mt-1 pl-2 border-l-2 border-slate-600">
                    {personaDirectives || "Not set"}
                </p>
            </li>
        </ul>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-200 p-3 rounded-lg mb-6">
          <p className="font-semibold">An error occurred:</p>
          <p>{error}</p>
        </div>
      )}

      <button
        onClick={onStart}
        className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-cyan-500 hover:bg-cyan-600 text-slate-900 font-bold rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-cyan-500/50"
      >
        <PhoneIcon className="w-6 h-6 transition-transform duration-300 group-hover:rotate-12" />
        <span>Initiate Mock Call</span>
      </button>
    </div>
  );
};

export default WelcomeScreen;
