import axios from 'axios';

// Function to check if mock helpers are available
const checkMockAvailable = async () => {
  try {
    const mockModule = await import('./TitoMockHelper');
    console.log('[TitoService] Mock module loaded successfully');
    console.log('[TitoService] Available mock functions:', Object.keys(mockModule));
    return mockModule;
  } catch (error) {
    console.log('[TitoService] Mock module not available:', error);
    return null;
  }
};

// const ELLE_URL = 'https://chdr.cs.ucf.edu/elleapi';
//const ELLE_URL = 'http://159.65.232.73/elleapi';
// Connect directly to Flask backend running on port 5050
const ELLE_URL = 'http://localhost:5050/elleapi';


interface Module {
  moduleID: number;
  name: string;
  language: string;
}

// Fetches a user's available Tito modules given their JWT
// Returns all modules' ID, name, and language
export const fetchModules = async (access_token: string): Promise<Module[] | null> => {
  try {
    const response = await axios.get(`${ELLE_URL}/twt/session/access`, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });
    
    const data = response.data.data || [];
    console.log('Tito modules response:', data);
    
    // The response is an array of [classID, modules] tuples
    // Extract all modules from all classes
    const allModules: Module[] = [];
    for (const [classID, modulesList] of data) {
      for (const [moduleID, sequenceID] of modulesList) {
        // For now, we'll create basic module info
        // In production, you might want to fetch full module details
        allModules.push({
          moduleID: moduleID,
          name: `Module ${moduleID}`, // Placeholder name
          language: 'es' // Default to Spanish for Colors module
        });
      }
    }
    
    console.log('Processed modules:', allModules);
    return allModules;
  } catch (error) {
    console.error('Error fetching Tito modules:', error);
    if (axios.isAxiosError(error)) {
      console.error('Status:', error.response?.status);
      console.error('Status Text:', error.response?.statusText);
      console.error('Response Data:', error.response?.data);
      console.error('Request URL:', error.config?.url);
      console.error('Request Headers:', error.config?.headers);
    }
    handleError(error);
    return null;
  }
};

// Helper interface for deconstructing API response
interface APITerm {
  answers: {
    termID: number;
    front: string;
    back: string;
  }[];
}

interface Term {
  termID: number;
  questionFront: string;
  questionBack: string;
}

