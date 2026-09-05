import { useEffect, useState } from "react";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import PublicLink from "./pages/PublicLink";


function OAuthCallback({ onLogin }) {
  useEffect(() => {

    const params = new URLSearchParams(
      window.location.search
    );

    const accessToken =
      params.get("access_token");

    const refreshToken =
      params.get("refresh_token");

    if (accessToken && refreshToken) {

      localStorage.setItem(
        "access_token",
        accessToken
      );

      localStorage.setItem(
        "refresh_token",
        refreshToken
      );

      // Remove tokens from browser URL
      window.history.replaceState(
        {},
        document.title,
        "/"
      );

      onLogin();

    } else {

      window.history.replaceState(
        {},
        document.title,
        "/"
      );

      onLogin();
    }

  }, [onLogin]);


  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center">

      <div className="text-center">

        <div className="text-5xl mb-4">
          ☁️
        </div>

        <h2 className="text-2xl font-bold text-slate-800">
          Signing you in...
        </h2>

        <p className="text-slate-500 mt-2">
          Please wait while VaultIQ prepares your dashboard.
        </p>

      </div>

    </div>
  );
}


function App() {

  const [page, setPage] = useState(() => {

    if (
      localStorage.getItem("access_token")
    ) {
      return "dashboard";
    }

    return "login";
  });


  // ==================================================
  // PUBLIC SHARED LINKS
  // ==================================================

  if (
    window.location.pathname.startsWith(
      "/shared/"
    )
  ) {
    return <PublicLink />;
  }


  // ==================================================
  // GOOGLE OAUTH CALLBACK
  // ==================================================

  if (
    window.location.pathname ===
    "/oauth/callback"
  ) {
    return (
      <OAuthCallback
        onLogin={() =>
          setPage("dashboard")
        }
      />
    );
  }


  // ==================================================
  // SIGNUP
  // ==================================================

  if (page === "signup") {
    return (
      <Signup
        onLogin={() =>
          setPage("login")
        }
      />
    );
  }


  // ==================================================
  // DASHBOARD
  // ==================================================

  if (page === "dashboard") {
    return <Dashboard />;
  }


  // ==================================================
  // LOGIN
  // ==================================================

  return (
    <Login
      onSignup={() =>
        setPage("signup")
      }
      onLogin={() =>
        setPage("dashboard")
      }
    />
  );
}


export default App;