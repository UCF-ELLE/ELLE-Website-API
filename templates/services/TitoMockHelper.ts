/*

// TitoMockHelper.ts - Mock responses for testing Tito chat functionality
// This is separate from core logic and can be removed once real APIs are working

interface Term {
  termID: number;
  questionFront: string;
  questionBack: string;
}

interface GetChatBotResponse {
  chatbotId: number;
  termsUsed: string[];
  userBackground?: string;
  userMusicChoice?: string;
  totalTimeChatted: number;
}

interface SendMessageResponse {
  llmResponse: string;
  termsUsed: string[];
  titoConfused?: boolean;
  metadata?: {
    score?: number;
    error?: string;
    correction?: string;
    explanation?: string;
  }
}

// Mock vocabulary terms based on actual database content
export const mockTermsData = {
  1: [ // Spanish colors module (original data)
    { termID: 3, questionFront: "naranjo/a", questionBack: "orange" },
    { termID: 59, questionFront: "rojo/a", questionBack: "red" },
    { termID: 61, questionFront: "amarillo/a", questionBack: "yellow" },
    { termID: 63, questionFront: "marado/a", questionBack: "purple" },
    { termID: 65, questionFront: "Marron", questionBack: "Brown" },
    { termID: 66, questionFront: "negro/a", questionBack: "black" },
    { termID: 67, questionFront: "blanco/a", questionBack: "white" },
    { termID: 75, questionFront: "gris", questionBack: "gray" },
    { termID: 886, questionFront: "arcoiris", questionBack: "rainbow" },
  ],
  2: [ // Module 2 
    { termID: 6, questionFront: "bonjour", questionBack: "hello" },
    { termID: 7, questionFront: "au revoir", questionBack: "goodbye" },
    { termID: 8, questionFront: "merci", questionBack: "thank you" },
    { termID: 9, questionFront: "s'il vous plaît", questionBack: "please" },
    { termID: 10, questionFront: "bonne nuit", questionBack: "good night" },
  ],
  3: [ // Module 3
    { termID: 11, questionFront: "ciao", questionBack: "hello" },
    { termID: 12, questionFront: "arrivederci", questionBack: "goodbye" },
    { termID: 13, questionFront: "grazie", questionBack: "thank you" },
    { termID: 14, questionFront: "per favore", questionBack: "please" },
    { termID: 15, questionFront: "buona notte", questionBack: "good night" },
  ]
};

// Mock functions for testing - can be removed once real APIs work
export const mockFetchModuleTerms = async (access_token: string, moduleID: number): Promise<Term[] | null> => {
  console.log(`[MOCK] fetchModuleTerms for module ${moduleID}`);
  const terms = mockTermsData[moduleID as keyof typeof mockTermsData] || mockTermsData[1];
  await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API delay
  return terms;
};

export const mockGetChatbot = async (access_token: string, userId: number, moduleId: number, terms: Term[]): Promise<GetChatBotResponse | null> => {
  console.log("[MOCK] getChatbot creating mock session");
  const mockChatbotId = Math.floor(Math.random() * 9000) + 1000;
  return {
    chatbotId: mockChatbotId,
    termsUsed: [],
    userBackground: null,
    userMusicChoice: null,
    totalTimeChatted: 0
  };
};

export const mockGetMessages = async (access_token: string, userId: number, chatbotId: number): Promise<any[] | null> => {
  console.log("[MOCK] getMessages returning empty array");
  return [];
};

export const mockSendMessage = async (access_token: string, userId: number, chatbotId: number, moduleId: number, userValue: string, terms: string[], termsUsed: string[]): Promise<SendMessageResponse | null> => {
  console.log("[MOCK] sendMessage for:", userValue);
  
  const responses = [
    "¡Muy bien! That's correct!",
    "Great job! Keep practicing!", 
    "Excellent! You're doing well!",
    "That's right! Continue the conversation!",
    "Perfect! Let's try another phrase.",
    "Good work! Your pronunciation is improving!",
    "¡Fantástico! You're learning fast!",
    "Well done! Keep it up!"
  ];
  
  const usedTerms = terms.filter(term => 
    userValue.toLowerCase().includes(term.toLowerCase())
  );
  
  let response = responses[Math.floor(Math.random() * responses.length)];
  if (usedTerms.length > 0) {
    response = `Great! I see you used '${usedTerms[0]}'. ` + response;
  }
  
  return {
    llmResponse: response,
    termsUsed: usedTerms,
    titoConfused: Math.random() < 0.2,
    metadata: {
      score: Math.floor(Math.random() * 5) + 6,
      explanation: `You used ${usedTerms.length} vocabulary terms correctly!`,
      correction: null,
      error: null
    }
  };
};

export const mockIncrementTime = async (access_token: string, userId: number, chatbotId: number, prevTimeChatted: number, newTimeChatted: number): Promise<number | null> => {
  console.log(`[MOCK] incrementTime: ${newTimeChatted} seconds`);
  return 200;
}; 

REMOVE COMMENT TO USE MOCKHELPER*/