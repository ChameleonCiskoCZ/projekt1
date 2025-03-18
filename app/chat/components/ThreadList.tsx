import React, { useEffect, useRef, useState } from "react";
import { ChatThread } from "../page";
import { doc, getFirestore, updateDoc, writeBatch } from "firebase/firestore";
import firebase_app from "@/firebase";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";

interface ThreadListProps {
  threads: ChatThread[];
  selectedThreadId: string | null;
  handleSelectThread: (threadId: string) => void;
  newThreadTitle: string;
  setNewThreadTitle: (title: string) => void;
  handleAddThread: () => void;
  ownerUsername: string;
  workspaceId: string;
  setThreads: (threads: ChatThread[]) => void;
}

const ThreadList: React.FC<ThreadListProps> = ({
  threads,
  selectedThreadId,
  handleSelectThread,
  newThreadTitle,
  setNewThreadTitle,
  handleAddThread,
  ownerUsername,
  workspaceId,
  setThreads,
}) => {
  const db = getFirestore(firebase_app);
  const [isCreateThreadVisible, setIsCreateThreadVisible] = useState(false);

  const createThreadRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = (event: MouseEvent) => {
    if (
      createThreadRef.current &&
      !createThreadRef.current.contains(event.target as Node)
    ) {
      setIsCreateThreadVisible(false);
    }
  };

  useEffect(() => {
    if (isCreateThreadVisible) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isCreateThreadVisible]);

  const onDragEnd = async (result: any) => {
    const { source, destination } = result;

    if (!destination) {
      return;
    }

    const reorderedThreads = Array.from(threads);
    const [movedThread] = reorderedThreads.splice(source.index, 1);
    reorderedThreads.splice(destination.index, 0, movedThread);

    reorderedThreads.forEach((thread, index) => {
      thread.position = index;
    });

    const batch = writeBatch(db);
    reorderedThreads.forEach((thread) => {
      const threadRef = doc(
        db,
        "users",
        ownerUsername,
        "workspaces",
        workspaceId,
        "threads",
        thread.id
      );
      batch.update(threadRef, { position: thread.position });
    });
    await batch.commit();

    setThreads(reorderedThreads);
  };

  return (
    <div className="p-4 bg-white shadow rounded-2xl overflow-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Threads</h2>
      </div>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="threads">
          {(provided) => (
            <ul
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-2"
            >
              {threads
                .sort((a, b) => a.position - b.position)
                .map((thread, index) => (
                  <Draggable
                    key={thread.id}
                    draggableId={thread.id}
                    index={index}
                  >
                    {(provided) => (
                      <li
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`p-2 cursor-pointer rounded-xl ${
                          selectedThreadId === thread.id
                            ? "bg-sky-200 font-semibold"
                            : "hover:bg-sky-100"
                        }`}
                        onClick={() => handleSelectThread(thread.id)}
                      >
                        <span className="overflow-wrap-anywhere">
                          {thread.title}
                        </span>
                      </li>
                    )}
                  </Draggable>
                ))}
              {provided.placeholder}
            </ul>
          )}
        </Droppable>
      </DragDropContext>
      <div className="mt-4" ref={createThreadRef}>
        {isCreateThreadVisible ? (
          <div className="flex flex-col">
            <input
              type="text"
              value={newThreadTitle}
              onChange={(e) => setNewThreadTitle(e.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleAddThread();
                  setIsCreateThreadVisible(false);
                }
              }}
              autoFocus
              className="mt-2 border rounded-xl p-2"
            />
            <button
              onClick={() => {
                handleAddThread();
                setIsCreateThreadVisible(false);
              }}
              className="mt-2 bg-sky-100 font-semibold rounded-xl p-2 hover:bg-sky-200"
            >
              Save
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsCreateThreadVisible(true)}
            className="w-full mt-2 rounded-xl p-2 bg-sky-100 hover:bg-sky-200"
          >
            <span className="text-2xl">+</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default ThreadList;