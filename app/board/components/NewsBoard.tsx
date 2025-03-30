"use client";
import React, { useContext, useEffect, useState } from "react";
import NewsPost from "./NewsPost";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/app/_hooks/useAuth";
import { collection, addDoc, getDocs, query, getFirestore, orderBy, doc, deleteDoc, updateDoc, onSnapshot } from "firebase/firestore";
import firebase_app from "@/firebase";
import { NotificationContext } from "@/app/_hooks/notify/notificationContext";
import { Role } from "@/app/mainApp/page";

interface Post {
  id: string;
  creator: string;
  content: string;
  createdAt: Date;
}

interface NewsBoardProps {
  ownerUsername: string | null;
  userRole: Role;
}

const NewsBoard: React.FC<NewsBoardProps> = ({ ownerUsername,userRole }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostContent, setNewPostContent] = useState("");
  const [editPostId, setEditPostId] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(true);
  //const ownerUsername = sessionStorage.getItem("ownerUsername");
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get("workspaceId");
  const creatorName = useAuth();
  const db = getFirestore(firebase_app);
  const username = useAuth();
  const { notify } = useContext(NotificationContext);

  useEffect(() => {
    if (ownerUsername && workspaceId) {
      const q = query(
        collection(
          db,
          "users",
          ownerUsername,
          "workspaces",
          workspaceId,
          "posts"
        ),
        orderBy("createdAt", "desc")
      );

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const postsData: Post[] = [];
        querySnapshot.forEach((doc) => {
          postsData.push({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt.toDate(),
          } as Post);
        });
        setPosts(postsData);
      });

      return () => unsubscribe();
    }
  }, [workspaceId, ownerUsername, db]);

  const handleCreatePost = async () => {
    if (username !== ownerUsername) {
      if (!userRole?.createPost) {
        console.log("You do not have permission to create posts.");
        notify("You do not have permission to create posts.", "error");
        return;
      }
    }
    if (newPostContent.trim() && creatorName?.trim()) {
      const newPost = {
        creator: creatorName,
        content: newPostContent,
        createdAt: new Date(),
      };
      if (ownerUsername && workspaceId) {
        await addDoc(
          collection(
            db,
            "users",
            ownerUsername,
            "workspaces",
            workspaceId,
            "posts"
          ),
          newPost
        );
      }
      setPosts([{ id: new Date().toISOString(), ...newPost }, ...posts]);
      setNewPostContent("");
    }
  };

  const handleEditPost = async (post: Post) => {
    setEditPostId(post.id);
    setNewPostContent(post.content);
  };

  const handleUpdatePost = async (postId: string, newContent: string, postCreator: string) => {
    if (username !== ownerUsername && postCreator !== username) {
      if (!userRole?.editPost) {
        console.log("You do not have permission to edit posts.");
        notify("You do not have permission to edit posts.", "error");
        return;
      }
    }
    const post = posts.find((post) => post.id === postId);
    if (post && newContent.trim() && post.content !== newContent) {
      if (ownerUsername && workspaceId) {
        const postRef = doc(
          db,
          "users",
          ownerUsername,
          "workspaces",
          workspaceId,
          "posts",
          postId
        );
        await updateDoc(postRef, {
          content: newContent,
          updatedAt: new Date(),
        });
        setPosts(
          posts.map((post) =>
            post.id === postId
              ? { ...post, content: newContent, updatedAt: new Date() }
              : post
          )
        );
      }
    }
  };

  const handleDeletePost = async (postId: string, postCreator: string) => {
    if (username !== ownerUsername && postCreator !== username) {
      if (!userRole?.removePost) {
        console.log("You do not have permission to remove posts.");
        notify("You do not have permission to remove posts.", "error");
        return;
      }
    }
    if (ownerUsername && workspaceId) {
      const postRef = doc(
        db,
        "users",
        ownerUsername,
        "workspaces",
        workspaceId,
        "posts",
        postId
      );
      await deleteDoc(postRef);
      setPosts(posts.filter((post) => post.id !== postId));
    }
  };

  return (
    <div className="mx-auto max-w-screen-sm bg-white p-4 rounded-2xl shadow">
      {hasPermission && (
        <div className="mb-4">
          
          <textarea
            placeholder="Post Content"
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            className="border p-2 rounded-2xl  w-full mb-2"
            rows={4}
          />
          <button
            onClick={handleCreatePost}
            className="bg-sky-100 hover:bg-sky-200 p-2 rounded-xl"
          >
            Create Post
          </button>
        </div>
      )}
      <div className="grid grid-cols-1 gap-4">
        {posts.map((post) => (
          <NewsPost
            key={post.id}
            post={post}
            onEdit={handleEditPost}
            onDelete={handleDeletePost}
            onUpdate={handleUpdatePost}
            userRole={userRole}
          />
        ))}
      </div>
    </div>
  );
};

export default NewsBoard;
