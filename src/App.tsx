import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { OfflineIndicator } from "@/components/ui/offline-indicator";
import { PageLoader } from "@/components/ui/loading-spinner";

// Lazy load all pages for code splitting
const Index = lazy(() => import("./pages/Index"));
const Verification = lazy(() => import("./pages/Verification"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Ballot = lazy(() => import("./pages/Ballot"));
const Results = lazy(() => import("./pages/Results"));
const About = lazy(() => import("./pages/About"));
const HowToVote = lazy(() => import("./pages/HowToVote"));
const Security = lazy(() => import("./pages/Security"));
const HelpCenter = lazy(() => import("./pages/HelpCenter"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Install = lazy(() => import("./pages/Install"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Admin pages
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUpload = lazy(() => import("./pages/admin/AdminUpload"));
const AdminVoters = lazy(() => import("./pages/admin/AdminVoters"));
const AdminCandidates = lazy(() => import("./pages/admin/AdminCandidates"));
const AdminConstituencies = lazy(() => import("./pages/admin/AdminConstituencies"));
const AdminIncidents = lazy(() => import("./pages/admin/AdminIncidents"));
const AdminAuditLogs = lazy(() => import("./pages/admin/AdminAuditLogs"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));

// Candidate pages
const CandidateLogin = lazy(() => import("./pages/candidate/CandidateLogin"));
const CandidateDashboard = lazy(() => import("./pages/candidate/CandidateDashboard"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <OfflineIndicator />
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/verification" element={<Verification />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/ballot" element={<Ballot />} />
            <Route path="/results" element={<Results />} />
            <Route path="/about" element={<About />} />
            <Route path="/how-to-vote" element={<HowToVote />} />
            <Route path="/security" element={<Security />} />
            <Route path="/help" element={<HelpCenter />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/install" element={<Install />} />
            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/upload" element={<AdminUpload />} />
            <Route path="/admin/voters" element={<AdminVoters />} />
            <Route path="/admin/candidates" element={<AdminCandidates />} />
            <Route path="/admin/constituencies" element={<AdminConstituencies />} />
            <Route path="/admin/incidents" element={<AdminIncidents />} />
            <Route path="/admin/audit-logs" element={<AdminAuditLogs />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            {/* Candidate Routes */}
            <Route path="/candidate/login" element={<CandidateLogin />} />
            <Route path="/candidate" element={<CandidateDashboard />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
