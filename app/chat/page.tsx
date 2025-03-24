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
  deleteDoc,
  doc,
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
import { useNavbar } from "../components/NavbarContext";

export interface ChatMessage {
  id: string;
  content: string;
  createdAt: string;
  sender: string;
  replyTo?: ChatMessage;
  attachments?: Attachment[];
}
export interface Attachment {
  name: string;
  url: string;
  type: string;
}

export interface ChatThread {
  id: string;
  title: string;
  messages: ChatMessage[];
  position: number;
  allowedRoles: string[];
}

export default function Chat() {
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
  const [loading, setLoading] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState<ChatMessage | null>(
    null
  );
  const [uploadedFiles, setUploadedFiles] = useState<Attachment[]>([]);
  const { isNavbarCollapsed } = useNavbar();


  useEffect(() => {
        const fetchUserRole = () => {
          if (ownerUsername && workspaceId && username) {
            const memberRef = doc(
              db,
              "users",
              ownerUsername,
              "workspaces",
              workspaceId,
              "members",
              username
            );
            const unsubscribeFromMember = onSnapshot(
              memberRef,
              (memberSnapshot) => {
                const memberData = memberSnapshot.data();
                if (memberData) {
                  const role = memberData.role;
    
                  if (role) {
                    // Fetch data from workspaceId, "roles", userRole
                    const roleRef = doc(
                      db,
                      "users",
                      ownerUsername,
                      "workspaces",
                      workspaceId,
                      "roles",
                      role
                    );
                    const unsubscribeFromRole = onSnapshot(
                      roleRef,
                      (roleSnapshot) => {
                        const roleData = roleSnapshot.data();
                        if (roleData) {
                          setUserRole(roleData as Role);
                          sessionStorage.setItem(
                            "userRole",
                            JSON.stringify(roleData)
                          );
                        } else {
                          setUserRole(null);
                          sessionStorage.removeItem("userRole");
                        }
                      }
                    );
    
                    // Return cleanup function for role snapshot
                    return () => unsubscribeFromRole();
                  } else {
                    setUserRole(null);
                    sessionStorage.removeItem("userRole");
                  }
                }
              }
            );
    
            // Return cleanup function for member snapshot
            return () => unsubscribeFromMember();
          }
        };
    
        // Call fetchUserRole and store cleanup function
        const unsubscribe = fetchUserRole();
    
        // Cleanup function for useEffect
        return () => {
          if (unsubscribe) {
            unsubscribe();
          }
        };
      }, [db, ownerUsername, workspaceId, username]);

  const handleFileUpload = async (files: FileList): Promise<Attachment[]> => {
    const uploadedFiles: Attachment[] = [];
    const cloudName = "dsrfukgtq"; 
    const uploadPreset = "jafaktnevimkamo"; 

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", uploadPreset);

      try {
        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/upload`,
          {
            method: "POST",
            body: formData,
          }
        );

        const data = await response.json();
        if (data.secure_url) {
          uploadedFiles.push({
            name: file.name,
            url: data.secure_url,
            type: file.type,
          });
        } else {
          console.error("Error uploading file to Cloudinary:", data);
        }
      } catch (error) {
        console.error("Error uploading file to Cloudinary:", error);
      }
    }

    setUploadedFiles(uploadedFiles);
    return uploadedFiles; 
  };

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

      const unsubscribe = onSnapshot(threadsCollection, (snapshot) => {
        const threadsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as ChatThread[];

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
            replyTo: data.replyTo
              ? {
                  id: data.replyTo.id,
                  sender: data.replyTo.sender,
                  content: data.replyTo.content,
                  createdAt: data.replyTo.createdAt,
                }
              : undefined,
            attachments: data.attachments || [],
          };
        });
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

  const handleDeleteMessage = async (id: string) => {
    if (selectedThreadId && workspaceId && ownerUsername) {
      try {
        await deleteDoc(
          doc(
            db,
            "users",
            ownerUsername,
            "workspaces",
            workspaceId,
            "threads",
            selectedThreadId,
            "messages",
            id
          )
        );
        setMessages((prevMessages) =>
          prevMessages.filter((message) => message.id !== id)
        );
      } catch (error) {
        console.error("Error deleting message:", error);
      }
    }
  };
  

   const handleSendMessage = async (attachments: Attachment[]) => {
     if (newMessage.trim() && selectedThreadId && workspaceId) {
       try {
         const newChatMessage = {
           content: newMessage,
           createdAt: Timestamp.fromDate(new Date()),
           sender: username,
           replyTo: replyToMessage
             ? {
                 id: replyToMessage.id,
                 sender: replyToMessage.sender,
                 content: replyToMessage.content,
                 createdAt: replyToMessage.createdAt,
               }
             : null,
           attachments,
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
           setReplyToMessage(null);
           setUploadedFiles([]); 
           messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
         }
       } catch (error) {
         console.error("Error sending message:", error);
       }
     }
   };

  const handleAddThread = async () => {
    if (newThreadTitle.trim() && workspaceId && ownerUsername) {
      const threadsCollection = collection(
        db,
        "users",
        ownerUsername,
        "workspaces",
        workspaceId,
        "threads"
      );


      const threadsSnapshot = await getDocs(threadsCollection);
      const threadsData = threadsSnapshot.docs.map(
        (doc) => doc.data() as ChatThread
      );
      const highestPosition = threadsData.reduce(
        (max, thread) => Math.max(max, thread.position || 0),
        0
      );

      const newThread = {
        title: newThreadTitle,
        messages: [],
        position: highestPosition + 1,
      };

      if (workspaceId && ownerUsername) {
        await addDoc(threadsCollection, newThread);
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
      setLoading(true);
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

      setTimeout(() => {
        setMessages((prevMessages) => {
          const combinedMessages = [...messagesData.reverse(), ...prevMessages];
          combinedMessages.sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          return combinedMessages;
        });
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
        setLoading(false);
      }, 1000); 
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (e.currentTarget.scrollTop === 0) {
      loadMoreMessages();
    }
  };

  const rightButtons = (
    <>
      {(username === ownerUsername ||
            (userRole?.settingsView)) && (
      <Settings
        workspaceId={workspaceId || ""}
        ownerUsername={ownerUsername || ""}
        userRole={userRole as Role}
        members={members}
          />
      )}
    </>
  );

  return (
    <div className="min-h-screen flex bg-gray-100">
      <Navbar rightButtons={rightButtons} />
      <div
        className={`pt-16 ${
          isNavbarCollapsed ? "ml-16" : "ml-48"
        } transition-margin duration-300 flex max-h-screen flex-1 p-4`}
      >
        <div
          className={`w-full md:w-1/4 ${
            selectedThreadId ? "hidden md:block" : ""
          }`}
        >
          <ThreadList
            threads={threads}
            selectedThreadId={selectedThreadId}
            handleSelectThread={handleSelectThread}
            newThreadTitle={newThreadTitle}
            setNewThreadTitle={setNewThreadTitle}
            handleAddThread={handleAddThread}
            ownerUsername={ownerUsername || ""}
            workspaceId={workspaceId || ""}
            setThreads={setThreads}
            userRole={userRole as Role}
          />
        </div>
        <div
          className={`flex-1 p-4 bg-white shadow rounded-2xl md:ml-4 relative ${
            !selectedThreadId ? "hidden md:block" : ""
          }`}
        >
          {selectedThreadId ? (
            <>
              {loading && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 p-2">
                  <div className="loader"></div>
                </div>
              )}

              <div className="flex flex-col h-full">
                <div
                  className="fas fa-arrow-left mb-2 top-0 left-0 p-2 rounded-xl max-w-min hover:bg-sky-100"
                  onClick={() => setSelectedThreadId(null)}
                ></div>
                <MessageList
                  messages={messages}
                  handleScroll={handleScroll}
                  messagesEndRef={messagesEndRef}
                  setReplyToMessage={setReplyToMessage}
                  handleDeleteMessage={handleDeleteMessage}
                />
                <MessageInput
                  newMessage={newMessage}
                  setNewMessage={setNewMessage}
                  handleSendMessage={handleSendMessage}
                  replyToMessage={replyToMessage}
                  setReplyToMessage={setReplyToMessage}
                  handleFileUpload={handleFileUpload}
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
}
