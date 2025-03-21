import axios from 'axios';

const ELLE_URL = 'https://chdr.cs.ucf.edu/elleapi';
//const ELLE_URL = 'http://159.65.232.73/elleapi';

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

interface GetChatBotResponse {
  chatbotId: number;
  termsUsed: string[];
  userBackground?: string;
  userMusicChoice?: string;
}

// getChatBot (POST)
export const getChatbot = async (access_token: string, userId: number, moduleId: number, terms: Term[]): Promise<GetChatBotResponse | null> => {
  try {
    const response = await axios.post(
      `${ELLE_URL}/chat/chatbot`,
      { userId, moduleId, terms },
      {
        headers: { 
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json"
        }
      }
    );
    console.log("getChatbot response:");
    console.log(response.data);
    return response.data;
  } catch (error) {
    handleError(error);
    return null;
  }
};

interface ChatMessage {
  value: string;
  timestamp: string;
  source: "user" | "llm";
}

type GetMessagesResponse = ChatMessage[];

// getMessages (GET)
export const getMessages = async (access_token: string, userId: number, chatbotId: number): Promise<GetMessagesResponse | null> => {
  try {
    const response = await axios.get(
      `${ELLE_URL}/chat/messages`,
      {
        params: { userId, chatbotId },
        headers: { Authorization: `Bearer ${access_token}` }
      }
    );
    console.log("getMessages response:");
    console.log(response.data);
    return response.data;
  } catch (error) {
    handleError(error);
    return null;
  }
};


//TODO: Also send terms each time. Represents all vocab terms for a given module
//terms: string[]
interface SendMessageResponse {
  llmResponse: string;
  termsUsed: string[];
  titoConfused?: boolean; //Optional for now
}

// sendMessage (POST)
export const sendMessage = async (access_token: string, userId: number, chatbotId: number, moduleId: number, userValue: string, terms: string[]): Promise<SendMessageResponse | null> => {
  try {
    const response = await axios.post(
      `${ELLE_URL}/chat/messages`,
      { "userId": userId, "chatbotId": chatbotId, "moduleId": moduleId, "userValue": userValue, "terms": terms },
      {
        headers: { Authorization: `Bearer ${access_token}` }
      }
    );
    console.log("sendMessage response:");
    console.log(response.data);
    return response.data;
  } catch (error) {
    handleError(error);
    return null;
  }
}

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
