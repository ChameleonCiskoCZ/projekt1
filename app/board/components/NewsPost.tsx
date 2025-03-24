import { useAuth } from "@/app/_hooks/useAuth";
import { Role } from "@/app/mainApp/page";
import React, { useState } from "react";

interface Post {
  id: string;
  creator: string;
  content: string;
  createdAt: Date;
}

interface NewsPostProps {
  post: Post;
  onEdit: (post: Post) => void;
  onDelete: (postId: string, postCreator:string) => void;
  onUpdate: (postId: string, newContent: string, postCreator: string) => void;
  userRole: Role;
}

const NewsPost: React.FC<NewsPostProps> = ({
  post,
  onEdit,
  onDelete,
  onUpdate,
  userRole
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newContent, setNewContent] = useState(post.content);
  const [menuOpen, setMenuOpen] = useState(false);
  const username = useAuth();
  const ownerUsername = sessionStorage.getItem("ownerUsername");

  const handleUpdate = () => {
    onUpdate(post.id, newContent, post.creator);
    setIsEditing(false);
  };

  return (
    <div className="p-4 rounded-2xl relative bg-white border shadow-sm mb-4">
      <div className="absolute top-2 right-2">
        {(username === ownerUsername ||
          userRole?.removePost ||
          userRole?.editPost ||
          post.creator === username) && (
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="fas fa-bars text-xl p-2 rounded-xl hover:bg-gray-100"
          ></button>
        )}
        {menuOpen && (
          <div className="absolute z-10 right-0 rounded-xl mt-2 w-32 bg-white border shadow-lg">
            {(username === ownerUsername ||
              userRole?.editPost ||
              post.creator === username) && (
              <button
                onClick={() => {
                  setIsEditing(true);
                  setMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-xl"
              >
                Edit
              </button>
            )}
            {(username === ownerUsername ||
              userRole?.removePost ||
              post.creator === username) && (
              <button
                onClick={() => onDelete(post.id, post.creator)}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-xl"
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>
      <div className="mb-2">
        <strong className="text-lg">{post.creator}</strong>
        <span className="text-sm text-gray-500 ml-2">
          {post.createdAt.toLocaleDateString()}{" "}
          {post.createdAt.toLocaleTimeString()}
        </span>
      </div>
      {isEditing ? (
        <textarea
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          className="border p-2 rounded-xl w-full mb-2"
          rows={4}
        />
      ) : (
        <div className="overflow-wrap-anywhere bg-sky-100 p-2 rounded-xl">
          {post.content}
        </div>
      )}
      <div className="flex justify-end space-x-2 mt-2">
        {isEditing ? (
          <button
            onClick={handleUpdate}
            className="bg-sky-100 text-white p-2 rounded-xl hover:bg-sky-200"
          >
            Save
          </button>
        ) : null}
      </div>
    </div>
  );
};

export default NewsPost;
