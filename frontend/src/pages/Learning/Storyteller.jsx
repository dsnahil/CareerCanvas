import React from "react";
import { Link } from "react-router-dom";
import { CaretLeft } from "@phosphor-icons/react";

export default function Storyteller() {
  return (
    <div className="flex flex-col w-full h-full bg-gradient-to-br from-amber-500 to-orange-600">
      <div className="p-4">
        <Link to="/learning" className="flex items-center text-white hover:text-amber-200 transition-colors">
          <CaretLeft size={24} />
          <span className="ml-2">Back</span>
        </Link>
      </div>
      
      <div className="flex-grow flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl p-8 text-center">
          <h1 className="text-2xl font-bold text-amber-600 mb-8">Storyteller</h1>
          
          <div className="mb-8">
            <p className="text-lg mb-4">
              This feature is coming soon!
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              Storyteller will help you tell a creative story with the help of your AI co-author.
              Check back later for this exciting speech practice exercise.
            </p>
          </div>
          
          <button
            onClick={() => window.history.back()}
            className="px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
} 