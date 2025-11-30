# Professor Console

The Professor Console is a comprehensive management interface for professors and administrators to manage ELLE's Tito (AI chatbot) learning system. It provides tools for managing classes, modules, lore content, and student messages.

## Overview

The Professor Console is accessible at `/prof` and provides a tabbed interface for managing:
- **Overview**: Dashboard with quick stats and actions
- **Classes**: Manage Tito-enabled classes and students
- **Modules**: Assign modules to classes and control access
- **Tito Lore**: Create and manage AI chatbot personality/context content
- **Student Messages**: View and monitor student interactions with Tito

## Access Control

Access to the Professor Console is controlled via Role-Based Access Control (RBAC) defined in `templates/lib/rbac.ts`.

**Permitted Roles:**
- `pf` - Professor
- `su` - Super Admin (Administrator)

Users without these permission groups will be redirected to `/login`.

## Architecture

### File Structure

```
templates/
├── components/ProfessorConsole/
│   ├── ConsoleLayout.tsx    # Layout with sidebar navigation (optional, not currently used)
│   ├── ConsoleTabs.tsx      # Tab navigation component
│   └── README.md            # This file
├── pages/prof/
│   ├── index.tsx            # Overview/Dashboard page
│   ├── classes.tsx          # Classes management page
│   ├── modules.tsx          # Modules management page
│   ├── lore.tsx             # Tito Lore management page
│   └── messages.tsx         # Student Messages page
└── types/
    └── professorConsole.ts  # TypeScript type definitions
```

## Features by Section

### 1. Overview (`/prof`)

**Features:**
- Quick statistics dashboard showing:
  - Total Classes
  - Total Modules  
  - Tito Lore Items
- Quick action buttons:
  - Create Lore
  - Manage Classes
  - View Messages

**API Endpoints Used:**
- `GET /searchusergroups` - Fetch classes
- `GET /retrievemodules` - Fetch modules
- `GET /twt/professor/fetchOwnedTitoLore` - Fetch lore count

### 2. Classes (`/prof/classes`)

**Features:**
- View all classes with Tito status
- Enable/disable Tito for classes
- Manage student enrollment
- Create new classes
- View student count per class

**Key Functionality:**
- **Enable Tito**: Activate the AI chatbot for a class
- **Disable Tito**: Deactivate the AI chatbot
- **Manage Students**: Add/remove students from classes
- **Create Class**: Create new classes with specified names

**API Endpoints Used:**
- `GET /searchusergroups` - Fetch user's classes
- `GET /twt/session/classes?classType=all` - Fetch Tito-enabled classes
- `POST /twt/professor/updateClassStatus` - Toggle Tito status
- `GET /searchusers` - Search for users to add
- `POST /addusertogroup` - Add student to class
- `POST /removeuserfromgroup` - Remove student from class
- `POST /creategroup` - Create new class

**Status Values:**
- `enabled` - Tito is active for this class (maps to backend `active`)
- `disabled` - Tito is inactive (maps to backend `inactive`)
- `archived` - Class is archived (not yet implemented)

### 3. Modules (`/prof/modules`)

**Features:**
- View all modules with their Tito assignments
- Assign modules to Tito classes
- Toggle module active/inactive status
- Remove modules from classes
- See which classes each module is assigned to

**Key Functionality:**
- **Assign to Class**: Add a module to a Tito class with a sequence number
- **Toggle Status**: Activate or deactivate a module for Tito
- **Remove from Class**: Unassign a module from a class
- Modules can be assigned to multiple classes simultaneously

**API Endpoints Used:**
- `GET /retrievemodules` - Fetch all modules
- `GET /twt/session/classes?classType=all` - Fetch Tito classes
- `GET /getgroupmodules?groupID={id}` - Fetch modules for specific class
- `GET /twt/session/access` - Fetch active module status
- `POST /twt/professor/grantAccess` - Assign module to class
- `POST /twt/professor/toggleAccess` - Toggle module active status
- `POST /twt/professor/revokeAccess` - Remove module from class

**Status Values:**
- `draft` - Module is being created
- `published` - Module is available
- `archived` - Module is archived

**Tito Status:**
- Active - Module is accessible to Tito in the class
- Inactive - Module exists in class but Tito can't access it

### 4. Tito Lore (`/prof/lore`)

**Features:**
- Create and edit Tito personality/context content
- Assign lore to class-module combinations
- Search and filter lore items
- Preview lore content
- Remove lore assignments

**Key Functionality:**
- **Create Lore**: Write new personality/context content for Tito (4 sections)
- **Edit Lore**: Update existing lore content
- **Assign Lore**: Link lore to specific class-module combinations
- **Preview**: View how lore will appear to students
- **Search**: Filter lore by content or ID

