import { v4 as uuidv4 } from 'uuid';

export const getSessionId = () => {
    let sessionId = localStorage.getItem('guest_session_id');
    if (!sessionId) {
        sessionId = uuidv4();
        localStorage.setItem('guest_session_id', sessionId);
    }
    return sessionId;
};
