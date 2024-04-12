// Technically the only thing that is returned from the API is the saveData.
// However, the DB also stores the save ID and user ID, so we'll include those for now.

import { DBAnimelleSaveData } from './db';

// For use in GET /elleapi/animellesavedata
export type AnimelleSaveData = Partial<DBAnimelleSaveData>;
