import './i18n';
import React, { useLayoutEffect, useState, type ReactNode } from "react"; // Added 'type' here
import ReactDOM from "react-dom/client";
import { Router } from "react-router-dom";
import { history } from "./utils/history";
import type { BrowserHistory } from "history"; // Added 'type' here
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./index.css";

const queryClient = new QueryClient();

/**
 * Props for the CustomRouter to avoid 'any' linting errors.
 */
interface CustomRouterProps {
  history: BrowserHistory;
  children: ReactNode;
}

/**
 * CustomRouter bridges the external 'history' instance with React Router.
 * This allows us to navigate from outside React components (like in axios interceptors).
 */
export const CustomRouter = ({ history, children }: CustomRouterProps) => {
  const [state, setState] = useState({
    action: history.action,
    location: history.location,
  });

  // syncs the history instance changes with the React state
  useLayoutEffect(() => history.listen(setState), [history]);

  return (
    <Router
      navigationType={state.action}
      location={state.location}
      navigator={history}
    >
      {children}
    </Router>
  );
};

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <CustomRouter history={history}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </CustomRouter>
  </React.StrictMode>
);