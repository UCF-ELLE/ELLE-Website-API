import axios from 'axios';

const ELLE_URL = 'https://chdr.cs.ucf.edu/elleapi';

interface Module {
    moduleID: number;
    name: String;
    language: String;
}

// Fetches a user's modules given their JWT
// Returns all modules' ID, name, and language
export const fetchModules = async (access_token: string): Promise<Module[]> => {
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
    return [];
  }
};

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
export const fetchModuleTerms = async (access_token: string, moduleID: number): Promise<Term[]> => {
  try {
      const response = await axios.post<APITerm[]>(`${ELLE_URL}/modulequestions`, { moduleID }, {
          headers: {
              Authorization: `Bearer ${access_token}`,
          },
      });

      return response.data.map(term => ({
          termID: term.answers[0]?.termID,
          questionFront: term.answers[0]?.front,
          questionBack: term.answers[0]?.back,
      }));
  } catch (error) {
      handleError(error);
      return [];
  }
};

// Utility function for handling errors
const handleError = (error: unknown): void => {
    if (axios.isAxiosError(error)) {
      console.error("Axios Error:", error.response?.data || error.message);
    } 
    else if (error instanceof Error) {
      console.error("General Error:", error.message);
    } 
    else {
      console.error("Unknown Error:", error);
    }
};