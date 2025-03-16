import React from "react";
import { Trophy } from "@phosphor-icons/react";

const SkillTag = ({ type, label }) => {
  const getTagColor = (type) => {
    const colors = {
      "lateral-thinking": "bg-pink-100 text-pink-800 border-pink-300",
      "articulation": "bg-blue-100 text-blue-800 border-blue-300",
      "structure": "bg-purple-100 text-purple-800 border-purple-300",
      "conciseness": "bg-yellow-100 text-yellow-800 border-yellow-300",
      "agility": "bg-green-100 text-green-800 border-green-300",
      "filler-words": "bg-orange-100 text-orange-800 border-orange-300"
    };
    
    return colors[type] || "bg-gray-100 text-gray-800 border-gray-300";
  };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getTagColor(type)}`}>
      {type === "lateral-thinking" && <span className="mr-1">🧠</span>}
      {type === "articulation" && <span className="mr-1">🗣️</span>}
      {type === "structure" && <span className="mr-1">🏗️</span>}
      {type === "conciseness" && <span className="mr-1">✂️</span>}
      {type === "agility" && <span className="mr-1">⚡</span>}
      {type === "filler-words" && <span className="mr-1">🔍</span>}
      {label}
    </span>
  );
};

export default function ExerciseCard({ exercise, onStart }) {
  const { id, title, description, image, skills, score } = exercise;
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 flex flex-col">
      <div className="p-6 flex-grow">
        <div className="flex justify-between items-start mb-4">
          <div className="w-16 h-16 flex items-center justify-center">
            <img src={image} alt={title} className="w-full h-full object-contain" />
          </div>
          
          {score !== null && (
            <div className="flex items-center">
              <Trophy size={24} weight="fill" className="text-yellow-500 mr-1" />
              <span className="text-lg font-bold">{score}</span>
            </div>
          )}
        </div>
        
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-4">{description}</p>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {skills.map((skill, index) => (
            <SkillTag key={index} type={skill.type} label={skill.label} />
          ))}
        </div>
      </div>
      
      <button
        onClick={onStart}
        className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all duration-300"
      >
        Start Practicing
      </button>
    </div>
  );
} 