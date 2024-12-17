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
  onDelete: (postId: string) => void;
  onUpdate: (postId: string, newContent: string) => void;
}

const NewsPost: React.FC<NewsPostProps> = ({
  post,
  onEdit,
  onDelete,
  onUpdate,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newContent, setNewContent] = useState(post.content);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleUpdate = () => {
    onUpdate(post.id, newContent);
    setIsEditing(false);
  };

  return (
    <div className=" p-4 rounded-2xl shadow bg-white relative">
      <div className="text-sm text-gray-500 mb-2">
        Created by: {post.creator} on {post.createdAt.toLocaleDateString()} at{" "}
        {post.createdAt.toLocaleTimeString()}
      </div>
      {isEditing ? (
        <textarea
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          className="border p-2 rounded-xl w-full mb-2"
          rows={4}
        />
      ) : (
        <div>{post.content}</div>
      )}
      <div className="flex justify-end space-x-2 mt-2">
        {isEditing ? (
          <button
            onClick={handleUpdate}
            className="bg-blue-500 text-white p-1 rounded"
          >
            Save
          </button>
        ) : (
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className=" text-xl p-2 rounded-xl hover:bg-gray-100"
            >
              ☰
            </button>
            {menuOpen && (
              <div className="absolute z-10 right-0 rounded-xl mt-2 w-32 bg-white border shadow-lg">
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setMenuOpen(false);
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-xl"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(post.id)}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-xl"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsPost;
