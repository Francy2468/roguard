import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import ExecutorLogs from "./pages/ExecutorLogs";
import HwidBans from "./pages/HwidBans";
import Obfuscator from "./pages/Obfuscator";
import RemoteLoader from "./pages/RemoteLoader";
import Settings from "./pages/Settings";
import Scripts from "./pages/Scripts";
import Login from "./pages/Login";
import Register from "./pages/Register";
import GuestLogin from "./pages/GuestLogin";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/scripts" component={Scripts} />
      <Route path="/executor-logs" component={ExecutorLogs} />
      <Route path="/hwid-bans" component={HwidBans} />
      <Route path="/obfuscator" component={Obfuscator} />
      <Route path="/remote-loader" component={RemoteLoader} />
      <Route path="/settings" component={Settings} />
      <Route path="/auth/login" component={Login} />
      <Route path="/auth/register" component={Register} />
      <Route path="/auth/guest" component={GuestLogin} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
