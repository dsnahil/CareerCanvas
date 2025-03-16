import React, { useEffect, useRef, useState } from "react";
import { List, ChatCircle, FileText, FileDoc, Users, VideoCamera } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
import useLogo from "@/hooks/useLogo";
import useUser from "@/hooks/useUser";
import SettingsButton from "../SettingsButton";
import { useTranslation } from "react-i18next";
import NewWorkspaceModal, { useNewWorkspaceModal } from "../Modals/NewWorkspace";
import ActiveWorkspaces from "./ActiveWorkspaces";
import Footer from "../Footer";

export default function SidebarMobileHeader() {
  const { logo } = useLogo();
  const sidebarRef = useRef(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showBgOverlay, setShowBgOverlay] = useState(false);
  const {
    showing: showingNewWsModal,
    showModal: showNewWsModal,
    hideModal: hideNewWsModal,
  } = useNewWorkspaceModal();
  const { user } = useUser();
  const { t } = useTranslation();
  const [activeMenuItem, setActiveMenuItem] = useState("generalChat");

  // Main menu items
  const mainMenuItems = [
    { id: "generalChat", name: "General Chat", icon: ChatCircle },
    { id: "resumeManager", name: "Resume Manager", icon: FileText },
    { id: "coverLetters", name: "Cover Letters", icon: FileDoc, path: "/cover-letters" },
    { id: "mockInterviews", name: "Mock Interviews", icon: Users },
    { id: "interview", name: "Interview Practice", icon: VideoCamera, path: "/interview" },
  ];

  useEffect(() => {
    // Darkens the rest of the screen
    // when sidebar is open.
    function handleBg() {
      if (showSidebar) {
        setTimeout(() => {
          setShowBgOverlay(true);
        }, 300);
      } else {
        setShowBgOverlay(false);
      }
    }
    handleBg();
  }, [showSidebar]);

  return (
    <>
      <div
        aria-label="Show sidebar"
        className="fixed top-0 left-0 right-0 z-10 flex justify-between items-center px-4 py-2 bg-theme-bg-sidebar light:bg-white text-slate-200 shadow-lg h-16"
      >
        <button
          onClick={() => setShowSidebar(true)}
          className="rounded-md p-2 flex items-center justify-center text-theme-text-secondary"
        >
          <List className="h-6 w-6" />
        </button>
        <div className="flex items-center justify-center flex-grow">
          <img
            src={logo}
            alt="Logo"
            className="block mx-auto h-6 w-auto"
            style={{ maxHeight: "40px", objectFit: "contain" }}
          />
        </div>
        <div className="w-12"></div>
      </div>
      <div
        style={{
          transform: showSidebar ? `translateX(0vw)` : `translateX(-100vw)`,
        }}
        className={`z-99 fixed top-0 left-0 transition-all duration-500 w-[100vw] h-[100vh]`}
      >
        <div
          className={`${
            showBgOverlay
              ? "transition-all opacity-1"
              : "transition-none opacity-0"
          }  duration-500 fixed top-0 left-0 bg-theme-bg-secondary bg-opacity-75 w-screen h-screen`}
          onClick={() => setShowSidebar(false)}
        />
        <div
          ref={sidebarRef}
          className="relative h-[100vh] fixed top-0 left-0 bg-theme-bg-sidebar w-[80%] p-[18px]"
        >
          <div className="w-full h-full flex flex-col overflow-x-hidden items-between">
            {/* Header Information */}
            <div className="flex w-full items-center justify-between gap-x-4">
              <div className="flex shrink-1 w-fit items-center justify-start">
                <img
                  src={logo}
                  alt="Logo"
                  className="rounded w-full max-h-[40px]"
                  style={{ objectFit: "contain" }}
                />
              </div>
              {(!user || user?.role !== "default") && (
                <div className="flex gap-x-2 items-center text-slate-500 shink-0">
                  <SettingsButton />
                </div>
              )}
            </div>

            {/* Primary Body */}
            <div className="h-full flex flex-col w-full justify-between pt-4 ">
              <div className="h-auto md:sidebar-items">
                <div className="flex flex-col gap-y-4 overflow-y-scroll no-scroll pb-[60px]">
                  {/* Main Menu Items */}
                  <div className="flex flex-col gap-y-2 mb-4">
                    {mainMenuItems.map((item) => {
                      const MenuItem = item.icon;
                      return (
                        item.path ? (
                          <Link
                            key={item.id}
                            to={item.path}
                            onClick={() => setShowSidebar(false)}
                            className={`
                              flex items-center gap-x-3 py-3 px-4 transition-all duration-300
                              ${activeMenuItem === item.id 
                                ? "bg-gradient-to-r from-indigo-600/30 to-indigo-800/20 shadow-md border-l-4 border-indigo-500" 
                                : "hover:bg-theme-sidebar-item-hover"}
                            `}
                          >
                            <MenuItem 
                              size={22} 
                              weight={activeMenuItem === item.id ? "fill" : "regular"} 
                              className={`sidebar-menu-item-icon ${activeMenuItem === item.id ? "text-indigo-400" : ""}`}
                            />
                            <span className={`text-sm sidebar-menu-item ${activeMenuItem === item.id ? "font-semibold" : "font-medium"}`}>
                              {item.name}
                            </span>
                          </Link>
                        ) : (
                          <button
                            key={item.id}
                            onClick={() => setActiveMenuItem(item.id)}
                            className={`
                              flex items-center gap-x-3 py-3 px-4 transition-all duration-300
                              ${activeMenuItem === item.id 
                                ? "bg-gradient-to-r from-indigo-600/30 to-indigo-800/20 shadow-md border-l-4 border-indigo-500" 
                                : "hover:bg-theme-sidebar-item-hover"}
                            `}
                          >
                            <MenuItem 
                              size={22} 
                              weight={activeMenuItem === item.id ? "fill" : "regular"} 
                              className={`sidebar-menu-item-icon ${activeMenuItem === item.id ? "text-indigo-400" : ""}`}
                            />
                            <span className={`text-sm sidebar-menu-item ${activeMenuItem === item.id ? "font-semibold" : "font-medium"}`}>
                              {item.name}
                            </span>
                          </button>
                        )
                      );
                    })}
                  </div>

                  {/* Workspace content */}
                  {activeMenuItem === "generalChat" && (
                    <div className="workspace-container active">
                      <div className="flex flex-col gap-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-theme-text-secondary">
                            Workspaces
                          </p>
                          <button
                            onClick={showNewWsModal}
                            className="flex items-center justify-center p-1 rounded-md hover:bg-theme-sidebar-item-hover"
                          >
                            <Plus size={18} className="text-theme-text-secondary" />
                          </button>
                        </div>
                        <ActiveWorkspaces />
                      </div>
                    </div>
                  )}

                  {/* Placeholder for other menu items */}
                  {activeMenuItem !== "generalChat" && activeMenuItem !== "interview" && (
                    <div className="workspace-container active">
                      <div className="flex flex-col items-center justify-center p-6 text-center">
                        {(() => {
                          const MenuItem = mainMenuItems.find(item => item.id === activeMenuItem).icon;
                          return (
                            <MenuItem 
                              size={48} 
                              className="text-theme-text-secondary mb-4"
                            />
                          );
                        })()}
                        <p className="text-theme-text-secondary">
                          {mainMenuItems.find(item => item.id === activeMenuItem).name} functionality coming soon
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 pt-4 pb-3 bg-theme-bg-sidebar bg-opacity-80 backdrop-filter backdrop-blur-md z-1">
                <Footer />
              </div>
            </div>
          </div>
        </div>
        {showingNewWsModal && <NewWorkspaceModal hideModal={hideNewWsModal} />}
      </div>
    </>
  );
} 