import React, { useState } from "react";
import { Attachment, ChatMessage } from "../page";

interface MessageInputProps {
  newMessage: string;
  setNewMessage: (message: string) => void;
  handleSendMessage: (attachments: Attachment[]) => Promise<void>;
  replyToMessage: ChatMessage | null;
  setReplyToMessage: (message: ChatMessage | null) => void;
  handleFileUpload: (files: FileList) => Promise<Attachment[]>;
}

const MessageInput: React.FC<MessageInputProps> = ({
  newMessage,
  setNewMessage,
  handleSendMessage,
  replyToMessage,
  setReplyToMessage,
  handleFileUpload
}) => {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);

   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     if (e.target.files) {
       const newFiles = selectedFiles ? Array.from(selectedFiles) : [];
       setSelectedFiles(new DataTransfer().files);
       Array.from(e.target.files).forEach((file) => newFiles.push(file));
       const dataTransfer = new DataTransfer();
       newFiles.forEach((file) => dataTransfer.items.add(file));
       setSelectedFiles(dataTransfer.files);
     }
   };

  const handleSendMessageWrapper = async () => {
    const attachments = selectedFiles ? await handleFileUpload(selectedFiles) : [];
    await handleSendMessage(attachments);
    setSelectedFiles(null); // Clear selected files after sending the message
  };


  const handleRemoveFile = (index: number) => {
    if (selectedFiles) {
      const newFiles = Array.from(selectedFiles);
      newFiles.splice(index, 1);
      const dataTransfer = new DataTransfer();
      newFiles.forEach(file => dataTransfer.items.add(file));
      setSelectedFiles(dataTransfer.files);
    }
  };
  

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
      <div className="relative flex items-center">
        <label className="cursor-pointer text-sky-500 hover:text-sky-700 absolute left-4">
          <input
            type="file"
            className="hidden"
            multiple
            onChange={handleFileChange}
          />
          <i className="fas fa-paperclip"></i>
        </label>
        <input
          className="w-full p-2 pl-12 pr-8 border rounded-full"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSendMessageWrapper();
          }}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
        />
        {newMessage && (
          <button
            className="fas fa-paper-plane absolute right-4 top-1/2 transform -translate-y-1/2 cursor-pointer text-sky-500 hover:text-sky-700"
            onClick={handleSendMessageWrapper}
          ></button>
        )}
      </div>
      {selectedFiles && (
        <div className="mt-2">
          {Array.from(selectedFiles).map((file, index) => (
            <div key={index} className="text-sm text-gray-600">
              {file.name}
              <button
                className="ml-2 text-red-500 hover:text-red-700"
                onClick={() => handleRemoveFile(index)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MessageInput;
