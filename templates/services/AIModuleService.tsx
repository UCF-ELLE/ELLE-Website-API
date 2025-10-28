import axios, { AxiosInstance } from 'axios';
import { ApiError } from '@/types/misc';

export interface AIModuleGenerationParams {
    name: string;
    targetLanguage: string;
    nativeLanguage: string;
    numTerms: number;
    groupID?: number;
    complexity?: number;
}

export interface GeneratedModuleContent {
    terms: Array<{
        front: string;
        back: string;
        type: string;
    }>;
    phrases?: Array<{
        front: string;
        back: string;
    }>;
    questions?: Array<{
        text: string;
        answers: string[];
        correctAnswer: number;
    }>;
}

export interface GeneratedModule {
    moduleID: number;
    name: string;
    language: string;
    content: GeneratedModuleContent;
}

export default class AIModuleService {
    protected readonly instance: AxiosInstance;
    
    public constructor() {
        this.instance = axios.create({
            baseURL: 'http://localhost:5050', // Point to Flask backend
        });
    }

    generateModule = async (params: AIModuleGenerationParams, jwt: string) => {
        try {
            const response = await this.instance.post<GeneratedModule>(
                '/elleapi/twt/professor/generateModule',
                params,
                {
                    headers: {
                        'Authorization': `Bearer ${jwt}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            return response.data;
        } catch (err: any) {
            if (err.response?.data) {
                return { error: err.response.data.Error || err.response.data.message || 'Module generation failed' } as ApiError;
            } else {
                return { error: 'Network error during module generation' } as ApiError;
            }
        }
    };

    getGenerationStatus = async (taskId: string, jwt: string) => {
        try {
            const response = await this.instance.get(
                `/elleapi/ai/generation-status/${taskId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${jwt}`
                    }
                }
            );
            return response.data;
        } catch (err: any) {
            return { error: 'Failed to get generation status' } as ApiError;
        }
    };
}