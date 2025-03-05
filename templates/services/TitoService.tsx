import axios from 'axios';

const ELLE_URL = 'https://chdr.cs.ucf.edu/elleapi';

interface Module {
    moduleID: string;
    name: string;
    language: string;
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

// Utility function for handling errors
export const handleError = (error: unknown): void => {
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