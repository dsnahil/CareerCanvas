import React, { useState } from "react";
import {
  Plus,
  Gear,
  ChatCircleText,
  FileText,
  Lightning,
  Info,
} from "@phosphor-icons/react";
import NewWorkspaceModal, {
  useNewWorkspaceModal,
} from "../Modals/NewWorkspace";
import paths from "@/utils/paths";
import { isMobile } from "react-device-detect";
import { SidebarMobileHeader } from "../Sidebar";
import UserIcon from "../UserIcon";
import { userFromStorage } from "@/utils/request";
import useUser from "@/hooks/useUser";
import { useTranslation } from "react-i18next";
import Appearance from "@/models/appearance";
import { useChatMessageAlignment } from "@/hooks/useChatMessageAlignment";

export default function DefaultChatContainer() {
  const { showScrollbar } = Appearance.getSettings();
  const { user } = useUser();
  const {
    showing: showingNewWsModal,
    showModal: showNewWsModal,
    hideModal: hideNewWsModal,
  } = useNewWorkspaceModal();
  const { t } = useTranslation();

  return (
    <div
      style={{ 
        height: isMobile ? "100%" : "calc(100% - 32px)",
        maxHeight: "100vh" 
      }}
      className={`transition-all duration-500 relative md:ml-[2px] md:mr-[16px] md:my-[16px] md:rounded-[16px] bg-theme-bg-secondary light:border-[1px] light:border-theme-sidebar-border w-full h-full overflow-y-scroll ${
        showScrollbar ? "show-scrollbar" : "no-scroll"
      }`}
    >
      {isMobile && <SidebarMobileHeader />}
      
      <div className="flex flex-col items-center justify-center h-full p-4 md:p-8">
        <div className="max-w-3xl w-full bg-theme-bg-primary rounded-xl p-6 shadow-sm border border-theme-sidebar-border">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-theme-text-primary mb-2">Welcome to CareerCanvas</h1>
            <p className="text-theme-text-secondary">Your personal AI assistant platform</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {(!user || user?.role !== "default") && (
              <QuickActionCard 
                icon={<Plus className="h-5 w-5" />}
                title="Create Workspace"
                description="Start a new workspace for your projects"
                onClick={showNewWsModal}
              />
            )}
            
            <QuickActionCard 
              icon={<ChatCircleText className="h-5 w-5" />}
              title="Chat Interface"
              description="Interact with AI through natural conversation"
              onClick={() => {}}
            />
            
            <QuickActionCard 
              icon={<FileText className="h-5 w-5" />}
              title="Document Processing"
              description="Upload and analyze documents with AI"
              onClick={() => {}}
            />
            
            <QuickActionCard 
              icon={<Gear className="h-5 w-5" />}
              title="Settings"
              description="Configure your AI preferences"
              onClick={() => {}}
            />
          </div>
          
          <div className="bg-theme-bg-secondary p-4 rounded-lg border border-theme-sidebar-border">
            <div className="flex items-start gap-3">
              <div className="mt-1 text-theme-text-primary">
                <Info className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-medium text-theme-text-primary">Getting Started</h3>
                <p className="text-sm text-theme-text-secondary mt-1">
                  Create a workspace to start organizing your AI conversations and documents. 
                  Each workspace can have its own settings and data sources.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {showingNewWsModal && <NewWorkspaceModal hideModal={hideNewWsModal} />}
    </div>
  );
}

function QuickActionCard({ icon, title, description, onClick }) {
  return (
    <button 
      onClick={onClick}
      className="flex items-start gap-3 p-4 rounded-lg border border-theme-sidebar-border bg-theme-bg-primary hover:bg-theme-bg-secondary transition-all duration-200 text-left"
    >
      <div className="mt-1 text-theme-text-primary">
        {icon}
      </div>
      <div>
        <h3 className="font-medium text-theme-text-primary">{title}</h3>
        <p className="text-sm text-theme-text-secondary mt-1">{description}</p>
      </div>
    </button>
  );
}
