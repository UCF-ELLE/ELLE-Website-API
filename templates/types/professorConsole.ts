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
    title: string;
    tags: string[];
    body: string;
    assignedTo?: {
        classID?: number;
        moduleID?: number;
    };
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
