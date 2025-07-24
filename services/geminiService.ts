import { GoogleGenAI, Type } from "@google/genai";
import type { Persona, EvaluationReport, ChatMessage } from '../types';
import { Difficulty } from '../types';

if (!import.meta.env.VITE_API_KEY) {
  throw new Error("VITE_API_KEY environment variable not set");
}

export const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });

const personaSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: "The persona's full name, which should be culturally appropriate for their country." },
    age: { type: Type.INTEGER, description: "The persona's age." },
    background: { type: Type.STRING, description: "A brief summary of the persona's background relevant to the scenario and their country." },
    interests: { type: Type.STRING, description: "The persona's primary interests or goals." },
    topicOfInterest: { type: Type.STRING, description: "The main topic the persona is interested in discussing." },
    concerns: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of 2-3 key concerns the persona has." },
    personality: { type: Type.STRING, description: "A short description of the persona's personality (e.g., anxious, confident, confused, angry)." },
  },
  required: ["name", "age", "background", "interests", "topicOfInterest", "concerns", "personality"]
};

const evaluationSchema = {
    type: Type.OBJECT,
    properties: {
        overallScore: { type: Type.NUMBER, description: "An overall score out of 10 for the trainee's performance." },
        overallFeedback: { type: Type.STRING, description: "A summary of the trainee's performance, highlighting strengths and key areas for improvement." },
        evaluation: {
            type: Type.ARRAY,
            description: "A detailed breakdown of the performance based on specific criteria.",
            items: {
                type: Type.OBJECT,
                properties: {
                    criteria: { type: Type.STRING, description: "The name of the evaluation criterion as requested by the user." },
                    score: { type: Type.NUMBER, description: "A score from 1 to 10 for this specific criterion." },
                    feedback: { type: Type.STRING, description: "Specific feedback and examples from the conversation for this criterion." }
                },
                required: ["criteria", "score", "feedback"]
            }
        }
    },
    required: ["overallScore", "overallFeedback", "evaluation"]
};

const getDifficultyInstructions = (difficulty: Difficulty): string => {
    switch (difficulty) {
        case Difficulty.EASY:
            return "The persona should be generally positive and cooperative, with clear and straightforward needs. They are easy to guide.";
        case Difficulty.MEDIUM:
            return "The persona should present a mix of positive and negative traits. Their needs are more complex or nuanced. They might have some misconceptions that need correcting.";
        case Difficulty.HARD:
            return "The persona should be challenging. They could be skeptical, frustrated, misinformed, or have unrealistic expectations. Their personality should test the trainee's patience, empathy, and problem-solving skills.";
        default:
            return "The persona has a standard profile with common questions.";
    }
}

export const generatePersona = async (difficulty: Difficulty, trainingScenario: string, personaDirectives: string | undefined, country: string): Promise<Persona> => {
  const difficultyInstructions = getDifficultyInstructions(difficulty);

  const prompt = `
    You are to generate a realistic and detailed persona for a professional training simulation.
    The persona should be a challenge for the trainee based on the provided scenario, directives, and difficulty level.

    1.  **Country**: The persona must be from **${country}**. Their name, background, and cultural context should reflect this.
    2.  **Training Scenario**: This is the overall context of the interaction.
        "${trainingScenario || 'A general customer service call.'}"
    3.  **Specific Persona Directives**: These are specific instructions for the persona's character.
        "${personaDirectives || 'No specific directives provided.'}"
    4.  **Difficulty-specific instructions**: ${difficultyInstructions}

    Combine all the above information to create a coherent and believable persona. The persona must fit the Training Scenario and their Country. The Persona Directives should take precedence if there are any conflicts.
    Fill all fields in the provided JSON schema.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: personaSchema,
    },
  });

  const personaJson = JSON.parse(response.text || '{}');
  return personaJson as Persona;
};

export const evaluateCall = async (transcript: ChatMessage[], persona: Persona, trainingScenario: string, evaluationCriteria: string, country: string): Promise<EvaluationReport> => {
    const formattedTranscript = transcript.map(msg => `${msg.sender.toUpperCase()}: ${msg.text}`).join('\n');

    const prompt = `
      You are an expert evaluator for professional training simulations.
      The simulation's context was:
      **Training Scenario**: ${trainingScenario || 'General conversation skills.'}
      **Country**: The simulation was localized for ${country}.

      The trainee ('USER') was interacting with an AI playing a role.
      **AI Persona Profile**:
      - Name: ${persona.name}
      - Personality: ${persona.personality}
      - Background & Concerns: ${persona.background} Their main concerns were: ${persona.concerns.join(', ')}.

      Your task is to analyze the conversation transcript and evaluate the trainee's performance.

      **The trainee must be evaluated based on the following criteria**:
      ${evaluationCriteria || 'Overall Communication Quality'}

      For each criterion you evaluate, provide a score from 1-10 and detailed, constructive feedback with examples from the conversation.
      Also, provide an overall score and a summary of the performance.
      Use the provided JSON schema for your response, ensuring an entry in the 'evaluation' array for each requested criterion.

      Transcript:
      ---
      ${formattedTranscript}
      ---
    `;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: evaluationSchema,
        },
    });

    const reportJson = JSON.parse(response.text || '{}');
    return reportJson as EvaluationReport;
};

export const getCallHint = async (transcript: ChatMessage[], trainingScenario: string, country: string): Promise<string> => {
    const formattedTranscript = transcript.map(msg => `${msg.sender.toUpperCase()}: ${msg.text}`).join('\n');

    const prompt = `
      You are an expert communication coach for professional role-playing simulations.
      The current training scenario is: "${trainingScenario || 'A general customer service call.'}"
      The scenario is localized for a customer in **${country}**.

      Below is a transcript of a call in progress between a trainee ('USER') and an AI ('AI').
      The trainee has clicked a "Hint" button and needs help.
      Based on the conversation so far and the scenario, suggest one single, effective open-ended question the trainee could ask next.
      The question should help the trainee achieve the goals of the scenario (e.g., build rapport, uncover needs, resolve a conflict).

      IMPORTANT: Do not provide any preamble, explanation, or surrounding text. Respond with ONLY the suggested question itself.

      Transcript:
      ---
      ${formattedTranscript}
      ---
    `;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          // Disable thinking for low latency hint generation
          thinkingConfig: { thinkingBudget: 0 }
        }
    });

    return response.text ? response.text.trim() : '';
};