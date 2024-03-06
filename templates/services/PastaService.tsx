import { Pasta, QuestionFrame } from '@/types/api/pastagame';
import axios, { AxiosInstance } from 'axios';
import Cookies from 'js-cookie';

type PastaResponse = {
    Message?: string;
    Error?: string;
    pasta?: Pasta;
};

type QuestionFrameResponse = {
    Message?: string;
    Error?: string;
    question_frame?: QuestionFrame;
};

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
            return res.data;
        } catch (err: any) {
            console.log('error in pastagame/qframe/all: ', err.response);
            return [];
        }
    };

    getQuestionFrame = async (qframeID: number) => {
        try {
            const res = await this.instance.get<QuestionFrame>('/elleapi/pastagame/qframe', {
                params: {
                    qframeID
                }
            });
            return res.data;
        } catch (err: any) {
            console.log('error in pastagame/qframe: ', err.response);
            return undefined;
        }
    };

    createQuestionFrame = async (questionFrame: Omit<QuestionFrame, 'qframeID'>) => {
        try {
            const res = await this.instance.post<QuestionFrameResponse>('/elleapi/pastagame/qframe', questionFrame);
            return res.data.question_frame;
        } catch (err: any) {
            console.log('create question frame error: ', err.response);
            return undefined;
        }
    };

    editQuestionFrame = async (questionFrame: QuestionFrame) => {
        try {
            const res = await this.instance.put<QuestionFrameResponse>(`/elleapi/pastagame/qframe`, questionFrame);
            return res.data.question_frame;
        } catch (err: any) {
            console.log('edit question frame error: ', err.response);
            return undefined;
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
            return res.data.Message;
        } catch (err: any) {
            console.log('delete question frame error: ', err.response);
            return undefined;
        }
    };

    getPastas = async (moduleID: number) => {
        try {
            const res = await this.instance.get<Pasta[]>('/elleapi/pastagame/pasta/all', {
                params: {
                    moduleID
                }
            });
            return res.data;
        } catch (err: any) {
            console.log('error in pastagame/pasta/all: ', err.response);
            return [];
        }
    };

    getPasta = async (pastaID: number) => {
        try {
            const res = await this.instance.get<Pasta>('/elleapi/pastagame/pasta', {
                params: {
                    pastaID
                }
            });
            return res.data;
        } catch (err: any) {
            console.log('error in pastagame/pasta: ', err.response);
            return undefined;
        }
    };

    createPasta = async (pasta: Omit<Pasta, 'pastaID'>) => {
        try {
            const res = await this.instance.post<PastaResponse>('/elleapi/pastagame/pasta', pasta);
            return res.data.pasta;
        } catch (err: any) {
            console.log('create pasta error: ', err.response);
            return undefined;
        }
    };

    editPasta = async (pasta: Pasta) => {
        try {
            const res = await this.instance.put<PastaResponse>(`/elleapi/pastagame/pasta`, pasta);
            return res.data.pasta;
        } catch (err: any) {
            console.log('edit pasta error: ', err.response);
            return undefined;
        }
    };

    deletePasta = async (pastaID: number) => {
        try {
            const res = await this.instance.delete<PastaResponse>(`/elleapi/pastagame/pasta/${pastaID}`);
            return res.data.Message;
        } catch (err: any) {
            console.log('delete pasta error: ', err.response);
            return undefined;
        }
    };
}
