import axios, { AxiosInstance } from 'axios';
import { ApiError } from '@/types/misc';

export interface AIModuleGenerationParams {
    prompt: string;
    termCount: number;
    targetLanguage: string;
    nativeLanguage: string;
}

export interface GeneratedTerm {
    native_word: string;
    target_word: string;
    part_of_speech: string;
    gender: string;
    questionType?: 'MATCH' | 'PHRASE';  // Professor can assign this
}

// Legacy interface for backward compatibility with other components
export interface GeneratedModuleContent {
    terms: Array<{
        front: string;
        back: string;
        type: string;
    }>;
    phrases?: Array<{
        front: string;
        back: string;
        type?: string;
    }>;
}

export interface ModuleCreationData {
    name: string;
    language: string;
    complexity?: number;
    groupID?: number;
}

export interface TermCreationData {
    front: string;
    back: string;
    type: string;
    gender: string;
    language: string;
    moduleID?: number;  // Optional - if provided, auto-attaches term to module
}

export interface AttachTermData {
    moduleID: number;
    termID: number;
    groupID?: number;
}

export interface AddModuleToGroupData {
    moduleID: number;
    groupID: number;
}

export default class AIModuleService {
    protected readonly instance: AxiosInstance;
    
    public constructor() {
        this.instance = axios.create({
            baseURL: 'http://localhost:5050',
        });
    }

    // Generate terms using the existing backend API
    generateTerms = async (params: AIModuleGenerationParams, jwt: string): Promise<GeneratedTerm[] | ApiError> => {
        try {
            const url = `/elleapi/twt/professor/generateModule?` +
                `prompt=${encodeURIComponent(params.prompt)}&` +
                `termCount=${params.termCount}&` +
                `nativeLanguage=${params.nativeLanguage}&` +
                `targetLanguage=${params.targetLanguage}`;

            const response = await this.instance.get(url, {
                headers: {
                    'Authorization': `Bearer ${jwt}`
                }
            });
            
            // The backend returns { success: true/false, message: string, data: [...] }
            // Try different possible response formats
            let terms = null;
            
            if (response.data.data) {
                terms = response.data.data;
            } else if (Array.isArray(response.data)) {
                terms = response.data;
            } else if (response.data.terms) {
                terms = response.data.terms;
            }
            
            if (!terms || !Array.isArray(terms)) {
                return { error: 'No terms returned from API' } as ApiError;
            }
            
            return terms;
        } catch (err: any) {
            if (err.response?.data) {
                return { error: err.response.data.Error || err.response.data.message || 'Term generation failed' } as ApiError;
            } else {
                return { error: 'Network error during term generation' } as ApiError;
            }
        }
    };

    // Create module using existing API
    createModule = async (data: ModuleCreationData, jwt: string): Promise<{moduleID: number} | ApiError> => {
        try {
            const response = await this.instance.post('/elleapi/module', data, {
                headers: {
                    'Authorization': `Bearer ${jwt}`
                }
            });
            return response.data;
        } catch (err: any) {
            return { error: err.response?.data?.message || 'Failed to create module' } as ApiError;
        }
    };

    // Create individual terms
    createTerm = async (data: TermCreationData, jwt: string): Promise<{termID: number} | ApiError> => {
        try {
            const response = await this.instance.post('/elleapi/term', data, {
                headers: {
                    'Authorization': `Bearer ${jwt}`
                }
            });
            return response.data;
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || err.response?.data?.Error || 'Failed to create term';
            return { error: errorMsg } as ApiError;
        }
    };

    // Attach term to module
    attachTerm = async (data: AttachTermData, jwt: string): Promise<any | ApiError> => {
        try {
            const response = await this.instance.post('/elleapi/attachterm', data, {
                headers: {
                    'Authorization': `Bearer ${jwt}`
                }
            });
            return response.data;
        } catch (err: any) {
            return { error: err.response?.data?.message || err.response?.data?.Error || 'Failed to attach term' } as ApiError;
        }
    };

    // Add module to group
    addModuleToGroup = async (data: AddModuleToGroupData, jwt: string): Promise<any | ApiError> => {
        try {
            const response = await this.instance.post('/elleapi/addmoduletogroup', data, {
                headers: {
                    'Authorization': `Bearer ${jwt}`
                }
            });
            return response.data;
        } catch (err: any) {
            return { error: err.response?.data?.message || 'Failed to add module to group' } as ApiError;
        }
    };
}