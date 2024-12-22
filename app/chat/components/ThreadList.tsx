import React from "react";
import { ChatThread } from "../page";

interface ThreadListProps {
  threads: ChatThread[];
  selectedThreadId: string | null;
  handleSelectThread: (threadId: string) => void;
  newThreadTitle: string;
  setNewThreadTitle: (title: string) => void;
  handleAddThread: () => void;
}

const ThreadList: React.FC<ThreadListProps> = ({
  threads,
  selectedThreadId,
  handleSelectThread,
  newThreadTitle,
  setNewThreadTitle,
  handleAddThread,
}) => {
  return (
    <div className="w-1/4 p-4 bg-white shadow rounded-2xl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Threads</h2>
      </div>
      <ul>
        {threads.map((thread) => (
          <li
            key={thread.id}
            className={`p-2 cursor-pointer rounded-lg ${
              selectedThreadId === thread.id
                ? "bg-gray-200"
                : "hover:bg-gray-100"
            }`}
            onClick={() => handleSelectThread(thread.id)}
          >
            <span className="overflow-wrap-anywhere">{thread.title}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4">
        <input
          type="text"
          className="w-full p-2 border rounded-lg"
          placeholder="New thread title"
          value={newThreadTitle}
          onChange={(e) => setNewThreadTitle(e.target.value)}
        />
        <button
          className="mt-2 p-2 bg-sky-300 hover:bg-sky-500 text-white rounded-lg w-full"
          onClick={handleAddThread}
        >
          Add Thread
        </button>
      </div>
    </div>
  );
};

export default ThreadList;