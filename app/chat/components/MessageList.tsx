import React, { useEffect, useRef, useState } from "react";
import { ChatMessage } from "../page";



interface MessageListProps {
  messages: ChatMessage[];
  handleScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  setReplyToMessage: (message: ChatMessage | null) => void;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  handleScroll,
  messagesEndRef,
  setReplyToMessage,
}) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const isUserAtBottom = useRef(true);
  const [showScrollDownButton, setShowScrollDownButton] = useState(false);
  const messageRefs = useRef<{ [key: string]: HTMLLIElement | null }>({});

    const customHandleScroll = (e: React.UIEvent<HTMLDivElement>) => {
      if (scrollContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } =
          scrollContainerRef.current;
        isUserAtBottom.current = scrollTop + clientHeight >= scrollHeight - 10;
        setShowScrollDownButton(!isUserAtBottom.current);
      }
      handleScroll(e);
    };

    const scrollToBottom = () => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
  };

  const scrollToMessage = (messageId: string) => {
    const messageElement = messageRefs.current[messageId];
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: "smooth", block: "center" });
      messageElement.classList.add("highlight");
      setTimeout(() => {
        messageElement.classList.remove("highlight");
      }, 2000);
    }
  };

    useEffect(() => {
      if (isUserAtBottom.current && messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, [messages, messagesEndRef]);
  
  console.log(messages);
    return (
      <div
        className="relative flex-1 overflow-y-auto min-w-0"
        ref={scrollContainerRef}
        onScroll={customHandleScroll}
      >
        <ul>
          {messages.map((message) => (
            <li
              key={message.id}
              className="p-2 hover:bg-gray-50 rounded-xl"
              ref={(el) => (messageRefs.current[message.id] = el)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <strong>{message.sender}</strong>
                  <span className="text-xs text-gray-500 ml-2">
                    {new Date(message.createdAt).toLocaleString()}
                  </span>
                </div>
                <button
                  className="text-xs text-blue-500"
                  onClick={() => setReplyToMessage(message)}
                >
                  Reply
                </button>
              </div>
              {message.replyTo && (
                <div
                  className="p-2 mt-1 border-l-4 border-sky-300 bg-sky-100 rounded-xl cursor-pointer"
                  onClick={() => {
                    if (message.replyTo) {
                      scrollToMessage(message.replyTo.id);
                    }
                  }}
                >
                  <p className="text-sm text-gray-600">
                    <strong>{message.replyTo.sender}</strong>
                  </p>
                  <p className="text-sm text-gray-600 overflow-wrap-anywhere line-clamp-3">
                    {message.replyTo.content}
                  </p>
                </div>
              )}
              <p className="mt-1 break-words overflow-wrap-anywhere">
                {message.content}
              </p>
            </li>
          ))}
          <div ref={messagesEndRef} />
        </ul>
        {showScrollDownButton && (
          <button
            className="fixed fas fa-arrow-down mb-16 mr-4 bottom-4 right-4 p-2 bg-sky-500 text-white rounded-full shadow hover:bg-blue-600"
            onClick={scrollToBottom}
          ></button>
        )}
      </div>
    );
};

export default MessageList;
