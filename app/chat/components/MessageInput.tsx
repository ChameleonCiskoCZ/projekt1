import React from "react";
import { ChatMessage } from "../page";

interface MessageInputProps {
  newMessage: string;
  setNewMessage: (message: string) => void;
  handleSendMessage: () => void;
  replyToMessage: ChatMessage | null;
  setReplyToMessage: (message: ChatMessage | null) => void;
}

const MessageInput: React.FC<MessageInputProps> = ({
  newMessage,
  setNewMessage,
  handleSendMessage,
  replyToMessage,
  setReplyToMessage,
}) => {
  return (
    <div className="mt-4 relative">
      {replyToMessage && (
        <div className="p-2 mb-2 border rounded-xl bg-sky-100">
          <p className="text-sm text-gray-600">
            Replying to: <strong>{replyToMessage.sender}</strong>
          </p>
          <p className="text-sm text-gray-600 overflow-wrap-anywhere line-clamp-3">
            {replyToMessage.content}
          </p>
          <button
            className="text-xs text-red-500"
            onClick={() => setReplyToMessage(null)}
          >
            Cancel
          </button>
        </div>
      )}
      <input
        className="w-full p-2 pl-4 pr-8 border rounded-full"
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSendMessage();
        }}
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
      />
      {newMessage && (
        <button
          className="fas fa-paper-plane absolute right-4 top-1/2 transform -translate-y-1/2 cursor-pointer text-sky-500 hover:text-sky-700"
          onClick={handleSendMessage}
        ></button>
      )}
    </div>
  );
};

export default MessageInput;
