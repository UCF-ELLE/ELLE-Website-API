import { PermissionGroup } from '@/types/misc';

export type ProfessorRole = 'pf' | 'su';

export function isProfessorRole(permission?: PermissionGroup): boolean {
    return permission === 'pf' || permission === 'su';
}

export function isAdminRole(permission?: PermissionGroup): boolean {
    return permission === 'su';
}

export function hasConsoleAccess(permission?: PermissionGroup): boolean {
    return isProfessorRole(permission) || isAdminRole(permission);
}
