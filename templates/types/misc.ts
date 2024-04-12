import { Module } from './api/modules';
import languageCode from '@/public/static/json/languageCodes.json';
import { User } from './api/user';
import { UserGroup } from './api/group';

export type EventType = {
    module: Module;
    task?: string;
};

export type LanguageCode = keyof typeof languageCode;

export type Language = {
    label?: string;
    value: LanguageCode | undefined;
};

export type Gender = 'M' | 'F' | 'N';

export type PermissionGroup = 'st' | 'ta' | 'pf' | 'su';

export type ApiError = { error: string };

export type ApiMessage = { Message: string };
