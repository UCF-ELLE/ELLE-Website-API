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
const ELLE_URL = 'http://127.0.0.1:5050/elleapi';


interface Module {
  moduleID: number;
  name: string;
  language: string;
}

// Fetches a user's modules given their JWT
// Returns all modules' ID, name, and language
export const fetchModules = async (access_token: string): Promise<Module[] | null> => {
  try {
    const response = await axios.get<Module[]>(`${ELLE_URL}/modules`, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    return response.data.map((module) => ({
      moduleID: module.moduleID,
      name: module.name,
      language: module.language,
    }));
  } catch (error) {
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
    
    // Create form data to match backend expectations
    const formData = new FormData();
    formData.append('moduleID', moduleId.toString());
    formData.append('classID', '1'); // TODO: Get actual class ID from user context
    
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
    return response.data.data || response.data;
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

  // Use real API
  try {
    // Create form data to match backend expectations
    const formData = new FormData();
    formData.append('message', userValue);
    formData.append('chatbotSID', chatbotId.toString());
    formData.append('moduleID', moduleId.toString());
    formData.append('isVoiceMessage', 'false'); // Assuming text message
    
    const response = await axios.post(
      `${ELLE_URL}/twt/session/messages`,
      formData,
      {
        headers: { 
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'multipart/form-data'
        }
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
    // Map the response to match expected format
    return {
      llmResponse: data.titoResponse || data.llmResponse || "Great job!",
      termsUsed: data.termsUsed || [],
      titoConfused: data.titoConfused || false,
      metadata: data.metadata || {}
    };
  } catch (error) {
    console.error("sendMessage API Error Details:");
    if (axios.isAxiosError(error)) {
      console.error("Status:", error.response?.status);
      console.error("Data:", error.response?.data);
      console.error("Headers:", error.response?.headers);
    }
    handleError(error);
    // Return basic response when API fails
    return {
      llmResponse: "Sorry, I'm having trouble connecting to the server. The backend might not be running properly.",
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

  // Use real API
  try {
    const response = await axios.post(
      `${ELLE_URL}/chat/chatbot/time`,
      { userId, chatbotId, prevTimeChatted, newTimeChatted },
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        }
      }
    );
    console.log("incrementTime response:");
    console.log(response.status);
    return response.status;
  } catch (error) {
    handleError(error);
    return 200;
  }
}


// exportChat (POST)
// Expects a CSV file to be downloaded when the chat history is requested.
export const exportChat = async (access_token: string, userId: number, chatbotId: number): Promise<":)" | ":("> => {
  try {
    // Send POST request to Flask API to export chat history
    const response = await axios.post(
      `${ELLE_URL}/chat/chatbot/export`,
      { userId, chatbotId }, // Send necessary data in the body
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
        responseType: 'blob', // Expect a binary response (the CSV file)
      }
    );
    // Create a download link for the CSV file
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a"); // Create temporary invisible anchor element
    link.href = url;
    link.setAttribute("download", "chat_history.csv");
    document.body.appendChild(link);
    link.click(); // Triggers the download
    return ":)";
  } catch (error) {
    handleError(error);
    return ":(";
  }
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
