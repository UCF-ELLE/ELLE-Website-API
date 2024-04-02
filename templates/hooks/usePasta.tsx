import PastaService from '@/services/PastaService';
import { Pasta, QuestionFrame } from '@/types/api/pastagame';
import { createContext, useEffect, useMemo, useState } from 'react';

type PastaHookResponse = {
    message?: string;
    error?: string;
    data?: Pasta | QuestionFrame;
};

// Return everything in the usePasta function
export const PastaContext = createContext<{
    pastas: Pasta[];
    questionFrames: QuestionFrame[];
    createQuestionFrame: (questionFrame: Omit<QuestionFrame, 'qframeID'>) => Promise<PastaHookResponse>;
    createPasta: (pasta: Omit<Pasta, 'pastaID'>) => Promise<PastaHookResponse>;
    editQuestionFrame: (questionFrame: QuestionFrame) => Promise<PastaHookResponse>;
    editPasta: (pasta: Pasta) => Promise<PastaHookResponse>;
    deleteQuestionFrame: (qframeID: number) => Promise<PastaHookResponse>;
    deletePasta: (pastaID: number) => Promise<PastaHookResponse>;
}>({
    pastas: [],
    questionFrames: [],
    createQuestionFrame: async () => ({ error: 'createQuestionFrame not implemented' }),
    createPasta: async () => ({ error: 'createPasta not implemented' }),
    editQuestionFrame: async () => ({ error: 'editQuestionFrame not implemented' }),
    editPasta: async () => ({ error: 'editPasta not implemented' }),
    deleteQuestionFrame: async () => ({ error: 'deleteQuestionFrame not implemented' }),
    deletePasta: async () => ({ error: 'deletePasta not implemented' })
});

export function usePasta(moduleID: number) {
    const _ps = useMemo(() => new PastaService(), []);
    const [pastas, setPastas] = useState<Pasta[]>([]);
    const [questionFrames, setQuestionFrames] = useState<QuestionFrame[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            const _questionFrames = await _ps.getQuestionFrames(moduleID);
            const _pastas = await _ps.getPastas(moduleID);

            if (_questionFrames.data) setQuestionFrames(_questionFrames.data);
            if (_pastas.data) setPastas(_pastas.data);
        };
        fetchData();
    }, [_ps, moduleID]);

    const createQuestionFrame = async (questionFrame: Omit<QuestionFrame, 'qframeID'>): Promise<PastaHookResponse> => {
        const newQuestionFrame = await _ps.createQuestionFrame(questionFrame);
        if (newQuestionFrame.data) {
            setQuestionFrames([...questionFrames, newQuestionFrame.data]);
            return { message: newQuestionFrame.Message, data: newQuestionFrame.data };
        } else {
            return { error: newQuestionFrame.Error, data: undefined };
        }
    };

    const createPasta = async (pasta: Omit<Pasta, 'pastaID'>): Promise<PastaHookResponse> => {
        const newPasta = await _ps.createPasta(pasta);
        if (newPasta.data) {
            setPastas([...pastas, newPasta.data]);
            return { message: newPasta.Message, data: newPasta.data };
        } else {
            return { error: newPasta.Error, data: undefined };
        }
    };

    const editQuestionFrame = async (questionFrame: QuestionFrame): Promise<PastaHookResponse> => {
        const editedQuestionFrame = await _ps.editQuestionFrame(questionFrame);
        if (editedQuestionFrame.data) {
            const newQuestionFrames = questionFrames.map((qf) => (qf.qframeID === questionFrame.qframeID ? editedQuestionFrame.data : qf));
            setQuestionFrames(newQuestionFrames);
            return { message: editedQuestionFrame.Message, data: editedQuestionFrame.data };
        } else {
            return { error: editedQuestionFrame.Error, data: undefined };
        }
    };

    const editPasta = async (pasta: Pasta): Promise<PastaHookResponse> => {
        const editedPasta = await _ps.editPasta(pasta);
        if (editedPasta.data) {
            const newPastas = pastas.map((p) => (p.pastaID === pasta.pastaID ? editedPasta.data : p));
            setPastas(newPastas);
            return { message: editedPasta.Message, data: editedPasta.data };
        } else {
            return { error: editedPasta.Error, data: undefined };
        }
    };

    const deleteQuestionFrame = async (qframeID: number): Promise<PastaHookResponse> => {
        const deletedQuestionFrame = await _ps.deleteQuestionFrame(qframeID);
        if (deletedQuestionFrame.Message) {
            const newQuestionFrames = questionFrames.filter((qf) => qf.qframeID !== qframeID);
            setQuestionFrames(newQuestionFrames);
            return { message: deletedQuestionFrame.Message };
        } else {
            return { error: deletedQuestionFrame.Error };
        }
    };

    const deletePasta = async (pastaID: number): Promise<PastaHookResponse> => {
        const deletedPasta = await _ps.deletePasta(pastaID);
        if (deletedPasta.Message) {
            const newPastas = pastas.filter((p) => p.pastaID !== pastaID);
            setPastas(newPastas);
            return { message: deletedPasta.Message };
        } else {
            return { error: deletedPasta.Error };
        }
    };

    return {
        pastas,
        questionFrames,
        createQuestionFrame,
        createPasta,
        editQuestionFrame,
        editPasta,
        deleteQuestionFrame,
        deletePasta
    };
}
