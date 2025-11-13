export interface TitoClass {
    classID: number;
    name: string;
    status: 'enabled' | 'disabled' | 'archived';
    studentCount: number;
}

export interface ModuleItem {
    moduleID: number;
    name: string;
    classID: number | null;
    className?: string;
    status: 'draft' | 'published' | 'archived';
    isTitoEnabled: boolean;
}

export interface TitoLore {
    loreID: number;
    title: string; // Display-only, generated from loreID (e.g., "Lore #123")
    tags: string[]; // Display-only, not stored in backend
    body: string; // Combined text from all 4 lore_text entries
    assignments?: Array<{
        classID: number;
        moduleID: number;
    }>; // All class/module pairs this lore is assigned to
}

export interface StudentMessage {
    messageID: number;
    messageKey: string;
    studentID: number;
    studentName: string;
    classID: number;
    className: string;
    message: string;
    timestamp: string;
    isRead: boolean;
}

export interface GenerateModuleParams {
    classID: number;
    topic: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
}
