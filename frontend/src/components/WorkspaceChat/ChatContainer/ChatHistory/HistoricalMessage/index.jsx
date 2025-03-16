import React, { memo } from "react";
import { Warning } from "@phosphor-icons/react";
import UserIcon from "../../../../UserIcon";
import Actions from "./Actions";
import renderMarkdown from "@/utils/chat/markdown";
import { userFromStorage } from "@/utils/request";
import Citations from "../Citation";
import { v4 } from "uuid";
import DOMPurify from "@/utils/chat/purify";
import { EditMessageForm, useEditMessage } from "./Actions/EditMessage";
import { useWatchDeleteMessage } from "./Actions/DeleteMessage";
import TTSMessage from "./Actions/TTSButton";
import {
  THOUGHT_REGEX_CLOSE,
  THOUGHT_REGEX_COMPLETE,
  THOUGHT_REGEX_OPEN,
  ThoughtChainComponent,
} from "../ThoughtContainer";

const HistoricalMessage = ({
  uuid = v4(),
  message,
  role,
  workspace,
  sources = [],
  attachments = [],
  error = false,
  feedbackScore = null,
  chatId = null,
  isLastMessage = false,
  regenerateMessage,
  saveEditedMessage,
  forkThread,
  metrics = {},
  alignmentCls = "",
}) => {
  const { isEditing } = useEditMessage({ chatId, role });
  const { isDeleted, completeDelete, onEndAnimation } = useWatchDeleteMessage({
    chatId,
    role,
  });
  const adjustTextArea = (event) => {
    const element = event.target;
    element.style.height = "auto";
    element.style.height = element.scrollHeight + "px";
  };

  if (!!error) {
    return (
      <div
        key={uuid}
        className={`flex justify-center items-end w-full`}
      >
        <div className="py-6 px-4 w-full flex gap-x-5 md:max-w-[80%] flex-col">
          <div className={`flex gap-x-5 ${alignmentCls}`}>
            <ProfileImage role={role} workspace={workspace} />
            <div className="p-4 border border-red-500/30">
              <span className="inline-block text-red-400">
                <Warning className="h-4 w-4 mb-1 inline-block" /> Could not
                respond to message.
              </span>
              <p className="text-xs font-mono mt-2 border-l-2 border-red-300/30 pl-2 bg-red-500/10 p-2 text-red-300">
                {error}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (completeDelete) return null;

  return (
    <div
      key={uuid}
      onAnimationEnd={onEndAnimation}
      className={`${
        isDeleted ? "animate-remove" : ""
      } flex justify-center items-end w-full group`}
    >
      <div className="py-6 px-4 w-full flex gap-x-5 md:max-w-[80%] flex-col">
        <div className={`flex gap-x-5 ${alignmentCls}`}>
          <div className="flex flex-col items-center">
            <ProfileImage role={role} workspace={workspace} />
            <div className="mt-1 -mb-10">
              {role === "assistant" && (
                <TTSMessage
                  slug={workspace?.slug}
                  chatId={chatId}
                  message={message}
                />
              )}
            </div>
          </div>
          {isEditing ? (
            <EditMessageForm
              role={role}
              chatId={chatId}
              message={message}
              saveEditedMessage={saveEditedMessage}
              adjustTextArea={adjustTextArea}
              attachments={attachments}
            />
          ) : (
            <div
              className={`markdown whitespace-pre-line text-white font-normal text-sm md:text-sm flex flex-col gap-y-1 ${
                role === "user"
                  ? " "
                  : ""
              } ${
                role === "assistant" && isLastMessage ? "animate-pulse-once" : ""
              }`}
            >
              <div
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(
                    renderMarkdown(
                      message
                        .replace(THOUGHT_REGEX_COMPLETE, "")
                        .replace(THOUGHT_REGEX_OPEN, "")
                        .replace(THOUGHT_REGEX_CLOSE, "")
                    )
                  ),
                }}
              />
              {THOUGHT_REGEX_COMPLETE.test(message) && (
                <ThoughtChainComponent
                  message={message}
                  className="mt-2 animate-fade-in"
                />
              )}
              {attachments.length > 0 && (
                <ChatAttachments attachments={attachments} />
              )}
              {sources.length > 0 && (
                <Citations
                  sources={sources}
                  workspace={workspace}
                  className="mt-2 animate-fade-in"
                />
              )}
              <Actions
                role={role}
                chatId={chatId}
                isLastMessage={isLastMessage}
                regenerateMessage={regenerateMessage}
                feedbackScore={feedbackScore}
                forkThread={forkThread}
                metrics={metrics}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function ProfileImage({ role, workspace }) {
  const isUser = role === "user";
  const username = userFromStorage()?.username || "User";

  return (
    <div className="flex-shrink-0">
      <UserIcon
        size={40}
        user={{ uid: isUser ? username : "system" }}
        workspace={workspace}
        role={role}
        className={`${isUser ? "bg-gradient-to-br from-indigo-600/80 to-indigo-800/80 border border-indigo-500/30" : "bg-gradient-to-br from-slate-700/80 to-slate-900/80 border border-slate-600/30"} shadow-md`}
      />
    </div>
  );
}

export default memo(
  HistoricalMessage,
  // Skip re-render the historical message:
  // if the content is the exact same AND (not streaming)
  // the lastMessage status is the same (regen icon)
  // and the chatID matches between renders. (feedback icons)
  (prevProps, nextProps) => {
    return (
      prevProps.message === nextProps.message &&
      prevProps.isLastMessage === nextProps.isLastMessage &&
      prevProps.chatId === nextProps.chatId
    );
  }
);

function ChatAttachments({ attachments = [] }) {
  if (!attachments.length) return null;
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {attachments.map((item) => (
        <img
          key={item.name}
          src={item.contentString}
          className="max-w-[300px] rounded-md border border-slate-600/20 shadow-md"
          alt={item.name}
        />
      ))}
    </div>
  );
}

const RenderChatContent = memo(
  ({ role, message, expanded = false }) => {
    // If the message is not from the assistant, we can render it directly
    // as normal since the user cannot think (lol)
    if (role !== "assistant")
      return (
        <span
          className="flex flex-col gap-y-1"
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(renderMarkdown(message)),
          }}
        />
      );
    let thoughtChain = null;
    let msgToRender = message;

    // If the message is a perfect thought chain, we can render it directly
    // Complete == open and close tags match perfectly.
    if (message.match(THOUGHT_REGEX_COMPLETE)) {
      thoughtChain = message.match(THOUGHT_REGEX_COMPLETE)?.[0];
      msgToRender = message.replace(THOUGHT_REGEX_COMPLETE, "");
    }

    // If the message is a thought chain but not a complete thought chain (matching opening tags but not closing tags),
    // we can render it as a thought chain if we can at least find a closing tag
    // This can occur when the assistant starts with <thinking> and then <response>'s later.
    if (
      message.match(THOUGHT_REGEX_OPEN) &&
      message.match(THOUGHT_REGEX_CLOSE)
    ) {
      const closingTag = message.match(THOUGHT_REGEX_CLOSE)?.[0];
      const splitMessage = message.split(closingTag);
      thoughtChain = splitMessage[0] + closingTag;
      msgToRender = splitMessage[1];
    }

    return (
      <>
        {thoughtChain && (
          <ThoughtChainComponent content={thoughtChain} expanded={expanded} />
        )}
        <span
          className="flex flex-col gap-y-1"
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(renderMarkdown(msgToRender)),
          }}
        />
      </>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.role === nextProps.role &&
      prevProps.message === nextProps.message &&
      prevProps.expanded === nextProps.expanded
    );
  }
);
