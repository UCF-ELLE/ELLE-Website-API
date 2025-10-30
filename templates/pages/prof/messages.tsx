'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useAuth';
import { hasConsoleAccess } from '@/lib/rbac';
import { apiClient } from '@/lib/apiClient';
import { StudentMessage } from '@/types/professorConsole';
import {
    Card,
    CardBody,
    CardTitle,
    Badge,
    FormGroup,
    Label,
    Input,
    Row,
    Col,
} from 'reactstrap';
import ConsoleTabs from '@/components/ProfessorConsole/ConsoleTabs';

export default function MessagesPage() {
    const { user, loading } = useUser();
    const router = useRouter();
    const [messages, setMessages] = useState<StudentMessage[]>([]);
    const [filteredMessages, setFilteredMessages] = useState<StudentMessage[]>([]);
    const [selectedMessage, setSelectedMessage] = useState<StudentMessage | null>(null);
    const [loadingMessages, setLoadingMessages] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [filters, setFilters] = useState({
        classID: '',
        studentID: '',
        startDate: '',
        endDate: '',
        unreadOnly: false,
    });

    useEffect(() => {
        if (!loading && !hasConsoleAccess(user?.permissionGroup)) {
            router.push('/login');
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (hasConsoleAccess(user?.permissionGroup)) {
            fetchMessages();
        }
    }, [user]);

    useEffect(() => {
        applyFilters();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters, messages]);

    const fetchMessages = async () => {
        try {
            setLoadingMessages(true);
            setError(null);
            
            // Use TitoAccess endpoint which returns classes with their Tito modules
            // Returns: [(classID, [(moduleID, sequenceID)])]
            const accessData = await apiClient.get<{ data: any[] }>('/twt/session/access');
            const classModulePairs = accessData.data || [];
            
            if (classModulePairs.length === 0) {
                setMessages([]);
                setLoadingMessages(false);
                return;
            }
            
            // Fetch messages for each class-module pair
            const allMessages: StudentMessage[] = [];
            
            for (const [classID, modules] of classModulePairs) {
                for (const [moduleID, sequenceID] of modules) {
                    try {
                        const messagesData = await apiClient.get<{ data: any[] }>(
                            `/twt/professor/getStudentMessages?classID=${classID}&moduleID=${moduleID}`
                        );
                        
                        // Get read messages from localStorage
                        const readMessages = JSON.parse(localStorage.getItem('readMessages') || '[]');
                        
                        // Transform tuple data to messages
                        // API returns: [userID, chatbotSID, keywordsUsed, grammarScore, source, message, creationTimestamp, isVoiceMessage]
                        const messages = (messagesData.data || [])
                            .filter((m: any) => m[4] === 'user')  // Only show user messages, not LLM messages
                            .map((m: any, idx: number) => {
                                // Create unique message identifier
                                const messageKey = `${classID}-${moduleID}-${m[0]}-${m[6]}`;
                                return {
                                    messageID: idx,
                                    messageKey: messageKey,
                                    studentID: m[0],  // userID
                                    studentName: `Student ${m[0]}`,  // We don't have name in response
                                    classID: classID,
                                    className: `Class ${classID}`,
                                    message: m[5],  // message column
                                    timestamp: m[6] || new Date().toISOString(),  // creationTimestamp
                                    isRead: readMessages.includes(messageKey),
                                };
                            });
                        
                        allMessages.push(...messages);
                    } catch (moduleErr) {
                        console.warn(`Failed to fetch messages for class ${classID}, module ${moduleID}:`, moduleErr);
                    }
                }
            }
            
            setMessages(allMessages);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch messages');
        } finally {
            setLoadingMessages(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...messages];

        if (filters.classID) {
            filtered = filtered.filter((msg) => msg.classID === parseInt(filters.classID));
        }

        if (filters.studentID) {
            filtered = filtered.filter((msg) => msg.studentID === parseInt(filters.studentID));
        }

        if (filters.startDate) {
            filtered = filtered.filter((msg) => new Date(msg.timestamp) >= new Date(filters.startDate));
        }

        if (filters.endDate) {
            filtered = filtered.filter((msg) => new Date(msg.timestamp) <= new Date(filters.endDate));
        }

        if (filters.unreadOnly) {
            filtered = filtered.filter((msg) => !msg.isRead);
        }

        setFilteredMessages(filtered);
    };

    const handleMarkAsRead = (messageID: number) => {
        setMessages((prev) =>
            prev.map((msg) => {
                if (msg.messageID === messageID) {
                    // Save to localStorage
                    const readMessages = JSON.parse(localStorage.getItem('readMessages') || '[]');
                    if (!readMessages.includes(msg.messageKey)) {
                        readMessages.push(msg.messageKey);
                        localStorage.setItem('readMessages', JSON.stringify(readMessages));
                    }
                    return { ...msg, isRead: true };
                }
                return msg;
            })
        );
    };

    const handleSelectMessage = (message: StudentMessage) => {
        setSelectedMessage(message);
        if (!message.isRead) {
            handleMarkAsRead(message.messageID);
        }
    };

    const clearFilters = () => {
        setFilters({
            classID: '',
            studentID: '',
            startDate: '',
            endDate: '',
            unreadOnly: false,
        });
    };

    const unreadCount = messages.filter((msg) => !msg.isRead).length;

    if (loading || !hasConsoleAccess(user?.permissionGroup)) {
        return null;
    }

    return (
        <div className="container-fluid py-4">
            <ConsoleTabs activeTab="messages" />

            <div>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2>Student Messages</h2>
                        {unreadCount > 0 && (
                            <Badge color="danger" pill>
                                {unreadCount} unread
                            </Badge>
                        )}
                    </div>
                    <button className="btn btn-outline-primary" onClick={fetchMessages}>
                        Refresh
                    </button>
                </div>

                {error && (
                    <div className="alert alert-danger alert-dismissible fade show" role="alert">
                        {error}
                        <button type="button" className="btn-close" onClick={() => setError(null)}></button>
                    </div>
                )}

                {/* Filters */}
                <Card className="mb-3">
                    <CardBody>
                        <CardTitle tag="h6">Filters</CardTitle>
                        <Row>
                            <Col md={2}>
                                <FormGroup>
                                    <Label for="classID" className="small">
                                        Class ID
                                    </Label>
                                    <Input
                                        id="classID"
                                        type="number"
                                        bsSize="sm"
                                        value={filters.classID}
                                        onChange={(e) => setFilters({ ...filters, classID: e.target.value })}
                                        placeholder="Any"
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={2}>
                                <FormGroup>
                                    <Label for="studentID" className="small">
                                        Student ID
                                    </Label>
                                    <Input
                                        id="studentID"
                                        type="number"
                                        bsSize="sm"
                                        value={filters.studentID}
                                        onChange={(e) => setFilters({ ...filters, studentID: e.target.value })}
                                        placeholder="Any"
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={2}>
                                <FormGroup>
                                    <Label for="startDate" className="small">
                                        Start Date
                                    </Label>
                                    <Input
                                        id="startDate"
                                        type="date"
                                        bsSize="sm"
                                        value={filters.startDate}
                                        onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={2}>
                                <FormGroup>
                                    <Label for="endDate" className="small">
                                        End Date
                                    </Label>
                                    <Input
                                        id="endDate"
                                        type="date"
                                        bsSize="sm"
                                        value={filters.endDate}
                                        onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={2}>
                                <FormGroup check className="mt-4">
                                    <Label check className="small">
                                        <Input
                                            type="checkbox"
                                            checked={filters.unreadOnly}
                                            onChange={(e) => setFilters({ ...filters, unreadOnly: e.target.checked })}
                                        />{' '}
                                        Unread only
                                    </Label>
                                </FormGroup>
                            </Col>
                            <Col md={2}>
                                <button className="btn btn-sm btn-secondary mt-4 w-100" onClick={clearFilters}>
                                    Clear Filters
                                </button>
                            </Col>
                        </Row>
                    </CardBody>
                </Card>

                {/* Master/Detail Layout */}
                <Row>
                    {/* Message List */}
                    <Col md={5}>
                        <Card style={{ height: '70vh', overflow: 'auto' }}>
                            <CardBody>
                                <CardTitle tag="h6">
                                    Messages ({filteredMessages.length})
                                </CardTitle>
                                {loadingMessages ? (
                                    <div className="text-center py-4">
                                        <div className="spinner-border text-primary" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                    </div>
                                ) : filteredMessages.length === 0 ? (
                                    <p className="text-muted text-center py-4">No messages found.</p>
                                ) : (
                                    <div>
                                        {filteredMessages.map((message) => (
                                            <div
                                                key={message.messageID}
                                                className={`p-3 border-bottom cursor-pointer ${
                                                    selectedMessage?.messageID === message.messageID
                                                        ? 'bg-primary text-white'
                                                        : !message.isRead
                                                        ? 'bg-light'
                                                        : ''
                                                }`}
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => handleSelectMessage(message)}
                                            >
                                                <div className="d-flex justify-content-between align-items-start mb-1">
                                                    <strong className="small">{message.studentName}</strong>
                                                    {!message.isRead && (
                                                        <Badge color="danger" pill className="ms-2">
                                                            New
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="small text-muted">
                                                    {message.className} • {new Date(message.timestamp).toLocaleDateString()}
                                                </div>
                                                <div className="small mt-1" style={{ 
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap'
                                                }}>
                                                    {message.message}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardBody>
                        </Card>
                    </Col>

                    {/* Message Detail */}
                    <Col md={7}>
                        <Card style={{ height: '70vh' }}>
                            <CardBody>
                                {selectedMessage ? (
                                    <>
                                        <div className="border-bottom pb-3 mb-3">
                                            <h5>{selectedMessage.studentName}</h5>
                                            <div className="text-muted small">
                                                <div>Class: {selectedMessage.className}</div>
                                                <div>Student ID: {selectedMessage.studentID}</div>
                                                <div>Class ID: {selectedMessage.classID}</div>
                                                <div>
                                                    Date: {new Date(selectedMessage.timestamp).toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="message-content" style={{ whiteSpace: 'pre-wrap' }}>
                                            {selectedMessage.message}
                                        </div>
                                    </>
                                ) : (
                                    <div className="d-flex justify-content-center align-items-center h-100">
                                        <p className="text-muted">Select a message to view details</p>
                                    </div>
                                )}
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </div>
        </div>
    );
}
