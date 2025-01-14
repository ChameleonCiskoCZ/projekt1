import React, { useEffect, useRef, useState } from "react";
import { ChatMessage } from "../page";



interface MessageListProps {
  messages: ChatMessage[];
  handleScroll: (e: React.UIEvent<HTMLDivElement>) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  setReplyToMessage: (message: ChatMessage | null) => void;
  handleDeleteMessage: (id: string) => void;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  handleScroll,
  messagesEndRef,
  setReplyToMessage,
  handleDeleteMessage,
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
            className="p-2 hover:bg-gray-50 rounded-xl relative group"
            ref={(el) => (messageRefs.current[message.id] = el)}
          >
            <div className="flex items-center justify-between">
              <div>
                <strong>{message.sender}</strong>
                <span className="text-xs text-gray-500 ml-2">
                  {new Date(message.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="absolute top-0 right-0 mt-1 hidden group-hover:flex space-x-2">
                <button
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => setReplyToMessage(message)}
                >
                  <i className="fas fa-reply"></i>
                </button>
                <button
                  className="text-red-500 hover:text-red-700"
                  onClick={() => handleDeleteMessage(message.id)}
                >
                  <i className="fas fa-trash"></i>
                </button>
              </div>
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
            {message.attachments && message.attachments.length > 0 && (
              <div className="mt-2">
                {message.attachments.map((attachment, index) => (
                  <div key={index} className="mt-1">
                    {attachment.type.startsWith("image/") ? (
                      <img
                        src={attachment.url}
                        alt={attachment.name}
                        className="max-w-full h-auto rounded-lg"
                      />
                    ) : (
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={attachment.name}
                        className="text-blue-500 hover:underline"
                      >
                        {attachment.name}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
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
