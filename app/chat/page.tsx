"use client";
import React, { useEffect, useState, useRef } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  getFirestore,
  limit,
  startAfter,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import firebase_app from "@/firebase";
import Navbar from "../components/Navbar";
import { Member, Role } from "../mainApp/page";
import { useSearchParams } from "next/navigation";
import { useAuth } from "../_hooks/useAuth";
import Settings from "../mainApp/_components/settings/settings";
import ThreadList from "./components/ThreadList";
import MessageList from "./components/MessageList";
import MessageInput from "./components/MessageInput";

interface ChatMessage {
  id: string;
  content: string;
  createdAt: string;
  sender: string;
}

export interface ChatThread {
  id: string;
  title: string;
  messages: ChatMessage[];
}

export default function  ()  {
  const db = getFirestore(firebase_app);
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get("workspaceId");
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [ownerUsername, setOwnerUsername] = useState<string | null>(null);
  const [newThreadTitle, setNewThreadTitle] = useState("");
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const username = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [lastVisible, setLastVisible] = useState<any>(null);

  useEffect(() => {
    const storedUserRole = sessionStorage.getItem("userRole");
    const storedMembers = sessionStorage.getItem("members");
    const storedOwnerUsername = sessionStorage.getItem("ownerUsername");

    if (storedOwnerUsername) {
      setOwnerUsername(storedOwnerUsername);
    }
    if (storedUserRole) {
      setUserRole(JSON.parse(storedUserRole));
    }
    if (storedMembers) {
      setMembers(JSON.parse(storedMembers));
    }
  }, []);

  useEffect(() => {
    if (workspaceId && ownerUsername) {
      const threadsCollection = collection(
        db,
        "users",
        ownerUsername,
        "workspaces",
        workspaceId,
        "threads"
      );
      console.log("Fetching threads from:", threadsCollection.path);
      const unsubscribe = onSnapshot(threadsCollection, (snapshot) => {
        const threadsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as ChatThread[];
        console.log("Fetched threads data:", threadsData);
        setThreads(threadsData);
      });

      return () => unsubscribe();
    }
  }, [workspaceId, ownerUsername, db]);

  useEffect(() => {
    if (selectedThreadId && workspaceId && ownerUsername) {
      const messagesCollection = collection(
        db,
        "users",
        ownerUsername,
        "workspaces",
        workspaceId,
        "threads",
        selectedThreadId,
        "messages"
      );

      const q = query(
        messagesCollection,
        orderBy("createdAt", "desc"),
        limit(20)
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const messagesData = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            content: data.content,
            createdAt:
              data.createdAt instanceof Timestamp
                ? data.createdAt.toDate().toISOString()
                : new Date(data.createdAt).toISOString(),
            sender: data.sender,
          };
        });
        // Sort messages by createdAt
        messagesData.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        setMessages(messagesData);
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      });

      return () => unsubscribe();
    }
  }, [selectedThreadId, workspaceId, ownerUsername, db]);

  const handleSendMessage = async () => {
    if (newMessage.trim() && selectedThreadId && workspaceId) {
      try {
        const newChatMessage = {
          content: newMessage,
          createdAt: Timestamp.fromDate(new Date()),
          sender: username,
        };
        if (workspaceId && ownerUsername) {
          await addDoc(
            collection(
              db,
              "users",
              ownerUsername,
              "workspaces",
              workspaceId,
              "threads",
              selectedThreadId,
              "messages"
            ),
            newChatMessage
          );
          setNewMessage("");
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
      } catch (error) {
        console.error("Error sending message:", error);
      }
    }
  };

  const handleAddThread = async () => {
    if (newThreadTitle.trim() && workspaceId) {
      const newThread = {
        title: newThreadTitle,
        messages: [],
      };
      if (workspaceId && ownerUsername) {
        await addDoc(
          collection(
            db,
            "users",
            ownerUsername,
            "workspaces",
            workspaceId,
            "threads"
          ),
          newThread
        );
        setNewThreadTitle("");
      }
    }
  };

  const handleSelectThread = (threadId: string) => {
    setSelectedThreadId(threadId);
    setMessages([]);
    setLastVisible(null);
  };

  const loadMoreMessages = async () => {
    if (lastVisible && selectedThreadId && workspaceId && ownerUsername) {
      const messagesCollection = collection(
        db,
        "users",
        ownerUsername,
        "workspaces",
        workspaceId,
        "threads",
        selectedThreadId,
        "messages"
      );

      const q = query(
        messagesCollection,
        orderBy("createdAt", "desc"),
        startAfter(lastVisible),
        limit(20)
      );

      const snapshot = await getDocs(q);
      const messagesData = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          content: data.content,
          createdAt:
            data.createdAt instanceof Timestamp
              ? data.createdAt.toDate().toISOString()
              : new Date(data.createdAt).toISOString(),
          sender: data.sender,
        };
      });

      setMessages((prevMessages) => {
        const combinedMessages = [...messagesData.reverse(), ...prevMessages];
        combinedMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        return combinedMessages;
      });
      setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (e.currentTarget.scrollTop === 0) {
      loadMoreMessages();
    }
  };

  const rightButtons = (
    <>
      <Settings
        workspaceId={workspaceId || ""}
        ownerUsername={ownerUsername || ""}
        userRole={userRole as Role}
        members={members}
      />
    </>
  );

  return (
    <div className="min-h-screen flex bg-gray-100">
      <Navbar rightButtons={rightButtons} />
      <div className="flex max-h-screen pt-16 flex-1 p-4">
        <ThreadList
          threads={threads}
          selectedThreadId={selectedThreadId}
          handleSelectThread={handleSelectThread}
          newThreadTitle={newThreadTitle}
          setNewThreadTitle={setNewThreadTitle}
          handleAddThread={handleAddThread}
        />
        <div className="flex-1 p-4 bg-white shadow rounded-2xl ml-4">
          {selectedThreadId ? (
            <>
              <div className="flex flex-col h-full">
                <MessageList
                  messages={messages}
                  handleScroll={handleScroll}
                  messagesEndRef={messagesEndRef}
                />
                <MessageInput
                  newMessage={newMessage}
                  setNewMessage={setNewMessage}
                  handleSendMessage={handleSendMessage}
                />
              </div>
            </>
          ) : (
            <p>Select a thread to start chatting</p>
          )}
        </div>
      </div>
    </div>
  );
};


