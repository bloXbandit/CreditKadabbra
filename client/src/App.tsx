import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Home from "./pages/Home";
import Scores from "./pages/Scores";
import Accounts from "./pages/Accounts";
import Disputes from "./pages/Disputes";
import Wayfinder from "./pages/Wayfinder";
import Tasks from "./pages/Tasks";
import Documents from "./pages/Documents";
import Privacy from "./pages/Privacy";
import Progress from "./pages/Progress";

function Router() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path={"/"} component={Home} />
        <Route path={"/scores"} component={Scores} />
        <Route path={"/accounts"} component={Accounts} />
        <Route path={"/disputes"} component={Disputes} />
        <Route path={"/wayfinder"} component={Wayfinder} />
        <Route path={"/tasks"} component={Tasks} />
        <Route path={"/documents"} component={Documents} />
        <Route path={"/privacy"} component={Privacy} />
        <Route path={"/progress"} component={Progress} />
        <Route path={"/404"} component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
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