**Lore Structure:**
Each lore item consists of 4 text sections that are combined:
- Lore Section 1
- Lore Section 2
- Lore Section 3
- Lore Section 4

**API Endpoints Used:**
- `GET /twt/professor/fetchOwnedTitoLore` - Fetch all owned lore
- `POST /twt/professor/createNewTitoLore` - Create new lore
- `POST /twt/professor/updateTitoLore` - Update existing lore
- `POST /twt/professor/assignLore` - Assign lore to class/module
- `POST /twt/professor/removeLoreAssignment` - Remove lore assignment
- `GET /searchusergroups` - Fetch available classes
- `GET /getgroupmodules?groupID={id}` - Fetch modules for class selection

### 5. Student Messages (`/prof/messages`)

**Features:**
- View student messages to Tito
- Filter by class, student, date range
- Mark messages as read/unread
- View message details
- Track unread message count

**Key Functionality:**
- **Search Messages**: Filter by class ID (required), student ID, date range
- **Read/Unread**: Track which messages have been reviewed
- **Message Details**: View full message content and metadata

**API Endpoints Used:**
- `GET /twt/professor/getStudentMessages` - Fetch messages with filters

**Filters Available:**
- Class ID (required)
- Student ID (optional)
- Date From (optional)
- Date To (optional)
- Unread Only (toggle)

**Local Storage:**
Read/unread status is tracked in browser localStorage using message keys.

## Type Definitions

### TitoClass
```typescript
interface TitoClass {
    classID: number;
    name: string;
    status: 'enabled' | 'disabled' | 'archived';
    studentCount: number;
}
```

### ModuleItem
```typescript
interface ModuleItem {
    moduleID: number;
    name: string;
    classID: number | null;
    className?: string;
    status: 'draft' | 'published' | 'archived';
    isTitoEnabled: boolean;
}
```

### TitoLore
```typescript
interface TitoLore {
    loreID: number;
    title: string;
    tags: string[];
    body: string; // Combined from 4 lore sections
    assignments?: Array<{
        classID: number;
        moduleID: number;
    }>;
}
```

### StudentMessage
```typescript
interface StudentMessage {
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
```

### GenerateModuleParams
```typescript
interface GenerateModuleParams {
    classID: number;
    topic: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
}
```

## Components

### ConsoleTabs
Navigation component that renders tabs for all console sections.

**Props:**
- `activeTab`: Current active tab ('overview' | 'classes' | 'modules' | 'lore' | 'messages')

**Usage:**
```tsx
<ConsoleTabs activeTab="overview" />
```

### ConsoleLayout
Alternative layout component with sidebar navigation (not currently in use).

**Props:**
- `children`: Page content
- `activeSection`: Active section identifier

## Authentication

All console pages check for authentication and proper permissions on mount:

```typescript
useEffect(() => {
    if (!loading && !hasConsoleAccess(user?.permissionGroup)) {
        router.push('/login');
    }
}, [user, loading, router]);
```

## API Client

The console uses a centralized API client (`@/lib/apiClient`) that:
- Handles authentication headers
- Provides type-safe requests
- Manages error handling
- Supports GET/POST requests

## Styling

The Professor Console uses:
- **Reactstrap** components (Card, Table, Modal, Button, etc.)
- **Bootstrap 5** utility classes
- Custom CSS for specific layouts

## Known Limitations

1. **Archive Functionality**: Class archiving is not yet implemented in the backend
2. **Class Access**: Superadmins only see classes they're enrolled in (no global class list endpoint)
3. **Student Names**: Student message view shows "Student {ID}" instead of actual names
4. **Tags**: Lore tags are display-only and not stored in the backend
5. **Module Generation**: The `GenerateModuleParams` interface exists but generation feature is not implemented

## Future Enhancements

- Implement bulk operations (assign multiple modules, etc.)
- Add class analytics and reporting
- Improve student name resolution in messages
- Add lore tagging functionality
- Implement module generation from AI
- Add export/import functionality for lore
- Implement real-time message notifications

## Development Notes

- All pages use Next.js 13+ `'use client'` directive
- Pages use the `useUser` hook for authentication
- Error and success messages are displayed via Bootstrap alerts
- Modal components are used for all create/edit operations
- Optimistic UI updates are used where appropriate for better UX

## Backend API Reference

All Tito-related endpoints are prefixed with `/elleapi/twt/`.

**Authentication:**
All requests require a valid JWT token in the Authorization header:
```
Authorization: Bearer {jwt_token}
```

**Common Response Formats:**
- Success responses typically include data in a `data` field
- Error responses return appropriate HTTP status codes
- Some endpoints use FormData for POST requests
- Others use JSON request bodies
