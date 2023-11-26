export type Term = {
    termID: number;
    imageID?: number;
    audioID?: number;
    front?: string;
    back?: string;
    type?: string;
    gender: 'F' | 'M' | 'N';
    language?: string;
}
