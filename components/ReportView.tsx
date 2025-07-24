
import React, { useMemo, useCallback } from 'react';
import type { EvaluationReport, ChatMessage, EvaluationCriteria } from '../types';
import { HomeIcon } from './icons/HomeIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { FollowUpIcon } from './icons/FollowUpIcon';

const ScoreCircle: React.FC<{ score: number }> = ({ score }) => {
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 10) * circumference;
  
  const getColor = (s: number) => {
    if (s >= 8) return 'text-green-400';
    if (s >= 5) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="relative w-28 h-28">
      <svg className="w-full h-full" viewBox="0 0 100 100">
        <circle
          className="text-slate-700"
          strokeWidth="10"
          stroke="currentColor"
          fill="transparent"
          r="45"
          cx="50"
          cy="50"
        />
        <circle
          className={getColor(score)}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r="45"
          cx="50"
          cy="50"
          transform="rotate(-90 50 50)"
        />
      </svg>
      <span className={`absolute inset-0 flex items-center justify-center text-3xl font-bold ${getColor(score)}`}>
        {score.toFixed(1)}
      </span>
    </div>
  );
};

const CriteriaCard: React.FC<{ item: EvaluationCriteria }> = ({ item }) => {
  const scoreColor = useMemo(() => {
    if (item.score >= 8) return 'bg-green-500/20 text-green-300';
    if (item.score >= 5) return 'bg-yellow-500/20 text-yellow-300';
    return 'bg-red-500/20 text-red-300';
  }, [item.score]);

  return (
    <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700">
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-bold text-lg text-slate-200">{item.criteria}</h4>
        <span className={`px-3 py-1 text-sm font-bold rounded-full ${scoreColor}`}>{item.score}/10</span>
      </div>
      <p className="text-slate-400">{item.feedback}</p>
    </div>
  );
};


const ReportView: React.FC<{ report: EvaluationReport; transcript: ChatMessage[]; onReset: () => void; onStartFollowUp: () => void; }> = ({ report, transcript, onReset, onStartFollowUp }) => {
  const handleDownload = useCallback(() => {
    let reportContent = `AI Persona Simulator - Performance Report\n`;
    reportContent += `=========================================\n\n`;

    reportContent += `OVERALL PERFORMANCE\n`;
    reportContent += `-------------------\n`;
    reportContent += `Score: ${report.overallScore.toFixed(1)}/10\n`;
    reportContent += `Feedback: ${report.overallFeedback}\n\n`;

    reportContent += `DETAILED EVALUATION\n`;
    reportContent += `-------------------\n`;
    report.evaluation.forEach(item => {
        reportContent += `\n`;
        reportContent += `Criterion: ${item.criteria}\n`;
        reportContent += `Score: ${item.score}/10\n`;
        reportContent += `Feedback: ${item.feedback}\n`;
    });

    reportContent += `\n\n=========================================\n\n`;
    reportContent += `FULL CALL TRANSCRIPT\n`;
    reportContent += `--------------------\n\n`;
    transcript.forEach(msg => {
        const sender = msg.sender === 'user' ? 'Consultant (You)' : 'AI Persona';
        reportContent += `${sender}:\n${msg.text}\n\n`;
    });

    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    link.setAttribute('download', `performance-report-${timestamp}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [report, transcript]);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-cyan-400 mb-2">Performance Report</h1>
        <p className="text-lg text-slate-300">Here's the analysis of your mock call.</p>
      </div>

      <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-2xl flex flex-col md:flex-row items-center gap-8">
        <div className="flex-shrink-0">
          <ScoreCircle score={report.overallScore} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Overall Performance</h2>
          <p className="text-slate-300">{report.overallFeedback}</p>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-2xl font-bold text-center text-white">Detailed Evaluation</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {report.evaluation.map((item, index) => (
            <CriteriaCard key={index} item={item} />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-2xl font-bold text-center text-white">Call Transcript</h3>
        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 max-h-96 overflow-y-auto space-y-4">
            {transcript.map((msg, index) => (
                <div key={index} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`text-sm font-bold mb-1 ${msg.sender === 'user' ? 'text-cyan-400' : 'text-fuchsia-400'}`}>
                        {msg.sender === 'user' ? 'You' : 'AI Persona'}
                    </div>
                    <div className={`px-4 py-2 rounded-lg max-w-xl ${msg.sender === 'user' ? 'bg-cyan-900/70 text-cyan-100' : 'bg-fuchsia-900/70 text-fuchsia-100'}`}>
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                    </div>
                </div>
            ))}
        </div>
      </div>

      <div className="text-center pt-4 flex flex-col sm:flex-row justify-center items-center gap-4">
        <button
          onClick={onReset}
          className="group w-full sm:w-auto inline-flex items-center justify-center gap-3 px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-slate-900 font-bold rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-cyan-500/50"
        >
          <HomeIcon className="w-6 h-6 transition-transform duration-300 group-hover:-rotate-12" />
          <span>New Simulation</span>
        </button>
        <button
          onClick={onStartFollowUp}
          className="group w-full sm:w-auto inline-flex items-center justify-center gap-3 px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/50"
        >
          <FollowUpIcon className="w-6 h-6" />
          <span>Follow-up Call</span>
        </button>
        <button
          onClick={handleDownload}
          className="group w-full sm:w-auto inline-flex items-center justify-center gap-3 px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white font-bold rounded-full text-lg transition-all duration-300 transform hover:scale-105"
        >
          <DownloadIcon className="w-6 h-6" />
          <span>Download Report</span>
        </button>
      </div>
    </div>
  );
};

export default ReportView;
