import PastaService from '@/services/PastaService';
import { Pasta, QuestionFrame } from '@/types/api/pastagame';
import { createContext, useEffect, useMemo, useState } from 'react';

// Return everything in the usePasta function
export const PastaContext = createContext<{
    pastas: Pasta[];
    questionFrames: QuestionFrame[];
    createQuestionFrame: (questionFrame: Omit<QuestionFrame, 'qframeID'>) => void;
    createPasta: (pasta: Omit<Pasta, 'pastaID'>) => void;
    editQuestionFrame: (questionFrame: QuestionFrame) => void;
    editPasta: (pasta: Pasta) => void;
    deleteQuestionFrame: (qframeID: number) => void;
    deletePasta: (pastaID: number) => void;
}>({
    pastas: [],
    questionFrames: [],
    createQuestionFrame: () => {},
    createPasta: () => {},
    editQuestionFrame: () => {},
    editPasta: () => {},
    deleteQuestionFrame: () => {},
    deletePasta: () => {}
});

export const usePasta = (moduleID: number) => {
    const _ps = useMemo(() => new PastaService(), []);
    const [pastas, setPastas] = useState<Pasta[]>([]);
    const [questionFrames, setQuestionFrames] = useState<QuestionFrame[]>([]);

    useEffect(() => {
        console.log(_ps, moduleID);
        const fetchData = async () => {
            const _questionFrames = await _ps.getQuestionFrames(moduleID);
            const _pastas = await _ps.getPastas(moduleID);
            setQuestionFrames(_questionFrames);
            setPastas(_pastas);
        };
        fetchData();
    }, [_ps, moduleID]);

    const createQuestionFrame = async (questionFrame: Omit<QuestionFrame, 'qframeID'>) => {
        const newQuestionFrame = await _ps.createQuestionFrame(questionFrame);
        if (newQuestionFrame) setQuestionFrames([...questionFrames, newQuestionFrame]);
    };

    const createPasta = async (pasta: Omit<Pasta, 'pastaID'>) => {
        const newPasta = await _ps.createPasta(pasta);
        if (newPasta) setPastas([...pastas, newPasta]);
    };

    const editQuestionFrame = async (questionFrame: QuestionFrame) => {
        const editedQuestionFrame = await _ps.editQuestionFrame(questionFrame);
        if (editedQuestionFrame) {
            const newQuestionFrames = questionFrames.map((qf) => (qf.qframeID === questionFrame.qframeID ? editedQuestionFrame : qf));
            setQuestionFrames(newQuestionFrames);
        }
    };

    const editPasta = async (pasta: Pasta) => {
        const editedPasta = await _ps.editPasta(pasta);
        if (editedPasta) {
            const newPastas = pastas.map((p) => (p.pastaID === pasta.pastaID ? editedPasta : p));
            setPastas(newPastas);
        }
    };

    const deleteQuestionFrame = async (qframeID: number) => {
        const deletedQuestionFrame = await _ps.deleteQuestionFrame(qframeID);
        if (deletedQuestionFrame) {
            const newQuestionFrames = questionFrames.filter((qf) => qf.qframeID !== qframeID);
            setQuestionFrames(newQuestionFrames);
        }
    };

    const deletePasta = async (pastaID: number) => {
        const deletedPasta = await _ps.deletePasta(pastaID);
        if (deletedPasta) {
            const newPastas = pastas.filter((p) => p.pastaID !== pastaID);
            setPastas(newPastas);
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
};
