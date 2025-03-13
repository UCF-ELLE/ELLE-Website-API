import axios from 'axios';

const ELLE_URL = 'https://chdr.cs.ucf.edu/elleapi';

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

interface ChatbotResponse {
  chatbotSession: string;
  userBackground: string;
  userMusic: string;
}

export const getChatbotForUser = async (access_token: string, userId: number, moduleId: number): Promise<ChatbotResponse | { chatbotId: number } | null> => {
  try {
    const response = await axios.get<ChatbotResponse | { chatbotId: number }>(`${ELLE_URL}/chatbot/${userId}/${moduleId}`, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    return response.data;
  } catch (error) {
    handleError(error);
    return null;
  }
};

interface sendUserMessageResponse {
  llmValue: string;
  termsUsed: Record<string, any>;
  wordsUsed: number;
}

export const sendUserMessage = async (access_token: string, userId: number, chatbotId: number, moduleId: number, source: "User", value: string): Promise<sendUserMessageResponse | null> => {
  try {
    const response = await axios.post<sendUserMessageResponse>(`${ELLE_URL}/chat/messages`, { userId, chatbotId, moduleId, source, value }, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    return response.data;
  } catch (error) {
    handleError(error);
    return null;
  }
};

interface ChatMessage {
  id: number;
  userId: number;
  chatbotId: number;
  moduleId: number;
  source: string;
  value: string;
  timestamp: string;
}

export const getChatMessages = async (access_token: string, userId: number, chatbotId: number): Promise<ChatMessage[] | null> => {
  try {
    const response = await axios.get<ChatMessage[]>(`${ELLE_URL}/chat/messages`, {
      params: {
        userId,
        chatbotId,
      },
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    return response.data;
  } catch (error) {
    handleError(error);
    return null;
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
};