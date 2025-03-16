import React, { lazy, Suspense } from "react";
import { Routes, Route, Outlet } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import { ContextWrapper } from "@/AuthContext";
import PrivateRoute, { AdminRoute, ManagerRoute } from "@/components/PrivateRoute";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Login from "@/pages/Login";
import SimpleSSOPassthrough from "@/pages/Login/SSO/simple";
import OnboardingFlow from "@/pages/OnboardingFlow";
import i18n from "./i18n";
import GeneralAppearance from "@/pages/GeneralSettings/Appearance";

import { PfpProvider } from "./PfpContext";
import { LogoProvider } from "./LogoContext";
import { FullScreenLoader } from "./components/Preloader";
import { ThemeProvider } from "./ThemeContext";
import Sidebar from "@/components/Sidebar/index.jsx";
import RecordingsPage from "@/pages/RecordingsPage";

const Main = lazy(() => import("@/pages/index.jsx"));
const InvitePage = lazy(() => import("@/pages/Invite"));
const WorkspaceChat = lazy(() => import("@/pages/WorkspaceChat"));
const AdminUsers = lazy(() => import("@/pages/Admin/Users"));
const AdminInvites = lazy(() => import("@/pages/Admin/Invitations"));
const AdminWorkspaces = lazy(() => import("@/pages/Admin/Workspaces"));
const AdminLogs = lazy(() => import("@/pages/Admin/Logging"));
const AdminAgents = lazy(() => import("@/pages/Admin/Agents"));
const GeneralChats = lazy(() => import("@/pages/GeneralSettings/Chats"));
const GeneralApiKeys = lazy(() => import("@/pages/GeneralSettings/ApiKeys"));
const GeneralLLMPreference = lazy(() => import("@/pages/GeneralSettings/LLMPreference"));
const GeneralTranscriptionPreference = lazy(() => import("@/pages/GeneralSettings/TranscriptionPreference"));
const GeneralAudioPreference = lazy(() => import("@/pages/GeneralSettings/AudioPreference"));
const GeneralEmbeddingPreference = lazy(() => import("@/pages/GeneralSettings/EmbeddingPreference"));
const EmbeddingTextSplitterPreference = lazy(() => import("@/pages/GeneralSettings/EmbeddingTextSplitterPreference"));
const GeneralVectorDatabase = lazy(() => import("@/pages/GeneralSettings/VectorDatabase"));
const GeneralSecurity = lazy(() => import("@/pages/GeneralSettings/Security"));
const GeneralBrowserExtension = lazy(() => import("@/pages/GeneralSettings/BrowserExtensionApiKey"));
const WorkspaceSettings = lazy(() => import("@/pages/WorkspaceSettings"));
const EmbedConfigSetup = lazy(() => import("@/pages/GeneralSettings/EmbedConfigs"));
const EmbedChats = lazy(() => import("@/pages/GeneralSettings/EmbedChats"));
const PrivacyAndData = lazy(() => import("@/pages/GeneralSettings/PrivacyAndData"));
const ExperimentalFeatures = lazy(() => import("@/pages/Admin/ExperimentalFeatures"));
const LiveDocumentSyncManage = lazy(() => import("@/pages/Admin/ExperimentalFeatures/Features/LiveSync/manage"));
const AgentBuilder = lazy(() => import("@/pages/Admin/AgentBuilder"));
const Interview = lazy(() => import("@/pages/Interview"));
const CoverLetters = lazy(() => import("@/pages/CoverLetters"));

const CommunityHubTrending = lazy(() => import("@/pages/GeneralSettings/CommunityHub/Trending"));
const CommunityHubAuthentication = lazy(() => import("@/pages/GeneralSettings/CommunityHub/Authentication"));
const CommunityHubImportItem = lazy(() => import("@/pages/GeneralSettings/CommunityHub/ImportItem"));
const ResumeManager = lazy(() => import("@/pages/ResumeManager"));

// Learning pages
const Learning = lazy(() => import("@/pages/Learning"));
const MetaphorMania = lazy(() => import("@/pages/Learning/MetaphorMania"));
const SpinAYarn = lazy(() => import("@/pages/Learning/SpinAYarn"));
const NoFiller = lazy(() => import("@/pages/Learning/NoFiller"));
const Storyteller = lazy(() => import("@/pages/Learning/Storyteller"));

