import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useInjection } from "inversify-react";
import WalletStore from "../stores/WalletStore";
import useStateRef from "react-usestateref";
import _ from "lodash";
import { toast } from "react-toastify";
import classNames from "classnames";
import { Api } from "../graphql/api";

interface IChatWidgetProps {
    chatId: string;
}

interface Message {
    id: number;
    from: string;
    chatId: string;
    text: string;
}

const ChatWidget = ({ chatId }: IChatWidgetProps) => {
    const walletStore = useInjection(WalletStore);
    const api = useInjection(Api);

    const wsRef = useRef<WebSocket>();
    const chatIdRef = useRef<string>();
    const messageWrapper = useRef<HTMLDivElement>();

    const [ isOpen, setIsOpen ] = useState(false);
    const [ joined, setJoined ] = useState(false);
    const [ messages, setMessages, messagesRef ] = useStateRef<Message[]>([]);
    const [ messageText, setMessageText ] = useState('');
    const [ notificationsEnabled, setNotificationsEnabled ] = useState(true);

    const tabId = useMemo(() => Math.random(), []);

    const sendData = (data: any) => {
        wsRef.current.send(JSON.stringify(data));
    }

    useEffect(() => {
        const onMessage = ({ data }) => {
            data = JSON.parse(data);
            if (data.tabId !== tabId)
                return;
            console.log(data);
            let msgs;
            switch (data.action) {
                case 'connected':
                    if (data.user === walletStore.address && data.userTabId === tabId) {
                        setJoined(true);
                        chatIdRef.current = data.chatId;
                        sendData({ action: 'get_history', chatId: data.chatId });
                    }
                    break;
                case 'disconnected':
                    if (data.chatId === chatIdRef.current && data.user === walletStore.address && data.userTabId === tabId)
                        setJoined(false);
                    break;
                case 'new_messages':
                case 'history_messages':
                    const messageWrapperEl = messageWrapper.current;
                    const needsScroll = messageWrapperEl && (messageWrapperEl.scrollTop === 0 || messageWrapperEl.scrollTop === messageWrapperEl.scrollHeight - messageWrapperEl.clientHeight);
                    const filteredMessages = data.msgs.filter(m => m.chatId === chatIdRef.current);
                    msgs = _.clone(messagesRef.current).concat(filteredMessages);
                    setMessages(_.sortBy(msgs, 'id'));
                    if (data.action === 'new_messages') {
                        let playSound = false;
                        filteredMessages.forEach(m => {
                            if (m.from !== walletStore.address)
                                playSound = true;
                            new Notification('TaleCraft: in-game chat', { body: m.text });
                        });
                        if (playSound)
                            new Audio(require('url:../images/notification.mp3')).play();
                    }
                    if (needsScroll) {
                        setTimeout(() => messageWrapperEl.scrollTo({ left: 0, top: 99999999, behavior: 'smooth' }), 0);
                    }
                    break;
                case 'error':
                    toast.error(data.message);
                    break;
            }
        }

        const reconnect = () => {
            setJoined(false);
            wsRef.current?.removeEventListener('message', onMessage);
            const l = window.location;
            const wsHost = ((l.protocol === "https:") ? "wss://" : "ws://") + l.hostname + ((l.port != '80' && l.port != '443') ? ":" + l.port : "");
            wsRef.current = new WebSocket(`${wsHost}/ws/chat/?_=${Math.random()}`);
            wsRef.current.addEventListener('message', onMessage);
            wsRef.current.onerror = wsRef.current.onclose = () => setTimeout(reconnect, 500);
        }

        reconnect();

        const notificationsEnabled = Notification.permission === 'granted';
        setNotificationsEnabled(notificationsEnabled);
        if (notificationsEnabled)
            Notification.requestPermission();


        return () => {
            wsRef.current.removeEventListener('message', onMessage);
            wsRef.current.onerror = wsRef.current.onclose = undefined;
            wsRef.current.close();
        }
    }, []);

    const onJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        const sig = await walletStore.signMessage(`JoinChat:${chatId}`);
        const token = await api.getChatToken(chatId, sig);
        setMessages([]);
        sendData({ action: 'join_chat', chatId, token, address: walletStore.address, tabId });
    }

    const onLeave = () => {
        sendData({ action: 'leave_chat', chatId });
    }

    const onSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        sendData({ action: 'send_message', chatId, text: messageText });
        setMessageText('');
    }

    return (
        <div className={classNames('chat-widget', { open: isOpen })}>
            <div className="widget-header" onClick={() => setIsOpen(!isOpen)}>Show/hide chat</div>
            <div className="widget-body">
                {!joined ? (
                    <form onSubmit={onJoin}>
                        <button className='btn primary' type='submit'>Join chat</button>
                    </form>
                ) : (
                    <>
                        <div className='chat-buttons'>
                            <button className='btn primary' onClick={onLeave}>Leave chat</button>
                            {!notificationsEnabled && <button className='btn primary' type='button' onClick={async () => {
                                const perm = await Notification.requestPermission();
                                setNotificationsEnabled(perm === 'granted');
                            }}>Enable notifications</button>}
                        </div>

                        <div className="message-list-wrapper" ref={messageWrapper}>
                            <ul className='message-list'>
                                {messages.map(msg => (
                                    <li key={msg.id}>
                                        <span className='author'>{msg.from === walletStore.address ? 'you' : 'rival'}:</span> {msg.text}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <form className='form chat' onSubmit={onSendMessage}>
                            <input className='form__field form__input' placeholder='Message text' value={messageText} onChange={e => setMessageText(e.target.value)} />
                            <button className='btn primary' type='submit'>Send</button>
                        </form>
                    </>
                )}
            </div>
        </div>
    )
};

export default ChatWidget;
