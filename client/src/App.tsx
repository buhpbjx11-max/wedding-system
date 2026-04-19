import React, { Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import WeddingLayout from "./components/WeddingLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

const PageLoader = () => (
  <div className="flex items-center justify-center h-96">
    <Loader2 className="w-7 h-7 animate-spin text-accent" />
  </div>
);

function Router() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  const GuestRSVP = React.lazy(() => import("./pages/GuestRSVP"));

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/guest-rsvp/:token">
          {(params: any) => (
            <Suspense fallback={<PageLoader />}>
              <GuestRSVP token={params.token} />
            </Suspense>
          )}
        </Route>
        <Route component={NotFound} />
      </Switch>
    );
  }

  const Dashboard = React.lazy(() => import("./pages/Dashboard"));
  const Guests = React.lazy(() => import("./pages/Guests"));
  const Invitations = React.lazy(() => import("./pages/Invitations"));
  const Designs = React.lazy(() => import("./pages/Designs"));
  const RSVPSummary = React.lazy(() => import("./pages/RSVPSummary"));
  const Seating = React.lazy(() => import("./pages/Seating"));
  const Settings = React.lazy(() => import("./pages/Settings"));
  const Onboarding = React.lazy(() => import("./pages/Onboarding"));

  return <AuthenticatedApp
    Dashboard={Dashboard} Guests={Guests} Invitations={Invitations}
    Designs={Designs} RSVPSummary={RSVPSummary} Seating={Seating}
    Settings={Settings} Onboarding={Onboarding} GuestRSVP={GuestRSVP}
  />;
}

function AuthenticatedApp({ Dashboard, Guests, Invitations, Designs, RSVPSummary, Seating, Settings, Onboarding, GuestRSVP }: any) {
  const { data: wedding, isLoading: weddingLoading } = trpc.wedding.get.useQuery();

  if (weddingLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!wedding?.brideNames) {
    return (
      <Suspense fallback={<div className="flex items-center justify-center h-screen"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>}>
        <Onboarding />
      </Suspense>
    );
  }

  return (
    <WeddingLayout>
      <Suspense fallback={<div className="flex items-center justify-center h-96"><Loader2 className="w-7 h-7 animate-spin text-accent" /></div>}>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/guests" component={Guests} />
          <Route path="/invitations" component={Invitations} />
          <Route path="/designs" component={Designs} />
          <Route path="/rsvp" component={RSVPSummary} />
          <Route path="/seating" component={Seating} />
          <Route path="/settings" component={Settings} />
          <Route path="/guest-rsvp/:token">
            {(params: any) => (
              <Suspense fallback={<div className="flex items-center justify-center h-96"><Loader2 className="w-7 h-7 animate-spin text-accent" /></div>}>
                <GuestRSVP token={params.token} />
              </Suspense>
            )}
          </Route>
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </WeddingLayout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
