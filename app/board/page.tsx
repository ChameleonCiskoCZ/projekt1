
import React, { useState } from "react";
import { useRouter } from "next/router";
import NewsBoard from "./components/NewsBoard";
const NewsBoardPage: React.FC = () => {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="p-4">
          <h1 className="text-2xl font-bold mb-4">News Board</h1>
          <NewsBoard />
        </div>
      </div>
    );
};

export default NewsBoardPage;
