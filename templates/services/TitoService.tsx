import axios from 'axios';

// Function to check if mock helpers are available
// const checkMockAvailable = async () => {
//   try {
//     const mockModule = await import('./TitoMockHelper');
//     console.log('[TitoService] Mock module loaded successfully');
//     console.log('[TitoService] Available mock functions:', Object.keys(mockModule));
//     return mockModule;
//   } catch (error) {
//     console.log('[TitoService] Mock module not available:', error);
//     return null;
//   }
// };

// export const ELLE_URL = 'https://chdr.cs.ucf.edu/elleapi';
//const ELLE_URL = 'http://159.65.232.73/elleapi';
// Connect directly to Flask backend running on port 5050
export const ELLE_URL = 'http://localhost:5050/elleapi';


interface Module {
  moduleID: number;
  name: string;
  language: string;
  isTitoEnabled?: boolean; // Indicates if this module is configured as a Tito module
  classID?: number; // The class this module belongs to (for Tito modules)
}

// Fetches all user modules and indicates which ones are Tito-enabled
// Returns all modules with their ID, name, language, and Tito status
export const fetchModules = async (access_token: string): Promise<Module[] | null> => {
  let titoModuleIDs = new Set<number>();
  let moduleToClassMap = new Map<number, number>(); // Map moduleID to classID
  
  // STEP 1: Try to get Tito-enabled module IDs (for marking purposes)
  try {
  console.log('[fetchModules] Fetching Tito-enabled module IDs...');
    const titoResponse = await axios.get(`${ELLE_URL}/twt/session/access`, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });
    
    const titoData = titoResponse.data.data || [];
    console.log('[fetchModules] Raw Tito modules response:', titoResponse.data);
    console.log('[fetchModules] Processed Tito data:', titoData);
    
    // Extract all unique module IDs that are Tito-enabled and store classID mapping
    for (const [classID, modulesList] of titoData) {
      console.log(`[fetchModules] Class ${classID} has modules:`, modulesList);
      for (const [moduleID, sequenceID] of modulesList) {
        console.log(`[fetchModules] Adding Tito module: ${moduleID} from class ${classID}`);
        titoModuleIDs.add(moduleID);
        moduleToClassMap.set(moduleID, classID); // Store the mapping
      }
    }
    
    console.log('[fetchModules] ✅ Tito-enabled module IDs:', Array.from(titoModuleIDs));
    console.log('[fetchModules] ✅ Module to Class mapping:', Object.fromEntries(moduleToClassMap));
  } catch (titoError) {
    console.warn('[fetchModules] Could not fetch Tito module IDs (will show all modules without Tito status):', titoError);
  }
  
  // STEP 2: Get all user modules from the original endpoint
  try {
    console.log('[fetchModules] Fetching all user modules...');
    const response = await axios.get(`${ELLE_URL}/retrieveusermodules`, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });
    
    const data = response.data.data || response.data || [];
    console.log('[fetchModules] All user modules response:', data);
    
    // Map the response to the expected Module format with Tito status
    const allModules: Module[] = [];
    
    if (Array.isArray(data)) {
      for (const moduleData of data) {
        const moduleID = moduleData.moduleID || moduleData.module_id;
        const isTitoEnabled = titoModuleIDs.has(moduleID);
        const classID = moduleToClassMap.get(moduleID); // Get the classID for this module
        
        allModules.push({
          moduleID: moduleID,
          name: moduleData.name || moduleData.moduleName || moduleData.module_name || `Module ${moduleID}`,
          language: moduleData.language || 'es',
          isTitoEnabled: isTitoEnabled,
          classID: classID // Include classID in module data
        });
      }
    }
    
    const titoEnabledCount = allModules.filter(m => m.isTitoEnabled).length;
    console.log(`[fetchModules] Found ${allModules.length} total modules, ${titoEnabledCount} are Tito-enabled`);
    console.log('[fetchModules] All modules with Tito status:', allModules);
    
    return allModules;
    
  } catch (error) {
    console.warn('[fetchModules] Failed to fetch from retrieveusermodules, trying modules endpoint:', error);
    
    // Fallback: Try the general modules endpoint
    try {
      const modulesResponse = await axios.get(`${ELLE_URL}/modules`, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });
      
      const modulesData = modulesResponse.data || [];
      console.log('[fetchModules] General modules response:', modulesData);
      
      // Map the response to the expected Module format with Tito status
      const allModules: Module[] = [];
      
      if (Array.isArray(modulesData)) {
        for (const moduleData of modulesData) {
          const moduleID = moduleData.moduleID || moduleData.module_id;
          const isTitoEnabled = titoModuleIDs.has(moduleID);
          const classID = moduleToClassMap.get(moduleID); // Get the classID for this module
          
          allModules.push({
            moduleID: moduleID,
            name: moduleData.name || moduleData.moduleName || moduleData.module_name || `Module ${moduleID}`,
            language: moduleData.language || 'es',
            isTitoEnabled: isTitoEnabled,
            classID: classID // Include classID in module data
          });
        }
      }
      
      const titoEnabledCount = allModules.filter(m => m.isTitoEnabled).length;
      console.log(`[fetchModules] Found ${allModules.length} total modules from general endpoint, ${titoEnabledCount} are Tito-enabled`);
      console.log('[fetchModules] All modules with Tito status:', allModules);
      
      return allModules;
      
    } catch (fallbackError) {
      console.error('[fetchModules] Error fetching modules from both endpoints:', fallbackError);
      if (axios.isAxiosError(fallbackError)) {
        console.error('Status:', fallbackError.response?.status);
        console.error('Response Data:', fallbackError.response?.data);
      }
      handleError(fallbackError);
      return null;
    }
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
  // const mockModule = await checkMockAvailable();
  // if (mockModule && mockModule.mockFetchModuleTerms) {
  //   console.log('[TitoService] Using mock fetchModuleTerms');
  //   return await mockModule.mockFetchModuleTerms(access_token, moduleID);
  // }

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
  // const mockModule = await checkMockAvailable();
  // if (mockModule && mockModule.mockGetChatbot) {
  //   console.log('[TitoService] Using mock getChatbot');
  //   return await mockModule.mockGetChatbot(access_token, userId, moduleId, terms);
  // }

  // Use real API
  try {
    console.log(`[getChatbot] Creating session for userId: ${userId}, moduleId: ${moduleId}`);
    console.log({ userId, moduleId, terms });
    
    // Free chat (moduleId -1) doesn't require a class
    const isFreeChat = moduleId === -1;
    let classID: string | null = null;
    
    if (!isFreeChat) {
      // First get available classes to find the right classID for this module
      const accessResponse = await axios.get(`${ELLE_URL}/twt/session/access`, {
        headers: { Authorization: `Bearer ${access_token}` }
      });
      
      const accessData = accessResponse.data.data || [];
      
      // Find the class that contains this module
      for (const [cID, modulesList] of accessData) {
        for (const [mID, sequenceID] of modulesList) {
          if (mID === moduleId) {
            classID = cID.toString();
            break;
          }
        }
        if (classID !== null) break; // Found the class, exit outer loop
      }
      
      // If no classID found, this module isn't assigned to any class for this user
      if (classID === null) {
        console.error(`[getChatbot] Module ${moduleId} is not assigned to any class for this user`);
        return null;
      }
      
      console.log(`[getChatbot] Using classID: ${classID} for moduleID: ${moduleId}`);
    } else {
      console.log(`[getChatbot] Free chat mode - no class required`);
      classID = '0'; // Dummy value for free chat
    }
    
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
    console.log(`[getChatbot] Session creation response for module ${moduleId}:`);
    console.log(response.data);
    
    // Check if the response indicates success
    if (response.data.success === false) {
      const errorMessage = response.data.message || 'Unknown error';
      console.error(`[getChatbot] Session creation failed for module ${moduleId}:`, errorMessage);
      
      // Provide specific error messages for common issues
      if (errorMessage.includes('not configured as a Tito module')) {
        console.error(`[getChatbot] Module ${moduleId} is not configured as a Tito module. Please contact your instructor to enable Tito for this module.`);
      }
      
      return null;
    }
    
    // The session creation endpoint returns { success: true, data: chatbotSID }
    // We need to create a proper response object
    const chatbotSID = response.data.data;
    console.log(`[getChatbot] Extracted chatbotSID: ${chatbotSID} (type: ${typeof chatbotSID})`);
    
    if (typeof chatbotSID === 'number' && chatbotSID > 0) {
      console.log(`[getChatbot] Successfully created session ${chatbotSID} for module ${moduleId}`);
      return {
        chatbotId: chatbotSID,
        termsUsed: [], // No terms used yet in a new session
        totalTimeChatted: 0, // New session starts at 0
        userBackground: undefined,
        userMusicChoice: undefined
      };
    } else {
      console.error(`[getChatbot] Invalid chatbotSID received for module ${moduleId}:`, chatbotSID);
      console.error('Full response:', response.data);
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
export const getMessages = async (access_token: string, userId: number, chatbotId: number, moduleId?: number, classId?: number): Promise<GetMessagesResponse | null> => {
  // First try to use mock if available
  // const mockModule = await checkMockAvailable();
  // if (mockModule && mockModule.mockGetMessages) {
  //   console.log('[TitoService] Using mock getMessages');
  //   return await mockModule.mockGetMessages(access_token, userId, chatbotId);
  // }

  // Use real API
  try {
    // If moduleId is not provided, we need to extract it from chatbot session data
    // For now, we'll need moduleId to be passed from the calling code
    if (!moduleId) {
      console.error('getMessages: moduleId is required but not provided');
      return [];
    }
    
    console.log(`[getMessages] Fetching messages for userId: ${userId}, moduleId: ${moduleId}, classId: ${classId}`);
    
    // Free chat doesn't require classID
    const isFreeChat = moduleId === -1;
    let finalClassId = classId;
    
    if (!isFreeChat && !finalClassId) {
      // Dynamically determine classID if not provided
      const accessResponse = await axios.get(`${ELLE_URL}/twt/session/access`, {
        headers: { Authorization: `Bearer ${access_token}` }
      });
      const accessData = accessResponse.data.data || [];
      for (const [cID, modulesList] of accessData) {
        for (const [mID, sequenceID] of modulesList) {
          if (mID === moduleId) {
            finalClassId = cID;
            break;
          }
        }
        if (finalClassId) break;
      }
      
      // If no classID found, cannot fetch messages
      if (!finalClassId) {
        console.error(`[getMessages] Could not determine classID for module ${moduleId}`);
        return [];
      }
    } else if (isFreeChat && !finalClassId) {
      // For free chat, use dummy classID
      finalClassId = 0;
    }
    
    const response = await axios.get(
      `${ELLE_URL}/twt/session/messages`,
      {
        params: { moduleID: moduleId , classID: finalClassId },
        headers: { Authorization: `Bearer ${access_token}` }
      }
    );
    
    console.log("[getMessages] Raw backend response:");
    console.log(response.data);
    
    const messages = response.data.data || response.data || [];
    
    // Transform backend message format to frontend expected format
    const transformedMessages: ChatMessage[] = [];
    
    if (Array.isArray(messages)) {
      for (const msg of messages) {
        const transformedMessage: ChatMessage = {
          value: msg.message || msg.value || '',
          timestamp: msg.timestamp || new Date().toISOString(),
          source: (msg.source === 'user' || msg.source === 'llm') ? msg.source : 'user',
          metadata: typeof msg.metadata === 'string' ? JSON.parse(msg.metadata) : (msg.metadata || {})
        };
        transformedMessages.push(transformedMessage);
      }
    }
    
    console.log("[getMessages] Transformed messages:");
    console.log(transformedMessages);
    
    return transformedMessages;
  } catch (error) {
    console.error('[getMessages] Error fetching messages:', error);
    if (axios.isAxiosError(error)) {
      console.error('Status:', error.response?.status);
      console.error('Response Data:', error.response?.data);
    }
    handleError(error);
    return [];
  }
};


interface SendMessageResponse {
  llmResponse: string;
  termsUsed: string[];
  titoConfused?: boolean;
  messageID?: number;
  metadata?: {
    score?: number;
    error?: string;
    correction?: string;
    explanation?: string;
  }
}

// sendMessage (POST)
export const sendMessage = async (access_token: string, userId: number, chatbotId: number, moduleId: number, userValue: string, terms: string[], termsUsed: string[], classId?: number, isVoiceMessage?: boolean): Promise<SendMessageResponse | null> => {
  console.log("sendMessage sending:");
  console.log({ userId, chatbotId, moduleId, userValue, terms, termsUsed });
  
  // First try to use mock if available
  // const mockModule = await checkMockAvailable();
  // if (mockModule && mockModule.mockSendMessage) {
  //   console.log('[TitoService] Using mock sendMessage');
  //   const mockResponse = await mockModule.mockSendMessage(access_token, userId, chatbotId, moduleId, userValue, terms, termsUsed);
  //   console.log('[TitoService] Mock response:', mockResponse);
  //   return mockResponse;
  // }

  // Use real API - single attempt with original session
  try {
    // Free chat doesn't require classID
    const isFreeChat = moduleId === -1;
    let finalClassId = classId;
    
    if (!isFreeChat && !finalClassId) {
      // Dynamically determine classID if not provided
      const accessResponse = await axios.get(`${ELLE_URL}/twt/session/access`, {
        headers: { Authorization: `Bearer ${access_token}` }
      });
      const accessData = accessResponse.data.data || [];
      for (const [cID, modulesList] of accessData) {
        for (const [mID, sequenceID] of modulesList) {
          if (mID === moduleId) {
            finalClassId = cID;
            break;
          }
        }
        if (finalClassId) break;
      }
      
      // If no classID found, cannot send message
      if (!finalClassId) {
        console.error(`[sendMessage] Could not determine classID for module ${moduleId}`);
        return {
          llmResponse: "Unable to send message - module is not assigned to a class.",
          termsUsed: [],
          titoConfused: false,
          messageID: undefined,
          metadata: {}
        };
      }
    } else if (isFreeChat && !finalClassId) {
      // For free chat, use dummy classID
      finalClassId = 0;
    }
    
    // Create form data to match backend expectations
    const formData = new FormData();
    formData.append('message', userValue);
    formData.append('chatbotSID', chatbotId.toString());
    formData.append('moduleID', moduleId.toString());
    formData.append('classID', finalClassId?.toString()??"");
    formData.append('isVoiceMessage', isVoiceMessage ? '1' : '0'); // 0 = false (text message), 1 = true (voice message)
    
    console.log(`[SendMessage] Sending with original session ID: ${chatbotId}, classID: ${finalClassId}`);
    
    const response = await axios.post(
      `${ELLE_URL}/twt/session/messages`,
      formData,
      {
        headers: { 
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'multipart/form-data'
        },
        timeout: 65000 // 65 seconds timeout (backend has 60s + buffer)
      }
    );
    
    // Debug: Log the full response structure
    console.log("[DEBUG] Full backend response:");
    console.log(response.data);
    
    // Extract response data (backend wraps in response.data)
    const responseData = response.data;
    const data = responseData.data || responseData;
    
    console.log("[DEBUG] Extracted data:");
    console.log(data);
    
    // Get titoResponse from the top-level response (not nested in data)
    const titoResponse = responseData.titoResponse || data.titoResponse || data.llmResponse;
    console.log("[DEBUG] Extracted titoResponse:");
    console.log(titoResponse);
    
    if(data && data.metadata && typeof data.metadata === "string") {
      try {
        data.metadata = JSON.parse(data.metadata);
      } catch (e) {
        console.log("Failed to parse metadata for message: " + data.metadata);
      }
    }
    
    console.log("sendMessage final processing:");
    console.log({ titoResponse, data });
    
    // Success! Map the response to match expected format
    return {
      llmResponse: titoResponse || "Great job!",
      termsUsed: data.termsUsed || [],
      titoConfused: data.titoConfused || false,
      messageID: responseData.messageID || data.messageID, // Extract messageID from response
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
          messageID: undefined,
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
          messageID: undefined,
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
      messageID: undefined,
      metadata: {}
    };
  }
};

// Increment the time spent interacting with the chatbot
export const incrementTime = async (access_token: string, userId: number, chatbotId: number, prevTimeChatted: number, newTimeChatted: number): Promise<number | null> => {
  // First try to use mock if available
  // const mockModule = await checkMockAvailable();
  // if (mockModule && mockModule.mockIncrementTime) {
  //   console.log('[TitoService] Using mock incrementTime');
  //   return await mockModule.mockIncrementTime(access_token, userId, chatbotId, prevTimeChatted, newTimeChatted);
  // }

  // Use real API - For now, just return success since this endpoint doesn't exist yet
  // TODO: Implement time tracking endpoint in backend if needed
  //console.log("[TitoService] Skipping incrementTime - endpoint not implemented in Tito backend");
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

// exportAudio (GET)
// Downloads all audio files from a conversation as a combined MP3 or ZIP file
export const exportAudio = async (access_token: string, moduleId: number, chatbotId: number, classId: number = 1): Promise<":)" | ":("> => {
  try {
    console.log("[TitoService] Exporting conversation audio for:", { moduleId, chatbotId, classId });
    
    // Call the audio export endpoint
    const response = await axios.get(
      `${ELLE_URL}/twt/session/downloadAllUserAudio`,
      {
        params: { 
          moduleID: moduleId, 
          chatbotSID: chatbotId,
          classID: classId 
        },
        headers: { Authorization: `Bearer ${access_token}` },
        responseType: 'blob' // Important for file downloads
      }
    );
    
    // Create a blob URL and trigger download
    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Determine file extension based on content type
    const contentType = response.headers['content-type'];
    const isZip = contentType && contentType.includes('zip');
    const fileExtension = isZip ? 'zip' : 'mp3';
    const fileName = `conversation_${moduleId}_${chatbotId}_audio.${fileExtension}`;
    
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    console.log(`[TitoService] Audio export successful: ${fileName}`);
    return ":)"; // Success!
    
  } catch (error) {
    console.error("[TitoService] Error exporting audio:", error);
    
    if (axios.isAxiosError(error)) {
      console.error("Status:", error.response?.status);
      console.error("Response Data:", error.response?.data);
      
      // Handle specific error cases
      if (error.response?.status === 404) {
        console.log("[TitoService] No audio files found for this conversation");
      }
    }
    
    return ":("; // Failed
  }
};

// exportModuleAudio (GET)
// Downloads all audio files from all conversations in a module as a combined MP3 or ZIP file
export const exportModuleAudio = async (access_token: string, moduleId: number, classId: number = 1): Promise<":)" | ":("> => {
  try {
    console.log("[TitoService] Exporting module audio for:", { moduleId, classId });
    
    // Call the new simple audio export endpoint (no JWT required)
    const response = await axios.get(
      `${ELLE_URL}/twt/session/downloadAllUserAudio`,
      {
        params: { 
          moduleID: moduleId,
          classID: classId,
          _t: Date.now() // Cache-busting timestamp
        },
        headers: { Authorization: `Bearer ${access_token}` },
        responseType: 'blob' // Important for file downloads
      }
    );
    
    // Create a blob URL and trigger download
    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Determine file extension based on content type
    const contentType = response.headers['content-type'];
    const isZip = contentType && contentType.includes('zip');
    const fileExtension = isZip ? 'zip' : 'mp3';
    const fileName = `module_${moduleId}_all_audio.${fileExtension}`;
    
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    console.log(`[TitoService] Module audio export successful: ${fileName}`);
    return ":)"; // Success!
    
  } catch (error) {
    console.error("[TitoService] Error exporting module audio:", error);
    
    if (axios.isAxiosError(error)) {
      console.error("Status:", error.response?.status);
      console.error("Response Data:", error.response?.data);
      
      // Handle specific error cases
      if (error.response?.status === 404) {
        console.log("[TitoService] No audio files found for this module - this is normal if no voice messages were sent");
      } else if (error.response?.status === 403) {
        console.error("[TitoService] Access denied - user may not have permission to access this module");
      }
    }
    
    // Return failure indicator but don't rethrow
    return ":("; // Failed
  }
};

// uploadAudioFile (POST)
// Uploads an audio file for a specific message after it's been sent
export const uploadAudioFile = async (
  access_token: string, 
  messageID: number, 
  chatbotSID: number, 
  classID: number, 
  moduleID: number, 
  audioBlob: Blob
): Promise<boolean> => {
  try {
    console.log('[TitoService] Uploading audio for message:', { messageID, chatbotSID, classID, moduleID });
    
    // Create form data for the audio upload
    const formData = new FormData();
    formData.append('messageID', messageID.toString());
    formData.append('chatbotSID', chatbotSID.toString());
    formData.append('classID', classID.toString());
    formData.append('moduleID', moduleID.toString());
    formData.append('audio', audioBlob, `${1}_${messageID}.webm`);
    
    const response = await axios.post(
      `${ELLE_URL}/twt/session/audio`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    
    console.log('[TitoService] Audio upload successful:', response.data);
    return true;
    
  } catch (error) {
    console.error('[TitoService] Error uploading audio file:', error);
    if (axios.isAxiosError(error)) {
      console.error('Status:', error.response?.status);
      console.error('Response Data:', error.response?.data);
      
      // Provide specific error messages based on status code
      if (error.response?.status === 403) {
        console.error('[TitoService] Audio upload forbidden - possible invalid message/session');
      } else if (error.response?.status === 400) {
        console.error('[TitoService] Audio upload bad request - missing or invalid parameters');
      } else if (error.response?.status === 500) {
        console.error('[TitoService] Server error during audio upload');
      }
    }
    // Return false to indicate failure, but don't rethrow the error
    return false;
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
