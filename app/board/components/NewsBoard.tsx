"use client";
import React, { useEffect, useState } from "react";
import NewsPost from "./NewsPost";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/app/_hooks/useAuth";
import { collection, addDoc, getDocs, query, getFirestore, orderBy, doc, deleteDoc, updateDoc } from "firebase/firestore";
import firebase_app from "@/firebase";

interface Post {
  id: string;
  creator: string;
  content: string;
  createdAt: Date;
}

interface NewsBoardProps {
  ownerUsername: string | null;
}

const NewsBoard: React.FC<NewsBoardProps> = ({ ownerUsername }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostContent, setNewPostContent] = useState("");
  const [editPostId, setEditPostId] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(true); // Change this based on actual permission logic
  //const ownerUsername = sessionStorage.getItem("ownerUsername");
  const searchParams = useSearchParams();
  const workspaceId = searchParams.get("workspaceId");
  const creatorName = useAuth();
  const db = getFirestore(firebase_app);

  useEffect(() => {
    const fetchPosts = async () => {
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
        const querySnapshot = await getDocs(q);
        const postsData: Post[] = [];
        querySnapshot.forEach((doc) => {
          postsData.push({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt.toDate(),
          } as Post);
        });
        setPosts(postsData);
      }
    };

    fetchPosts();
  }, [workspaceId, ownerUsername, db]);

  const handleCreatePost = async () => {
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

  const handleUpdatePost = async (postId: string, newContent: string) => {
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

  const handleDeletePost = async (postId: string) => {
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
    <div className=" mx-auto max-w-screen-sm">
      {hasPermission && (
        <div className="mb-4">
          <h2 className="text-xl font-bold mb-2">Create New Post</h2>
          <textarea
            placeholder="Post Content"
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            className="border p-2 rounded-2xl w-full mb-2"
            rows={4}
          />
          <button
            onClick={handleCreatePost}
            className="bg-sky-500 text-white p-2 rounded-xl"
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
          />
        ))}
      </div>
    </div>
  );
};

export default NewsBoard;