const Layout = () => {
  return (
    <div className="w-screen h-screen bg-theme-bg-container flex">
      <Sidebar />
      <Outlet />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <Suspense fallback={<FullScreenLoader />}>
        <ContextWrapper>
          <LogoProvider>
            <PfpProvider>
              <I18nextProvider i18n={i18n}>
                <Routes>
                  <Route path="/" element={<Layout />}>
                    <Route index element={<PrivateRoute Component={Main} />} />

                    <Route path="/login" element={<Login />} />
                    <Route path="/sso/simple" element={<SimpleSSOPassthrough />} />
                    <Route path="/accept-invite/:code" element={<InvitePage />} />

                    {/* Workspace routes */}
                    <Route path="/workspace/:slug" element={<PrivateRoute Component={WorkspaceChat} />}>
                      <Route path="t/:threadSlug" element={<WorkspaceChat />} />
                      <Route path="settings/:tab" element={<ManagerRoute Component={WorkspaceSettings} />} />
                    </Route>

                    {/* Learning routes */}
                    <Route path="/learning" element={<PrivateRoute Component={Learning} />} />
                    <Route path="/learning/metaphor-mania" element={<PrivateRoute Component={MetaphorMania} />} />
                    <Route path="/learning/spin-a-yarn" element={<PrivateRoute Component={SpinAYarn} />} />
                    <Route path="/learning/no-filler" element={<PrivateRoute Component={NoFiller} />} />
                    <Route path="/learning/storyteller" element={<PrivateRoute Component={Storyteller} />} />

                    {/* Settings routes */}
                    <Route path="/settings">
                      {/* Admin routes */}
                      <Route path="llm-preference" element={<AdminRoute Component={GeneralLLMPreference} />} />
                      <Route
                        path="transcription-preference"
                        element={<AdminRoute Component={GeneralTranscriptionPreference} />}
                      />
                      <Route path="audio-preference" element={<AdminRoute Component={GeneralAudioPreference} />} />
                      <Route
                        path="embedding-preference"
                        element={<AdminRoute Component={GeneralEmbeddingPreference} />}
                      />
                      <Route
                        path="text-splitter-preference"
                        element={<AdminRoute Component={EmbeddingTextSplitterPreference} />}
                      />
                      <Route path="vector-database" element={<AdminRoute Component={GeneralVectorDatabase} />} />
                      <Route path="event-logs" element={<AdminRoute Component={AdminLogs} />} />
                      <Route path="embed-config" element={<AdminRoute Component={EmbedConfigSetup} />} />
                      <Route path="embed-chats" element={<AdminRoute Component={EmbedChats} />} />
                      <Route path="privacy" element={<AdminRoute Component={PrivacyAndData} />} />
                      <Route path="beta-features" element={<AdminRoute Component={ExperimentalFeatures} />} />
                      <Route path="api-keys" element={<AdminRoute Component={GeneralApiKeys} />} />

                      {/* Agents routes */}
                      <Route path="agents" element={<AdminRoute Component={AdminAgents} />} />
                      <Route
                        path="agents/builder"
                        element={<AdminRoute Component={AgentBuilder} hideUserMenu={true} />}
                      />
                      <Route
                        path="agents/builder/:flowId"
                        element={<AdminRoute Component={AgentBuilder} hideUserMenu={true} />}
                      />

                      {/* Manager routes */}
                      <Route path="security" element={<ManagerRoute Component={GeneralSecurity} />} />
                      <Route path="appearance" element={<ManagerRoute Component={GeneralAppearance} />} />
                      <Route path="browser-extension" element={<ManagerRoute Component={GeneralBrowserExtension} />} />
                      <Route path="workspace-chats" element={<ManagerRoute Component={GeneralChats} />} />
                      <Route path="invites" element={<ManagerRoute Component={AdminInvites} />} />
                      <Route path="users" element={<ManagerRoute Component={AdminUsers} />} />
                      <Route path="workspaces" element={<ManagerRoute Component={AdminWorkspaces} />} />

                      {/* Community hub routes */}
                      <Route path="community-hub">
                        <Route path="trending" element={<AdminRoute Component={CommunityHubTrending} />} />
                        <Route path="authentication" element={<AdminRoute Component={CommunityHubAuthentication} />} />
                        <Route path="import-item" element={<AdminRoute Component={CommunityHubImportItem} />} />
                      </Route>

                      {/* Beta feature routes */}
                      <Route
                        path="beta-features/live-document-sync/manage"
                        element={<AdminRoute Component={LiveDocumentSyncManage} />}
                      />
                    </Route>

                    {/* Onboarding routes */}
                    <Route path="/onboarding">
                      <Route index element={<OnboardingFlow />} />
                      <Route path=":step" element={<OnboardingFlow />} />
                    </Route>

                    {/* Other standalone routes */}
                    <Route path="/interview" element={<PrivateRoute Component={Interview} />} />
                    <Route path="/recordings" element={<PrivateRoute Component={RecordingsPage} />} />
                    <Route path="/cover-letters" element={<PrivateRoute Component={CoverLetters} />} />
                    <Route path="/resume-manager" element={<PrivateRoute Component={ResumeManager} />} />
                  </Route>
                </Routes>
                <ToastContainer />
              </I18nextProvider>
            </PfpProvider>
          </LogoProvider>
        </ContextWrapper>
      </Suspense>
    </ThemeProvider>
  );
}
