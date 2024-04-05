import { Pasta, QuestionFrame } from '@/types/api/pastagame';
import axios, { AxiosInstance } from 'axios';
import Cookies from 'js-cookie';

type DataType = undefined | Pasta | Pasta[] | QuestionFrame | QuestionFrame[];

interface PastaServiceResponse<T extends DataType> {
    Message?: string;
    Error?: string;
    data: T;
}

type QuestionFrameResponse = {
    Message?: string;
    Error?: string;
    question_frame?: QuestionFrame;
};

type PastaResponse = {
    Message?: string;
    Error?: string;
    pasta?: Pasta;
};

function ensureError(error: unknown): Error {
    if (error instanceof Error) {
        return error;
    }
    let stringified = '[Unable to stringify the error]';
    try {
        stringified = JSON.stringify(error);
    } catch {}

    const newError = new Error(`Unknown error: ${stringified}`);
    return newError;
}

export default class PastaService {
    protected readonly instance: AxiosInstance;
    public constructor() {
        const userString = Cookies.get('currentUser');
        if (!userString) {
            throw new Error('User not logged in');
        }
        const user = JSON.parse(userString);
        this.instance = axios.create({
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${user.jwt}`
            }
        });
    }

    getQuestionFrames = async (moduleID: number) => {
        try {
            const res = await this.instance.get<QuestionFrame[]>('/elleapi/pastagame/qframe/all', {
                params: {
                    moduleID
                }
            });
            return { Message: 'Success', data: res.data } as PastaServiceResponse<QuestionFrame[]>;
        } catch (err) {
            const error = ensureError(err);
            console.log('error in pastagame/qframe/all: ', error.message);
            return { Error: error.message, data: undefined } as PastaServiceResponse<undefined>;
        }
    };

    getQuestionFrame = async (qframeID: number) => {
        try {
            const res = await this.instance.get<QuestionFrame>('/elleapi/pastagame/qframe', {
                params: {
                    qframeID
                }
            });
            return { Message: 'Success', data: res.data } as PastaServiceResponse<QuestionFrame>;
        } catch (err) {
            const error = ensureError(err);
            console.log('error in pastagame/qframe: ', error.message);
            return { Error: error.message, data: undefined } as PastaServiceResponse<undefined>;
        }
    };

    createQuestionFrame = async (questionFrame: Omit<QuestionFrame, 'qframeID'>) => {
        try {
            const res = await this.instance.post<QuestionFrameResponse>('/elleapi/pastagame/qframe', questionFrame);
            return { Message: 'Success', data: res.data.question_frame } as PastaServiceResponse<QuestionFrame>;
        } catch (err) {
            const error = ensureError(err);
            console.log('create question frame error: ', error.message);
            return { Error: error.message, data: undefined } as PastaServiceResponse<undefined>;
        }
    };

    editQuestionFrame = async (questionFrame: QuestionFrame) => {
        try {
            const res = await this.instance.put<QuestionFrameResponse>(`/elleapi/pastagame/qframe`, questionFrame);
            return { Message: 'Success', data: res.data.question_frame } as PastaServiceResponse<QuestionFrame>;
        } catch (err) {
            const error = ensureError(err);
            console.log('edit question frame error: ', error.message);
            return { Error: error.message, data: undefined } as PastaServiceResponse<undefined>;
        }
    };

    deleteQuestionFrame = async (qframeID: number) => {
        const config = {
            data: {
                qframeID
            }
        };
        try {
            const res = await this.instance.delete<QuestionFrameResponse>(`/elleapi/pastagame/qframe`, config);
            return { Message: res.data.Message } as PastaServiceResponse<QuestionFrame>;
        } catch (err) {
            const error = ensureError(err);
            console.log('delete question frame error: ', error.message);
            return { Error: error.message } as PastaServiceResponse<undefined>;
        }
    };

    getPastas = async (moduleID: number) => {
        try {
            const res = await this.instance.get<Pasta[]>('/elleapi/pastagame/pasta/all', {
                params: {
                    moduleID
                }
            });
            return { Message: 'Success', data: res.data } as PastaServiceResponse<Pasta[]>;
        } catch (err) {
            const error = ensureError(err);
            console.log('error in pastagame/pasta/all: ', error.message);
            return { Error: error.message, data: undefined } as PastaServiceResponse<undefined>;
        }
    };

    getPasta = async (pastaID: number) => {
        try {
            const res = await this.instance.get<Pasta>('/elleapi/pastagame/pasta', {
                params: {
                    pastaID
                }
            });
            return { Message: 'Success', data: res.data } as PastaServiceResponse<Pasta>;
        } catch (err) {
            const error = ensureError(err);
            console.log('error in pastagame/pasta: ', error.message);
            return { Error: error.message, data: undefined } as PastaServiceResponse<undefined>;
        }
    };

    createPasta = async (pasta: Omit<Pasta, 'pastaID'>) => {
        try {
            const res = await this.instance.post<PastaResponse>('/elleapi/pastagame/pasta', pasta);
            return { Message: 'Success', data: res.data.pasta } as PastaServiceResponse<undefined>;
        } catch (err) {
            const error = ensureError(err);
            console.log('create pasta error: ', error.message);
            return { Error: error.message, data: undefined } as PastaServiceResponse<undefined>;
        }
    };

    editPasta = async (pasta: Pasta) => {
        try {
            const res = await this.instance.put<PastaResponse>(`/elleapi/pastagame/pasta`, pasta);
            return { Message: 'Success', data: res.data.pasta } as PastaServiceResponse<Pasta>;
        } catch (err) {
            const error = ensureError(err);
            console.log('edit pasta error: ', error.message);
            return { Error: error.message, data: undefined } as PastaServiceResponse<undefined>;
        }
    };

    deletePasta = async (pastaID: number) => {
        const config = {
            data: {
                pastaID
            }
        };

        try {
            const res = await this.instance.delete<PastaResponse>(`/elleapi/pastagame/pasta`, config);
            return { Message: 'Success', data: res.data.pasta } as PastaServiceResponse<Pasta>;
        } catch (err) {
            const error = ensureError(err);
            console.log('delete pasta error: ', error.message);
            return { Error: error.message, data: undefined } as PastaServiceResponse<undefined>;
        }
    };
}
