export const chatbotConfig = {
  hyperparameters: {
    maxTokens: 2000,
    temperature: 0.7,
    topP: 1.0,
    frequencyPenalty: 0.0,
    presencePenalty: 0.0,
    maxConversationHistory: 10,
    streamResponse: true,
  },
  
  predefinedPrompts: [
    "Analyze the current high anomaly score and recommend actions",
    "What's causing the elevated turbidity readings?",
    "Assess the public health risk from current water quality",
    "Recommend steps to stabilize chlorine levels",
    "Diagnose the pressure drop in the distribution system",
  ],
  
  responseConfig: {
    showSources: true,
    showConfidence: true,
    includeTimestamps: true,
    formatMarkdown: true,
  },
};

export type ChatbotConfig = typeof chatbotConfig;

