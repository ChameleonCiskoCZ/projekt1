import React, { useEffect, useRef, useState } from "react";

interface ChatMessage {
  id: string;
  sender: string;
  content: string;
  createdAt: string;
}

interface MessageListProps {
  messages: ChatMessage[];
  handleScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  handleScroll,
  messagesEndRef,
}) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const isUserAtBottom = useRef(true);
    const [showScrollDownButton, setShowScrollDownButton] = useState(false);

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

    useEffect(() => {
      if (isUserAtBottom.current && messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, [messages, messagesEndRef]);

    return (
      <div
        className="relative flex-1 overflow-y-auto min-w-0"
        ref={scrollContainerRef}
        onScroll={customHandleScroll}
      >
        <ul>
          {messages.map((message) => (
            <li key={message.id} className="p-2">
              <div className="flex items-center">
                <strong>{message.sender}</strong>
                <span className="text-xs text-gray-500 ml-2">
                  {new Date(message.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="mt-1 break-words overflow-wrap-anywhere">
                {message.content}
              </p>
            </li>
          ))}
          <div ref={messagesEndRef} />
        </ul>
        {showScrollDownButton && (
          <button
            className="fixed fas fa-arrow-down mb-32 mr-4 bottom-4 right-4 p-2 bg-sky-500 text-white rounded-full shadow hover:bg-blue-600"
            onClick={scrollToBottom}
          >
            
          </button>
        )}
      </div>
    );
};

export default MessageList;
