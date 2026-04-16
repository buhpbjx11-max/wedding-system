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

function Router() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  // Public guest RSVP route (no auth required)
  const GuestRSVP = React.lazy(() => import("./pages/GuestRSVP"));

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path={"/"} component={Home} />
        <Route path={"/guest-rsvp/:token"}>
          {(params: any) => <GuestRSVP token={params.token} />}
        </Route>
        <Route path={"/404"} component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  // Protected routes with WeddingLayout
  const Dashboard = React.lazy(() => import("./pages/Dashboard"));
  const Guests = React.lazy(() => import("./pages/Guests"));
  const Invitations = React.lazy(() => import("./pages/Invitations"));
  const RSVPSummary = React.lazy(() => import("./pages/RSVPSummary"));
  const Seating = React.lazy(() => import("./pages/Seating"));
  const Budget = React.lazy(() => import("./pages/Budget"));
  const Timeline = React.lazy(() => import("./pages/Timeline"));
  const Gallery = React.lazy(() => import("./pages/Gallery"));

  return (
    <WeddingLayout>
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-96">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        }
      >
        <Switch>
          <Route path={"/"} component={Dashboard} />
          <Route path={"/guests"} component={Guests} />
          <Route path={"/invitations"} component={Invitations} />
          <Route path={"/rsvp"} component={RSVPSummary} />
          <Route path={"/seating"} component={Seating} />
          <Route path={"/budget"} component={Budget} />
          <Route path={"/timeline"} component={Timeline} />
          <Route path={"/gallery"} component={Gallery} />
          <Route path={"/404"} component={NotFound} />
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
