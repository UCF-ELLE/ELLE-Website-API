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
    const tempTerms = terms.map(term => term.questionBack);
    const response = await axios.post(
      `${ELLE_URL}/chat/chatbot`,
      { "userId": userId, "moduleId": moduleId, "terms": tempTerms },
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
  try {
    const response = await axios.get(
      `${ELLE_URL}/chat/messages`,
      {
        params: { userId, chatbotId },
        headers: { Authorization: `Bearer ${access_token}` }
      }
    );
    response.data.forEach((dataItem: ChatMessage) => {
      if(dataItem && typeof dataItem.metadata === "string") {
        dataItem.metadata = JSON.parse(dataItem.metadata);
      }
    });
    console.log("getMessages response:");
    console.log(response.data);
    return response.data;
  } catch (error) {
    handleError(error);
    return null;
  }
};


interface SendMessageResponse {
  llmResponse: string;
  termsUsed: string[];
  titoConfused?: boolean; //Optional for now
  metadata?: {
    score?: number;
    error?: string;
    correction?: string;
    explanation?: string;
  }
}

// sendMessage (POST)
export const sendMessage = async (access_token: string, userId: number, chatbotId: number, moduleId: number, userValue: string, terms: string[], termsUsed: string[]): Promise<SendMessageResponse | null> => {
  try {
    const response = await axios.post(
      `${ELLE_URL}/chat/messages`,
      { "userId": userId, "chatbotId": chatbotId, "moduleId": moduleId, "userValue": userValue, "terms": terms , "termsUsed": termsUsed},
      {
        headers: { Authorization: `Bearer ${access_token}` }
      }
    );
    if(response.data.metadata) {
      try {
        response.data.metadata = JSON.parse(response.data.metadata);
      } catch (e) {
        console.log("Failed to parse metadata for message: " + response.data.metadata);
      }
    }
    console.log("sendMessage response:");
    console.log(response.data);
    return response.data;
  } catch (error) {
    handleError(error);
    return null;
  }
}

// Increment the time spent interacting with the chatbot
export const incrementTime = async (access_token: string, userId: number, chatbotId: number, prevTimeChatted: number, newTimeChatted: number): Promise<number | null> => {
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
    return null;
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
