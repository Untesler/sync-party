import React, { ReactElement, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { Picker } from 'emoji-mart';
import 'emoji-mart/css/emoji-mart.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faComment, faSmile } from '@fortawesome/free-solid-svg-icons';
import ChatHistory from '../ChatHistory/ChatHistory';
import ChatInput from '../ChatInput/ChatInput';

interface Props {
    socket: SocketIOClient.Socket | null;
    setPlayerFocused: Function;
    freezeUiVisible: Function;
}

export default function Chat({
    socket,
    setPlayerFocused,
    freezeUiVisible
}: Props): ReactElement {
    const party = useSelector((state: RootAppState) => state.globalState.party);
    const user = useSelector((state: RootAppState) => state.globalState.user);
    const chat = useSelector((state: RootAppState) => state.globalState.chat);
    const uiVisible = useSelector(
        (state: RootAppState) => state.globalState.uiVisible
    );

    const { t } = useTranslation();

    const [textInput, setTextInput] = useState('');
    const [cursorPosition, setCursorPosition] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [chatHistoryTimeoutDone, setChatHistoryTimeoutDone] = useState(false);

    const chatHistoryRef = useRef<HTMLDivElement | null>(null);
    const textInputRef = useRef<HTMLTextAreaElement | null>(null);

    const scrollHistoryToBottom = (): void => {
        if (chatHistoryRef && chatHistoryRef.current) {
            chatHistoryRef.current.scrollTop =
                chatHistoryRef.current.scrollHeight;
        }
    };

    const sendMessage = (message: string): void => {
        if (socket && user && party && message !== '') {
            const chatMessage = {
                userId: user.id,
                partyId: party.id,
                userName: user.username,
                message: message
            };
            socket.emit('chatMessage', chatMessage);
            setTextInput('');
        }
    };

    const focusTextInput = (): void => {
        if (textInputRef.current) {
            textInputRef.current.focus();
            freezeUiVisible(true);
        }
    };

    const blurTextInput = (): void => {
        if (textInputRef.current) {
            textInputRef.current.blur();
            freezeUiVisible(false);
        }
    };

    const handleInputFieldKeyDown = (event: KeyboardEvent): void => {
        if (event.key === 'Enter') {
            event.preventDefault();
            sendMessage(textInput);
            setShowEmojiPicker(false);
            freezeUiVisible(false);
        } else if (event.key === 'Escape') {
            if (showEmojiPicker) {
                setShowEmojiPicker(false);
                focusTextInput();
            } else {
                setPlayerFocused(true);
                blurTextInput();
            }
        }
    };

    const closeEmojiPicker = (): void => {
        setShowEmojiPicker(false);
        focusTextInput();
    };

    const handleEmojiPickerIconClick = (): void => {
        setShowEmojiPicker(!showEmojiPicker);
        setPlayerFocused(!showEmojiPicker);
        freezeUiVisible(!showEmojiPicker);
        focusTextInput();
    };

    const addEmoji = (emoji: any): void => {
        setPlayerFocused(false);

        if (textInputRef.current) {
            const textInput = textInputRef.current;
            textInput.focus();

            const emojiLength = emoji.native.length;
            const textBeforeCursorPosition = textInput.value.substring(
                0,
                cursorPosition
            );
            const textAfterCursorPosition = textInput.value.substring(
                cursorPosition,
                textInput.value.length
            );

            setTextInput(
                textBeforeCursorPosition +
                    emoji.native +
                    textAfterCursorPosition
            );

            setTimeout(() => {
                textInput.selectionEnd = cursorPosition + emojiLength;
            }, 0.1);
        }
    };

    // At mounting
    useEffect(() => {
        scrollHistoryToBottom();
    }, []);

    // If there is a new message
    useEffect(() => {
        scrollHistoryToBottom();
        setChatHistoryTimeoutDone(false);
        const timeOutId = setTimeout(() => {
            setChatHistoryTimeoutDone(true);
        }, 12000);

        return (): void => {
            clearTimeout(timeOutId);
        };
    }, [chat]);

    return (
        <div
            className={
                'absolute bottom-0 left-0 ml-3 z-50' +
                (uiVisible ? ' mb-12' : ' mb-3')
            }
        >
            {isActive && (
                <div className="flex flex-row">
                    <div className="flex flex-col mt-auto">
                        {(uiVisible || !chatHistoryTimeoutDone) &&
                            party &&
                            user &&
                            chat[party.id] && (
                                <ChatHistory
                                    chatHistoryRef={chatHistoryRef}
                                    chat={chat}
                                    party={party}
                                    userId={user.id}
                                    t={t}
                                ></ChatHistory>
                            )}
                        {uiVisible && (
                            <div className="mt-auto">
                                <ChatInput
                                    textInputRef={textInputRef}
                                    textInput={textInput}
                                    setPlayerFocused={setPlayerFocused}
                                    freezeUiVisible={freezeUiVisible}
                                    handleInputFieldKeyDown={
                                        handleInputFieldKeyDown
                                    }
                                    setTextInput={setTextInput}
                                    setCursorPosition={setCursorPosition}
                                    t={t}
                                ></ChatInput>
                            </div>
                        )}
                    </div>
                    <div className="mt-auto">
                        {showEmojiPicker && uiVisible && (
                            <div
                                className="ml-2 mb-1"
                                onKeyDown={(event): void => {
                                    if (event.key === 'Escape') {
                                        closeEmojiPicker();
                                    }
                                }}
                            >
                                <Picker
                                    native={true}
                                    sheetSize={16}
                                    showPreview={false}
                                    useButton={false}
                                    onSelect={(emoji): void => {
                                        addEmoji(emoji);
                                    }}
                                ></Picker>
                            </div>
                        )}
                        {!showEmojiPicker && uiVisible && (
                            <FontAwesomeIcon
                                icon={faSmile}
                                className="ml-2 cursor-pointer text-2xl mb-1"
                                onClick={handleEmojiPickerIconClick}
                            ></FontAwesomeIcon>
                        )}
                    </div>
                </div>
            )}
            {uiVisible && (
                <FontAwesomeIcon
                    className="cursor-pointer"
                    onClick={(): void => {
                        if (!isActive) {
                            setTimeout(() => {
                                focusTextInput();
                            }, 50);
                        }
                        setIsActive(!isActive);
                    }}
                    opacity={isActive ? 1 : 0.7}
                    icon={faComment}
                    size="lg"
                    title={isActive ? t('chat.close') : t('chat.open')}
                ></FontAwesomeIcon>
            )}
        </div>
    );
}
