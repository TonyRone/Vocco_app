import { setMessageCount, setNotificationId } from '../actions';
import { SETUSER, SETVOICESTATE, SETSOCKETINSTANCE, SETREFRESHSTATE, SETNOTIFICATIONID, SETMESSAGECOUNT, SETVISIBLEONE, SETFEEDVISIBLEONE } from '../constants';
const initialState = {
    user: null,
    voiceState: 0,
    socketInstance: null,
    refreshState: false,
    notificationId: null,
    messageCount: 0,
    visibleOne: 0,
    feedVisibleOne: 0
};
const userReducer = (state = initialState, action) => {
    switch (action.type) {
        case SETUSER:
            return {
                ...state,
                user: action.payload
            };
        case SETFEEDVISIBLEONE:
            return {
                ...state,
                feedVisibleOne: action.payload
            }
        case SETVISIBLEONE:
            return {
                ...state,
                visibleOne: action.payload
            };
        case SETVOICESTATE:
            return {
                ...state,
                voiceState: action.payload
            };
        case SETSOCKETINSTANCE:
            return {
                ...state,
                socketInstance: action.payload
            };
        case SETREFRESHSTATE:
            return {
                ...state,
                refreshState: action.payload
            };
        case SETNOTIFICATIONID:
            return {
                ...state,
                notificationId: action.payload
            };
        case SETMESSAGECOUNT:
            return {
                ...state,
                messageCount: action.payload
            };
        default:
            return state;
    }
}
export default userReducer;