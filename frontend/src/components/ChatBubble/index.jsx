import React from "react";
import UserIcon from "../UserIcon";
import { userFromStorage } from "@/utils/request";
import renderMarkdown from "@/utils/chat/markdown";
import DOMPurify from "@/utils/chat/purify";

export default function ChatBubble({ message, type, popMsg }) {
  const isUser = type === "user";

  return (
    <div
      className={`flex justify-center items-end w-full`}
    >
      <div className={`py-6 px-4 w-full flex gap-x-5 md:max-w-[80%] flex-col`}>
        <div className={`flex gap-x-5 ${isUser ? "flex-row-reverse" : ""}`}>
          <UserIcon
            user={{ uid: isUser ? userFromStorage()?.username : "system" }}
            role={type}
          />

          <div
            className={`markdown whitespace-pre-line text-white font-normal text-sm md:text-sm flex flex-col gap-y-1 mt-2 p-4 ${
              isUser 
                ? "" 
                : ""
            } animate-fade-in`}
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(renderMarkdown(message)),
            }}
          />
        </div>
      </div>
    </div>
  );
}
