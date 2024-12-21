import React from "react";

interface MessageInputProps {
  newMessage: string;
  setNewMessage: (message: string) => void;
  handleSendMessage: () => void;
}

const MessageInput: React.FC<MessageInputProps> = ({
  newMessage,
  setNewMessage,
  handleSendMessage,
}) => {
  return (
    <div className="mt-4">
      <textarea
        className="w-full p-2 border rounded"
        rows={3}
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
      />
      <button
        className="mt-2 p-2 bg-sky-300 text-white rounded w-full hover:bg-sky-500"
        onClick={handleSendMessage}
      >
        Send
      </button>
    </div>
  );
};

export default MessageInput;
