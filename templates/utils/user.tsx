import { PermissionLevels } from "@/app/layout";
import { getUser } from "@/hooks/useAuth";

export const verifyPermission = () => {
    const per = getUser().user?.permission as PermissionLevels || localStorage.getItem('per') as PermissionLevels;
    if (per) {
        return per;
    }
    return undefined;
}