// Takes in user's access_token and moduleID
// Returns all terms' termID, questionFront (non-English term), questionBack (English term)
export const fetchModuleTerms = async (access_token: string, moduleID: number): Promise<Term[] | null> => {
  // First try to use mock if available
  const mockModule = await checkMockAvailable();
  if (mockModule && mockModule.mockFetchModuleTerms) {
    console.log('[TitoService] Using mock fetchModuleTerms');
    return await mockModule.mockFetchModuleTerms(access_token, moduleID);
  }

  // Use real API
  try {
    const response = await axios.post<APITerm[]>(`${ELLE_URL}/modulequestions`, { moduleID }, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    return response.data.map((term) => ({
      termID: term.answers[0]?.termID,
      questionFront: term.answers[0]?.front,
      questionBack: term.answers[0]?.back,
    }));
  } catch (error) {
    handleError(error);
    return null;
  }
};

interface GetChatBotResponse {
  chatbotId: number;
  termsUsed: string[];
  userBackground?: string;
  userMusicChoice?: string;
  totalTimeChatted: number;
}

// getChatBot (POST)
export const getChatbot = async (access_token: string, userId: number, moduleId: number, terms: Term[]): Promise<GetChatBotResponse | null> => {
  // First try to use mock if available
  const mockModule = await checkMockAvailable();
  if (mockModule && mockModule.mockGetChatbot) {
    console.log('[TitoService] Using mock getChatbot');
    return await mockModule.mockGetChatbot(access_token, userId, moduleId, terms);
  }

  // Use real API
  try {
    console.log("getChabot sending:");
    console.log({ userId, moduleId, terms });
    
    // First get available classes to find the right classID for this module
    const accessResponse = await axios.get(`${ELLE_URL}/twt/session/access`, {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    
    const accessData = accessResponse.data.data || [];
    let classID = '1'; // Default fallback
    
    // Find the class that contains this module
    for (const [cID, modulesList] of accessData) {
      for (const [mID, sequenceID] of modulesList) {
        if (mID === moduleId) {
          classID = cID.toString();
          break;
        }
      }
      if (classID !== '1') break; // Found the class, exit outer loop
    }
    
    console.log(`Using classID: ${classID} for moduleID: ${moduleId}`);
    
    // Create form data to match backend expectations
    const formData = new FormData();
    formData.append('moduleID', moduleId.toString());
    formData.append('classID', classID);
    
    const response = await axios.post(
      `${ELLE_URL}/twt/session/create`,
      formData,
      {
        headers: { 
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    console.log("getChatbot response:");
    console.log(response.data);
    
    // The session creation endpoint returns { success: true, data: chatbotSID }
    // We need to create a proper response object
    const chatbotSID = response.data.data;
    if (typeof chatbotSID === 'number') {
      
      return {
        chatbotId: chatbotSID,
        termsUsed: [], // No terms used yet in a new session
        totalTimeChatted: 0, // New session starts at 0
        userBackground: undefined,
        userMusicChoice: undefined
      };
    } else {
      console.error('Unexpected response format:', response.data);
      return null;
    }
  } catch (error) {
    console.error("getChatbot API Error Details:");
    if (axios.isAxiosError(error)) {
      console.error("Status:", error.response?.status);
      console.error("Data:", error.response?.data);
    }
    handleError(error);
    return null;
  }
};

interface ChatMessage {
  value: string;
  timestamp: string;
  source: "user" | "llm";
  metadata?: {
    score?: number;
    error?: string;
    correction?: string;
    explanation?: string;
  }
}

type GetMessagesResponse = ChatMessage[];

// getMessages (GET)
export const getMessages = async (access_token: string, userId: number, chatbotId: number): Promise<GetMessagesResponse | null> => {
  // First try to use mock if available
  const mockModule = await checkMockAvailable();
  if (mockModule && mockModule.mockGetMessages) {
    console.log('[TitoService] Using mock getMessages');
    return await mockModule.mockGetMessages(access_token, userId, chatbotId);
  }

  // Use real API
  try {
    // Backend expects moduleID as query parameter, not userId/chatbotId
    // For now, using moduleID=1 as default - this should be passed from the frontend
    const response = await axios.get(
      `${ELLE_URL}/twt/session/messages`,
      {
        params: { moduleID: 1 }, // TODO: Get actual moduleID from context
        headers: { Authorization: `Bearer ${access_token}` }
      }
    );
    const messages = response.data.data || response.data;
    if (Array.isArray(messages)) {
      messages.forEach((dataItem: ChatMessage) => {
        if(dataItem && typeof dataItem.metadata === "string") {
          dataItem.metadata = JSON.parse(dataItem.metadata);
        }
      });
    }
    console.log("getMessages response:");
    console.log(messages);
    return Array.isArray(messages) ? messages : [];
  } catch (error) {
    handleError(error);
    return [];
  }
};


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

// sendMessage (POST)
export const sendMessage = async (access_token: string, userId: number, chatbotId: number, moduleId: number, userValue: string, terms: string[], termsUsed: string[]): Promise<SendMessageResponse | null> => {
  console.log("sendMessage sending:");
  console.log({ userId, chatbotId, moduleId, userValue, terms, termsUsed });
  
  // First try to use mock if available
  const mockModule = await checkMockAvailable();
  if (mockModule && mockModule.mockSendMessage) {
    console.log('[TitoService] Using mock sendMessage');
    const mockResponse = await mockModule.mockSendMessage(access_token, userId, chatbotId, moduleId, userValue, terms, termsUsed);
    console.log('[TitoService] Mock response:', mockResponse);
    return mockResponse;
  }

  // Use real API - single attempt with original session
  try {
    // Create form data to match backend expectations
    const formData = new FormData();
    formData.append('message', userValue);
    formData.append('chatbotSID', chatbotId.toString());
    formData.append('moduleID', moduleId.toString());
    formData.append('isVoiceMessage', 'false'); // Assuming text message
    
    console.log(`[SendMessage] Sending with original session ID: ${chatbotId}`);
    
    const response = await axios.post(
      `${ELLE_URL}/twt/session/messages`,
      formData,
      {
        headers: { 
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'multipart/form-data'
        },
        timeout: 30000 // 30 seconds timeout
      }
    );
    
    const data = response.data.data || response.data;
    if(data && data.metadata && typeof data.metadata === "string") {
      try {
        data.metadata = JSON.parse(data.metadata);
      } catch (e) {
        console.log("Failed to parse metadata for message: " + data.metadata);
      }
    }
    
    console.log("sendMessage response:");
    console.log(data);
    
    // Success! Map the response to match expected format
    return {
      llmResponse: data.titoResponse || data.llmResponse || "Great job!",
      termsUsed: data.termsUsed || [],
      titoConfused: data.titoConfused || false,
      metadata: data.metadata || {}
    };
    
  } catch (error) {
    console.error("sendMessage failed:");
    
    if (axios.isAxiosError(error)) {
      console.error("Status:", error.response?.status);
      console.error("Data:", error.response?.data);
      console.error("Error code:", error.code);
      
      // Handle timeout specifically
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        console.error("Request timed out after 30 seconds");
        return {
          llmResponse: "I'm taking longer than usual to respond. The backend service seems to be slow right now. Please try sending your message again.",
          termsUsed: [],
          titoConfused: false,
          metadata: {}
        };
      }
      
      // Handle session validation errors
      if (error.response?.status === 400 && error.response?.data?.message?.includes('invalid session')) {
        console.log('[SendMessage] Detected invalid session error, returning session error message');
        const errorResponse = {
          llmResponse: "I'm having trouble with the session. This might be a backend issue. Please try refreshing the page to start a new chat session.",
          termsUsed: [],
          titoConfused: false,
          metadata: {}
        };
        console.log('[SendMessage] Returning error response:', errorResponse);
        return errorResponse;
      }
    }
    
    // Generic error message for other issues
    return {
      llmResponse: "I'm having trouble processing your message right now. The issue might be temporary - please try again in a moment.",
      termsUsed: [],
      titoConfused: false,
      metadata: {}
    };
  }
};

// Increment the time spent interacting with the chatbot
export const incrementTime = async (access_token: string, userId: number, chatbotId: number, prevTimeChatted: number, newTimeChatted: number): Promise<number | null> => {
  // First try to use mock if available
  const mockModule = await checkMockAvailable();
  if (mockModule && mockModule.mockIncrementTime) {
    console.log('[TitoService] Using mock incrementTime');
    return await mockModule.mockIncrementTime(access_token, userId, chatbotId, prevTimeChatted, newTimeChatted);
  }

  // Use real API - For now, just return success since this endpoint doesn't exist yet
  // TODO: Implement time tracking endpoint in backend if needed
  console.log("[TitoService] Skipping incrementTime - endpoint not implemented in Tito backend");
  return 200; // Return success code
}


// exportChat (POST)
// Expects a CSV file to be downloaded when the chat history is requested.
export const exportChat = async (access_token: string, userId: number, chatbotId: number): Promise<":)" | ":("> => {
  // TODO: Implement chat export endpoint in Tito backend if needed
  console.log("[TitoService] Export chat not implemented yet for Tito backend");
  console.log("Chat export requested for:", { userId, chatbotId });
  return ":("; // Return sad face since not implemented
};

// Utility function for handling errors
const handleError = (error: unknown): void => {
  if (axios.isAxiosError(error)) {
    console.error("Axios Error:", error.response?.data || error.message);
  } else if (error instanceof Error) {
    console.error("General Error:", error.message);
  } else {
    console.error("Unknown Error:", error);
  }
}
