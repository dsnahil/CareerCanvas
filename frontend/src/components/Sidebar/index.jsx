import React, { useRef, useState } from "react";
import { ChatCircle, FileDoc, FileText, Plus, VideoCamera, GraduationCap, FilmStrip } from "@phosphor-icons/react";
import NewWorkspaceModal, { useNewWorkspaceModal } from "../Modals/NewWorkspace";
import ActiveWorkspaces from "./ActiveWorkspaces";
import useLogo from "@/hooks/useLogo";
import useUser from "@/hooks/useUser";
import Footer from "../Footer";
import { Link, useMatch } from "react-router-dom";
import paths from "@/utils/paths";
import { useTranslation } from "react-i18next";
import { ToggleSidebarButton, useSidebarToggle } from "./SidebarToggle";
import SidebarMobileHeader from "./SidebarMobileHeader";
import SettingsSidebar from "@/components/SettingsSidebar/index.jsx";

export default function Sidebar() {
  const isInSettings = !!useMatch("/settings/*");
  const { user } = useUser();
  const { logo } = useLogo();
  const sidebarRef = useRef(null);
  const { showSidebar, setShowSidebar, canToggleSidebar } = useSidebarToggle();
  const { showing: showingNewWsModal, showModal: showNewWsModal, hideModal: hideNewWsModal } = useNewWorkspaceModal();
  const { t } = useTranslation();
  const [activeMenuItem, setActiveMenuItem] = useState("generalChat");

  // Main menu items
  const mainMenuItems = [
    { id: "generalChat", name: "General Chat", icon: ChatCircle, path: "/" },
    { id: "speech", name: "Speech Practice", icon: GraduationCap, path: "/learning" },
    {
      id: "resumeManager",
      name: "Resume Manager",
      icon: FileText,
      path: "/resume-manager"
    },
    {
      id: "coverLetters",
      name: "Cover Letters",
      icon: FileDoc,
      path: "/cover-letters",
    },
    {
      id: "interview",
      name: "Interview Practice",
      icon: VideoCamera,
      path: "/interview",
    },
    {
      id: "recordings",
      name: "My Recordings",
      icon: FilmStrip,
      path: "/recordings",
    },
  ];

  return isInSettings ? (
    <SettingsSidebar />
  ) : (
    <>
      <div
        style={{
          width: showSidebar ? "292px" : "0px",
          paddingLeft: showSidebar ? "0px" : "16px",
        }}
        className="transition-all duration-500"
      >
        <div className="flex shrink-0 w-full justify-center my-[18px]">
          <div className="flex justify-between w-[250px] min-w-[250px]">
            <Link to={paths.home()} aria-label="Home">
              <img
                src={logo}
                alt="Logo"
                className={`rounded max-h-[24px] object-contain transition-opacity duration-500 ${showSidebar ? "opacity-100" : "opacity-0"}`}
              />
            </Link>
            {<ToggleSidebarButton showSidebar={showSidebar} setShowSidebar={setShowSidebar} />}
          </div>
        </div>
        <div
          ref={sidebarRef}
          className="relative bg-theme-bg-sidebar border-r border-theme-sidebar-border light:border-none p-[10px] h-[calc(100%-76px)]"
        >
          <div className="flex flex-col h-full overflow-x-hidden">
            <div className="flex-grow flex flex-col min-w-[235px]">
              <div className="relative h-[calc(100%-60px)] flex flex-col w-full justify-between pt-[10px] overflow-y-scroll no-scroll">
                <div className="flex flex-col gap-y-2 pb-[60px] overflow-y-scroll no-scroll">
                  {/* Main Menu Items */}
                  <div className="flex flex-col gap-y-2 mb-4">
                    {mainMenuItems.map((item) => {
                      const MenuItem = item.icon;
                      return item.path ? (
                        <Link
                          key={item.id}
                          to={item.path}
                          onClick={() => setActiveMenuItem(item.id)}
                          className={`
                              flex items-center gap-x-3 py-3 px-4 transition-all duration-300
                              ${activeMenuItem === item.id
                              ? "bg-gradient-to-r from-indigo-600/30 to-indigo-800/20 shadow-md border-l-4 border-indigo-500"
                              : "hover:bg-theme-sidebar-item-hover"
                            }
                            `}
                        >
                          <MenuItem
                            size={22}
                            weight={activeMenuItem === item.id ? "fill" : "regular"}
                            className={`sidebar-menu-item-icon ${activeMenuItem === item.id ? "text-indigo-400" : ""}`}
                          />
                          <span
                            className={`text-sm sidebar-menu-item ${activeMenuItem === item.id ? "font-semibold" : "font-medium"}`}
                          >
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
                              : "hover:bg-theme-sidebar-item-hover"
                            }
                            `}
                        >
                          <MenuItem
                            size={22}
                            weight={activeMenuItem === item.id ? "fill" : "regular"}
                            className={`sidebar-menu-item-icon ${activeMenuItem === item.id ? "text-indigo-400" : ""}`}
                          />
                          <span
                            className={`text-sm sidebar-menu-item ${activeMenuItem === item.id ? "font-semibold" : "font-medium"}`}
                          >
                            {item.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* General Chat content with nested workspace items */}
                  <div className={`workspace-container ${activeMenuItem === "generalChat" ? "active" : ""}`}>
                    <div className="flex gap-x-2 items-center justify-between">
                      {(!user || user?.role !== "default") && (
                        <button
                          onClick={showNewWsModal}
                          className="light:bg-[#C2E7FE] light:hover:bg-[#7CD4FD] flex flex-grow w-[75%] h-[44px] gap-x-2 py-[5px] px-2.5 mb-2 bg-gradient-to-r from-indigo-600/20 to-indigo-800/10 border border-indigo-500/20 rounded-[8px] text-sidebar justify-center items-center hover:bg-opacity-80 transition-all duration-300 shadow-md"
                        >
                          <Plus className="h-5 w-5 text-indigo-400" />
                          <p className="text-white text-sm font-semibold">{t("new-workspace.title")}</p>
                        </button>
                      )}
                    </div>
                    <ActiveWorkspaces />
                  </div>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 pt-4 pb-3 rounded-b-[16px] bg-theme-bg-sidebar bg-opacity-80 backdrop-filter backdrop-blur-md z-1">
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

export { SidebarMobileHeader };
