import React from "react";
import { Link } from "react-router-dom";
import { CaretLeft } from "@phosphor-icons/react";

export default function SpinAYarn() {
  return (
    <div className="flex flex-col w-full h-full bg-gradient-to-br from-green-500 to-teal-600">
      <div className="p-4">
        <Link to="/learning" className="flex items-center text-white hover:text-green-200 transition-colors">
          <CaretLeft size={24} />
          <span className="ml-2">Back</span>
        </Link>
      </div>
      
      <div className="flex-grow flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl p-8 text-center">
          <h1 className="text-2xl font-bold text-green-600 mb-8">Spin a Yarn</h1>
          
          <div className="mb-8">
            <p className="text-lg mb-4">
              This feature is coming soon!
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              Spin a Yarn will help you maintain your train of thought with plot twists along the way.
              Check back later for this exciting speech practice exercise.
            </p>
          </div>
          
          <button
            onClick={() => window.history.back()}
            className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
} 