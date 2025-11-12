'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useAuth';
import { hasConsoleAccess } from '@/lib/rbac';
import { apiClient } from '@/lib/apiClient';
import { TitoClass } from '@/types/professorConsole';
import { Card, CardBody, CardTitle, Table, Badge, Modal, ModalHeader, ModalBody, ModalFooter, Button } from 'reactstrap';
import Select from 'react-select';
import ConsoleTabs from '@/components/ProfessorConsole/ConsoleTabs';

export default function ClassesPage() {
    const { user, loading } = useUser();
    const router = useRouter();
    const [classes, setClasses] = useState<TitoClass[]>([]);
    const [loadingClasses, setLoadingClasses] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [selectedClass, setSelectedClass] = useState<TitoClass | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [actionType, setActionType] = useState<'enable' | 'disable' | 'archive' | null>(null);
    
    // Create Class Modal
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newClassName, setNewClassName] = useState('');
    const [creating, setCreating] = useState(false);
    
    // Manage Students Modal
    const [showStudentsModal, setShowStudentsModal] = useState(false);
    const [students, setStudents] = useState<any[]>([]);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [newStudentId, setNewStudentId] = useState('');
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [selectedUser, setSelectedUser] = useState<{ value: number; label: string } | null>(null);

    useEffect(() => {
        if (!loading && !hasConsoleAccess(user?.permissionGroup)) {
            router.push('/login');
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (hasConsoleAccess(user?.permissionGroup)) {
            fetchClasses();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const fetchClasses = async () => {
        try {
            setLoadingClasses(true);
            setError(null);
            
            // Get Tito classes with their status from backend
            let titoClassesMap = new Map<number, string>();
            try {
                const titoData = await apiClient.get<{ data: Array<{ classID: number; status: string }> }>('/twt/session/classes?classType=all');
                const titoClasses = titoData.data || [];
                // Create a map of classID -> status (backend uses 'active'/'inactive')
                titoClasses.forEach((tc: { classID: number; status: string }) => {
                    titoClassesMap.set(tc.classID, tc.status);
                });
            } catch (err) {
                console.log('No Tito classes or error fetching:', err);
            }
            
            // Get classes from searchusergroups (returns only classes user is in)
            const userGroupsData = await apiClient.get<any>('/searchusergroups');
            const userGroups = Array.isArray(userGroupsData) ? userGroupsData : [];
            
            // WORKAROUND: Since there's no endpoint to get ALL classes, and superadmins
            // aren't automatically in all classes, we'll just show the classes they're in
            // plus a message about how to access other classes
            const transformedClasses: TitoClass[] = userGroups.map((g: any) => {
                const titoStatus = titoClassesMap.get(g.groupID);
                return {
                    classID: g.groupID,
                    name: g.groupName || `Class ${g.groupID}`,
                    // Map backend status ('active'/'inactive') to frontend status ('enabled'/'disabled')
                    status: titoStatus === 'active' ? 'enabled' : titoStatus === 'inactive' ? 'disabled' : 'disabled',
                    studentCount: (g.group_users || []).filter((u: any) => u.accessLevel === 'st').length,
                };
            });
            
            // Add any Tito classes not in the user's enrolled classes
            titoClassesMap.forEach((status, classId) => {
                if (!transformedClasses.find(c => c.classID === classId)) {
                    transformedClasses.push({
                        classID: classId,
                        name: `Class ${classId}`,
                        status: status === 'active' ? 'enabled' : 'disabled',
                        studentCount: 0,
                    });
                }
            });
            
            setClasses(transformedClasses);
            
            // Show helpful message if few classes
            if (transformedClasses.length < 5 && user?.permissionGroup === 'su') {
                console.log('Note: Only showing classes you are enrolled in. To manage other classes, join them using their class code.');
            }
        } catch (err) {
            console.error('Fetch classes error:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch classes');
        } finally {
            setLoadingClasses(false);
        }
    };

    const handleEnableTito = async (classItem: TitoClass) => {
        try {
            // Optimistic update
            setClasses((prev) =>
                prev.map((c) =>
                    c.classID === classItem.classID
                        ? { ...c, status: 'enabled' }
                        : c
                )
            );
            
            const formData = new FormData();
            formData.append('classID', classItem.classID.toString());
            
            await fetch('/elleapi/twt/professor/updateClassStatus', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${user?.jwt}`,
                },
                body: formData,
            });
            
            setSuccess(`Tito enabled for ${classItem.name}!`);
            fetchClasses();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to enable Tito');
            // Revert optimistic update on error
            fetchClasses();
        }
    };
    
    const handleStatusChange = async (classItem: TitoClass, action: 'enable' | 'disable' | 'archive') => {
        setSelectedClass(classItem);
        setActionType(action);
        setShowModal(true);
    };

    const confirmStatusChange = async () => {
        if (!selectedClass || !actionType) return;

        try {
            // Archive is not supported yet - show error
            if (actionType === 'archive') {
                setError('Archive functionality is not yet implemented');
                setShowModal(false);
                return;
            }

            // Backend toggles between 'active' and 'inactive'
            // Only call API if the desired state differs from current state
            const currentlyEnabled = selectedClass.status === 'enabled';
            const shouldBeEnabled = actionType === 'enable';
            
            if (currentlyEnabled === shouldBeEnabled) {
                // Already in desired state - no need to call API
                setSuccess(`Class is already ${actionType}d`);
                setShowModal(false);
                setSelectedClass(null);
                setActionType(null);
                return;
            }

            // Optimistic update
            setClasses((prev) =>
                prev.map((c) =>
                    c.classID === selectedClass.classID
                        ? { ...c, status: shouldBeEnabled ? 'enabled' : 'disabled' }
                        : c
                )
            );

            const formData = new FormData();
            formData.append('classID', selectedClass.classID.toString());
            
            const response = await fetch('/elleapi/twt/professor/updateClassStatus', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${user?.jwt}`,
                },
                body: formData,
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to update status: ${errorText}`);
            }

            setSuccess(`Class ${actionType}d successfully!`);
            setShowModal(false);
            setSelectedClass(null);
            setActionType(null);
            
            // Wait a moment then refresh to get actual backend state
            setTimeout(() => fetchClasses(), 500);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update class status');
            // Revert optimistic update
            fetchClasses();
        }
    };
    
    const handleCreateClass = async () => {
        if (!newClassName.trim()) {
            setError('Please enter a class name');
            return;
        }
        
        try {
            setCreating(true);
            setError(null);
            
            // Create the class
            await apiClient.post('/group', { groupName: newClassName });
            
            setSuccess('Class created successfully!');
            setShowCreateModal(false);
            setNewClassName('');
            fetchClasses();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create class');
        } finally {
            setCreating(false);
        }
    };
    
    const handleManageStudents = async (classItem: TitoClass) => {
        setSelectedClass(classItem);
        setShowStudentsModal(true);
        await Promise.all([fetchStudents(classItem.classID), fetchAllUsers()]);
    };
    
    const fetchAllUsers = async () => {
        try {
            const usersData = await apiClient.get<any[]>('/users');
            const users = Array.isArray(usersData) ? usersData : [];
            setAllUsers(users);
        } catch (err) {
            console.error('Failed to fetch all users:', err);
            setAllUsers([]);
        }
    };
    
    const fetchStudents = async (classID: number) => {
        try {
            setLoadingStudents(true);
            const data = await apiClient.get<any>(`/usersingroup?groupID=${classID}`);
            console.log('Students response:', data);
            // The backend returns the array directly or wrapped in various ways
            const studentsList = Array.isArray(data) ? data : (data.users || data.data || []);
            setStudents(studentsList);
        } catch (err) {
            console.error('Failed to fetch students:', err);
            setStudents([]);
        } finally {
            setLoadingStudents(false);
        }
    };
    
    const handleAddStudent = async () => {
        if (!selectedUser && !newStudentId.trim()) {
            setError('Please select or enter a student ID');
            return;
        }
        
        if (!selectedClass) return;
        
        try {
            setError(null);
            
            const userId = selectedUser ? selectedUser.value : parseInt(newStudentId);
            
            // Add student to class using usersingroup endpoint
            await apiClient.post('/usersingroup', {
                userID: userId,
                groupID: selectedClass.classID,
                accessLevel: 'st',
            });
            
            setSuccess('Student added successfully!');
            setNewStudentId('');
            setSelectedUser(null);
            await fetchStudents(selectedClass.classID);
            // Refresh the classes list to update student count
            fetchClasses();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to add student. Make sure the user ID is valid.');
        }
    };
    
    const handleRemoveStudent = async (studentId: number) => {
        if (!selectedClass || !confirm('Are you sure you want to remove this student?')) return;
        
        try {
            setError(null);
            
            // Remove student by deleting from group_user
            await apiClient.delete(`/usersingroup?groupID=${selectedClass.classID}&userID=${studentId}`);
            
            setSuccess('Student removed successfully!');
            await fetchStudents(selectedClass.classID);
            // Refresh the classes list to update student count
            fetchClasses();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to remove student');
        }
    };

    if (loading || !hasConsoleAccess(user?.permissionGroup)) {
        return null;
    }

    return (
        <div className="container-fluid py-4">
            <ConsoleTabs activeTab="classes" />

            <div>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2>Classes Management</h2>
                    <div className="d-flex gap-2">
                        <button className="btn btn-success" onClick={() => setShowCreateModal(true)}>
                            Create New Class
                        </button>
                        <button className="btn btn-outline-primary" onClick={fetchClasses}>
                            Refresh
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="alert alert-danger alert-dismissible fade show" role="alert">
                        {error}
                        <button type="button" className="btn-close" onClick={() => setError(null)}></button>
                    </div>
                )}
                
                {success && (
                    <div className="alert alert-success alert-dismissible fade show" role="alert">
                        {success}
                        <button type="button" className="btn-close" onClick={() => setSuccess(null)}></button>
                    </div>
                )}

                <Card>
                    <CardBody>
                        <CardTitle tag="h5">All Classes</CardTitle>
                        {loadingClasses ? (
                            <div className="text-center py-4">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                            </div>
                        ) : classes.length === 0 ? (
                            <p className="text-muted text-center py-4">No classes found.</p>
                        ) : (
                            <Table hover responsive>
                                <thead>
                                    <tr>
                                        <th>Class ID</th>
                                        <th>Name</th>
                                        <th>Status</th>
                                        <th>Students</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {classes.map((classItem) => (
                                        <tr key={classItem.classID}>
                                            <td>{classItem.classID}</td>
                                            <td>{classItem.name}</td>
                                            <td>
                                                <Badge
                                                    color={
                                                        classItem.status === 'enabled'
                                                            ? 'success'
                                                            : classItem.status === 'disabled'
                                                            ? 'warning'
                                                            : 'secondary'
                                                    }
                                                >
                                                    {classItem.status}
                                                </Badge>
                                            </td>
                                            <td>{classItem.studentCount}</td>
                                            <td>
                                                <div className="btn-group btn-group-sm">
                                                    <button
                                                        className="btn btn-info"
                                                        onClick={() => handleManageStudents(classItem)}
                                                    >
                                                        Manage Students
                                                    </button>
                                                    {classItem.status === 'disabled' ? (
                                                        <button
                                                            className="btn btn-success"
                                                            onClick={() => handleEnableTito(classItem)}
                                                        >
                                                            Enable Tito
                                                        </button>
                                                    ) : (
                                                        <button
                                                            className="btn btn-warning"
                                                            onClick={() => handleStatusChange(classItem, 'disable')}
                                                        >
                                                            Disable Tito
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        )}
                    </CardBody>
                </Card>
            </div>

            {/* Confirmation Modal */}
            <Modal isOpen={showModal} toggle={() => setShowModal(false)}>
                <ModalHeader toggle={() => setShowModal(false)}>Confirm Action</ModalHeader>
                <ModalBody>
                    Are you sure you want to {actionType} the class &quot;{selectedClass?.name}&quot;?
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={() => setShowModal(false)}>
                        Cancel
                    </Button>
                    <Button color="primary" onClick={confirmStatusChange}>
                        Confirm
                    </Button>
                </ModalFooter>
            </Modal>
            
            {/* Create Class Modal */}
            <Modal isOpen={showCreateModal} toggle={() => setShowCreateModal(false)}>
                <ModalHeader toggle={() => setShowCreateModal(false)}>Create New Class</ModalHeader>
                <ModalBody>
                    <div className="mb-3">
                        <label htmlFor="className" className="form-label">
                            Class Name *
                        </label>
                        <input
                            type="text"
                            className="form-control"
                            id="className"
                            value={newClassName}
                            onChange={(e) => setNewClassName(e.target.value)}
                            placeholder="e.g., Spanish 101 - Fall 2025"
                        />
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={() => setShowCreateModal(false)} disabled={creating}>
                        Cancel
                    </Button>
                    <Button color="primary" onClick={handleCreateClass} disabled={creating}>
                        {creating ? 'Creating...' : 'Create Class'}
                    </Button>
                </ModalFooter>
            </Modal>
            
            {/* Manage Students Modal */}
            <Modal isOpen={showStudentsModal} toggle={() => setShowStudentsModal(false)} size="lg">
                <ModalHeader toggle={() => setShowStudentsModal(false)}>
                    Manage Students - {selectedClass?.name}
                </ModalHeader>
                <ModalBody>
                    {/* Add Student Section */}
                    <div className="mb-4 p-3 border rounded">
                        <h6 className="mb-3">Add Student</h6>
                        <div className="mb-3">
                            <label className="form-label small">Search by Name or ID</label>
                            <Select
                                options={allUsers
                                    .filter(u => u.permissionGroup === 'st') // Only show students
                                    .map(u => ({
                                        value: u.userID,
                                        label: `${u.username} (ID: ${u.userID})`
                                    }))}
                                value={selectedUser}
                                onChange={setSelectedUser}
                                isClearable
                                placeholder="Search for a student..."
                                className="mb-2"
                            />
                        </div>
                        <div className="text-center text-muted small mb-2">OR</div>
                        <div className="d-flex gap-2">
                            <input
                                type="number"
                                className="form-control"
                                placeholder="Enter User ID directly"
                                value={newStudentId}
                                onChange={(e) => setNewStudentId(e.target.value)}
                            />
                            <Button color="primary" onClick={handleAddStudent} disabled={!selectedUser && !newStudentId.trim()}>
                                Add
                            </Button>
                        </div>
                    </div>
                    
                    {/* Current Students List */}
                    <h6 className="mb-3">Current Students</h6>
                    {loadingStudents ? (
                        <div className="text-center py-3">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading...</span>
                            </div>
                        </div>
                    ) : students.length === 0 ? (
                        <p className="text-muted text-center py-3">No students in this class yet.</p>
                    ) : (
                        <Table size="sm" hover>
                            <thead>
                                <tr>
                                    <th>User ID</th>
                                    <th>Username</th>
                                    <th>Role</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((student: any) => (
                                    <tr key={student.userID}>
                                        <td>{student.userID}</td>
                                        <td>{student.username}</td>
                                        <td>
                                            <Badge color={student.accessLevel === 'pf' ? 'primary' : student.accessLevel === 'ta' ? 'info' : 'secondary'}>
                                                {student.accessLevel === 'pf' ? 'Professor' : student.accessLevel === 'ta' ? 'TA' : 'Student'}
                                            </Badge>
                                        </td>
                                        <td>
                                            {student.accessLevel === 'st' && (
                                                <button
                                                    className="btn btn-sm btn-danger"
                                                    onClick={() => handleRemoveStudent(student.userID)}
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={() => setShowStudentsModal(false)}>
                        Close
                    </Button>
                </ModalFooter>
            </Modal>
        </div>
    );
}
