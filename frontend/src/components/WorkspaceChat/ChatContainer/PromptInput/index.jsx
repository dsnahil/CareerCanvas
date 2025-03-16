import React, { useState, useRef, useEffect } from "react";
import SlashCommandsButton, {
  SlashCommands,
  useSlashCommands,
} from "./SlashCommands";
import debounce from "lodash.debounce";
import { PaperPlaneRight } from "@phosphor-icons/react";
import StopGenerationButton from "./StopGenerationButton";
import AvailableAgentsButton, {
  AvailableAgents,
  useAvailableAgents,
} from "./AgentMenu";
import TextSizeButton from "./TextSizeMenu";
import SpeechToText from "./SpeechToText";
import { Tooltip } from "react-tooltip";
import AttachmentManager from "./Attachments";
import AttachItem from "./AttachItem";
import { PASTE_ATTACHMENT_EVENT } from "../DnDWrapper";
import useTextSize from "@/hooks/useTextSize";
import { useTranslation } from "react-i18next";

export const PROMPT_INPUT_EVENT = "set_prompt_input";
const MAX_EDIT_STACK_SIZE = 100;

export default function PromptInput({
  message,
  handleMessageChange,
  handleSubmit,
  disabled,
  workspace,
  sendCommand,
  isListening,
  endSTTSession,
  submit,
  onChange,
  isStreaming,
  attachments = [],
}) {
  const { t } = useTranslation();
  const { showAgents, setShowAgents } = useAvailableAgents();
  const { showSlashCommand, setShowSlashCommand } = useSlashCommands();
  const formRef = useRef(null);
  const textareaRef = useRef(null);
  const [focused, setFocused] = useState(false);
  const undoStack = useRef([]);
  const redoStack = useRef([]);
  const { textSizeClass } = useTextSize();
  const [attachmentsOpen, setAttachmentsOpen] = useState(false);

  // Use either new or legacy props
  const actualMessage = message || "";
  const actualHandleMessageChange = handleMessageChange || onChange;
  const actualHandleSubmit = handleSubmit || submit;
  const actualDisabled = disabled || isStreaming;
  const actualIsListening = isListening || false;

  /**
   * To prevent too many re-renders we remotely listen for updates from the parent
   * via an event cycle. Otherwise, using message as a prop leads to a re-render every
   * change on the input.
   * @param {Event} e
   */
  function handlePromptUpdate(e) {
    actualHandleMessageChange({ target: { value: e?.detail ?? "" } });
  }

  useEffect(() => {
    if (!!window)
      window.addEventListener(PROMPT_INPUT_EVENT, handlePromptUpdate);
    return () =>
      window?.removeEventListener(PROMPT_INPUT_EVENT, handlePromptUpdate);
  }, []);

  useEffect(() => {
    if (!actualIsListening && textareaRef.current) textareaRef.current.focus();
    resetTextAreaHeight();
  }, [actualIsListening]);

  /**
   * Save the current state before changes
   * @param {number} adjustment
   */
  function saveCurrentState(adjustment = 0) {
    if (undoStack.current.length >= MAX_EDIT_STACK_SIZE)
      undoStack.current.shift();
    undoStack.current.push({
      value: actualMessage,
      cursorPositionStart: textareaRef.current.selectionStart + adjustment,
      cursorPositionEnd: textareaRef.current.selectionEnd + adjustment,
    });
  }
  const debouncedSaveState = debounce(saveCurrentState, 250);

  function handleSubmitForm(e) {
    e.preventDefault();
    actualHandleSubmit(e);
  }

  function resetTextAreaHeight() {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
  }

  function checkForSlash(e) {
    const input = e.target.value;
    if (input === "/") setShowSlashCommand(true);
    if (showSlashCommand) setShowSlashCommand(false);
    return;
  }
  const watchForSlash = debounce(checkForSlash, 300);

  function checkForAt(e) {
    const input = e.target.value;
    if (input === "@") return setShowAgents(true);
    if (showAgents) return setShowAgents(false);
  }
  const watchForAt = debounce(checkForAt, 300);

  /**
   * Capture enter key press to handle submission, redo, or undo
   * via keyboard shortcuts
   * @param {KeyboardEvent} event
   */
  function captureEnterOrUndo(event) {
    // Is simple enter key press w/o shift key
    if (event.keyCode === 13 && !event.shiftKey) {
      event.preventDefault();
      if (actualIsListening) return;
      return handleSubmitForm(event);
    }

    // Is undo with Ctrl+Z or Cmd+Z + Shift key = Redo
    if (
      (event.ctrlKey || event.metaKey) &&
      event.key === "z" &&
      event.shiftKey
    ) {
      event.preventDefault();
      if (redoStack.current.length === 0) return;

      const nextState = redoStack.current.pop();
      if (!nextState) return;

      undoStack.current.push({
        value: actualMessage,
        cursorPositionStart: textareaRef.current.selectionStart,
        cursorPositionEnd: textareaRef.current.selectionEnd,
      });
      actualHandleMessageChange({ target: { value: nextState.value } });
      setTimeout(() => {
        textareaRef.current.setSelectionRange(
          nextState.cursorPositionStart,
          nextState.cursorPositionEnd
        );
      }, 0);
    }

    // Undo with Ctrl+Z or Cmd+Z
    if (
      (event.ctrlKey || event.metaKey) &&
      event.key === "z" &&
      !event.shiftKey
    ) {
      if (undoStack.current.length === 0) return;
      const lastState = undoStack.current.pop();
      if (!lastState) return;

      redoStack.current.push({
        value: actualMessage,
        cursorPositionStart: textareaRef.current.selectionStart,
        cursorPositionEnd: textareaRef.current.selectionEnd,
      });
      actualHandleMessageChange({ target: { value: lastState.value } });
      setTimeout(() => {
        textareaRef.current.setSelectionRange(
          lastState.cursorPositionStart,
          lastState.cursorPositionEnd
        );
      }, 0);
    }
  }

  function adjustTextArea(event) {
    const element = event.target;
    element.style.height = "auto";
    element.style.height = `${element.scrollHeight}px`;
  }

  function handlePasteEvent(e) {
    e.preventDefault();
    if (e.clipboardData.items.length === 0) return false;

    // paste any clipboard items that are images.
    for (const item of e.clipboardData.items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        window.dispatchEvent(
          new CustomEvent(PASTE_ATTACHMENT_EVENT, {
            detail: { files: [file] },
          })
        );
        continue;
      }

      // handle files specifically that are not images as uploads
      if (item.kind === "file") {
        const file = item.getAsFile();
        window.dispatchEvent(
          new CustomEvent(PASTE_ATTACHMENT_EVENT, {
            detail: { files: [file] },
          })
        );
        continue;
      }
    }

    const pasteText = e.clipboardData.getData("text/plain");
    if (pasteText) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newPromptInput =
        actualMessage.substring(0, start) +
        pasteText +
        actualMessage.substring(end);
      actualHandleMessageChange({ target: { value: newPromptInput } });

      // Set the cursor position after the pasted text
      // we need to use setTimeout to prevent the cursor from being set to the end of the text
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd =
          start + pasteText.length;
      }, 0);
    }
    return;
  }

  return (
    <div className="relative w-full">
      {showSlashCommand && (
        <SlashCommands
          setPromptInput={(text) => {
            actualHandleMessageChange({ target: { value: text } });
            textareaRef.current.focus();
          }}
          closeMenu={() => setShowSlashCommand(false)}
          currentInput={actualMessage}
        />
      )}
      {showAgents && (
        <AvailableAgents
          setPromptInput={(text) => {
            actualHandleMessageChange({ target: { value: text } });
            textareaRef.current.focus();
          }}
          closeMenu={() => setShowAgents(false)}
          currentInput={actualMessage}
          workspace={workspace}
        />
      )}

      <form
        ref={formRef}
        onSubmit={handleSubmitForm}
        className="relative flex items-end w-full"
      >
        <div className="relative flex-1">
          <div className={`relative w-full ${attachmentsOpen ? "mb-2" : ""}`}>
            <div
              className={`relative w-full rounded-xl overflow-hidden border border-slate-600/30 shadow-md transition-all ${
                focused ? "ring-2 ring-indigo-500/50" : ""
              }`}
            >
              <textarea
                ref={textareaRef}
                value={actualMessage}
                onChange={actualHandleMessageChange}
                onKeyDown={captureEnterOrUndo}
                onInput={adjustTextArea}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                onPaste={(e) => {
                  saveCurrentState();
                  handlePasteEvent(e);
                }}
                disabled={actualDisabled}
                className={`${textSizeClass} w-full max-h-[200px] min-h-[56px] px-4 py-3 pr-[120px] bg-transparent text-white placeholder-gray-400 outline-none resize-none scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent`}
                placeholder={t("chat.message-placeholder")}
                rows={1}
              />
              <div className="absolute right-2 bottom-2 flex items-center space-x-1">
                <div className="flex items-center space-x-1">
                  <AttachItem
                    attachmentsOpen={attachmentsOpen}
                    setAttachmentsOpen={setAttachmentsOpen}
                  />
                  <SlashCommandsButton
                    setShowSlashCommand={setShowSlashCommand}
                  />
                  <AvailableAgentsButton
                    setShowAgents={setShowAgents}
                    workspace={workspace}
                  />
                  <TextSizeButton />
                  <SpeechToText
                    isListening={actualIsListening}
                    endSTTSession={endSTTSession}
                    setPromptInput={(text) => {
                      actualHandleMessageChange({ target: { value: text } });
                    }}
                    currentInput={actualMessage}
                  />
                </div>
                {actualDisabled ? (
                  <StopGenerationButton />
                ) : (
                  <button
                    type="submit"
                    disabled={!actualMessage || actualMessage === ""}
                    className={`flex items-center justify-center w-8 h-8 rounded-lg ${
                      !actualMessage || actualMessage === ""
                        ? "text-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-indigo-600 to-indigo-800 text-white shadow-md hover:from-indigo-500 hover:to-indigo-700 transition-all"
                    }`}
                    data-tooltip-id="send-message"
                    data-tooltip-content={t("chat.send-message")}
                  >
                    <PaperPlaneRight weight="fill" size={18} />
                  </button>
                )}
              </div>
            </div>
          </div>
          <AttachmentManager
            attachments={attachments || []}
          />
        </div>
      </form>
      <Tooltip id="send-message" className="tooltip z-[100]" />
    </div>
  );
}
