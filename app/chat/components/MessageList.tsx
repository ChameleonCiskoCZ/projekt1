import React, { useEffect, useRef } from "react";

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

    

    useEffect(() => {
      if (isUserAtBottom.current && messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, [messages, messagesEndRef]);
  return (
    <div
      className="flex-1 overflow-y-auto"
      ref={scrollContainerRef}
      onScroll={handleScroll}
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
            <p className="mt-1">{message.content}</p>
          </li>
        ))}
        <div ref={messagesEndRef} />
      </ul>
    </div>
  );
};

export default MessageList;
