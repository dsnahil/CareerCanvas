import React, { useState } from "react";
import { Trophy } from "@phosphor-icons/react";
import ExerciseCard from "./components/ExerciseCard";
import { useNavigate } from "react-router-dom";

export default function Learning() {
  const navigate = useNavigate();
  
  const exercises = [
    {
      id: "metaphor-mania",
      title: "Metaphor Mania",
      description: "Quickly build analogies without letting the pressure affect you",
      image: "/metaphor-mania.svg",
      skills: [
        { type: "lateral-thinking", label: "Lateral Thinking" },
        { type: "articulation", label: "Articulation" },
        { type: "conciseness", label: "Conciseness" },
        { type: "agility", label: "Agility" }
      ],
      score: null
    },
    {
      id: "spin-a-yarn",
      title: "Spin a Yarn",
      description: "Maintain your train of thought with plot twists along the way",
      image: "/spin-a-yarn.svg",
      skills: [
        { type: "articulation", label: "Articulation" },
        { type: "structure", label: "Structure" },
        { type: "lateral-thinking", label: "Lateral Thinking" }
      ],
      score: null
    },
    {
      id: "no-filler",
      title: "No Filler",
      description: "Speak without using filler words like 'um', 'like', and 'so'",
      image: "/no-filler.svg",
      skills: [
        { type: "filler-words", label: "Filler Words" },
        { type: "articulation", label: "Articulation" },
        { type: "structure", label: "Structure" }
      ],
      score: 80
    },
    {
      id: "storyteller",
      title: "Storyteller",
      description: "Tell a creative story with the help of your AI co-author",
      image: "/storyteller.svg",
      skills: [
        { type: "articulation", label: "Articulation" },
        { type: "structure", label: "Structure" },
        { type: "lateral-thinking", label: "Lateral Thinking" }
      ],
      score: null
    }
  ];

  const handleStartExercise = (exerciseId) => {
    navigate(`/learning/${exerciseId}`);
  };

  return (
    <div className="flex flex-col w-full h-full overflow-auto bg-theme-bg-container">
      <div className="bg-gradient-to-r from-blue-100 to-blue-50 dark:from-blue-900/20 dark:to-indigo-900/10 p-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Speech Practice</h1>
      </div>
      
      <div className="p-8">
        <h2 className="text-2xl font-bold mb-8 text-gray-800 dark:text-white">Exercises</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {exercises.map((exercise) => (
            <ExerciseCard 
              key={exercise.id}
              exercise={exercise}
              onStart={() => handleStartExercise(exercise.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
} 