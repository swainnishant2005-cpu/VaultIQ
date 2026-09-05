import { useState } from "react";

function Login({ onSignup, onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ==================================================
  // NORMAL EMAIL/PASSWORD LOGIN
  // ==================================================

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
            password: password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Invalid email or password."
        );
      }

      localStorage.setItem(
        "access_token",
        data.access_token
      );

      localStorage.setItem(
        "refresh_token",
        data.refresh_token
      );

      if (rememberMe) {
        localStorage.setItem(
          "remember_me",
          "true"
        );
      } else {
        localStorage.removeItem(
          "remember_me"
        );
      }

      onLogin();

    } catch (err) {
      console.error("Login error:", err);

      setError(
        err.message ||
          "Unable to login. Please try again."
      );

    } finally {
      setLoading(false);
    }
  };


  // ==================================================
  // GOOGLE LOGIN
  // ==================================================

  const handleGoogleLogin = () => {
    setError("");

    window.location.href =
      "http://127.0.0.1:8000/api/auth/google";
  };


  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">

      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden flex min-h-[650px]">

        {/* =====================================================
            LEFT SIDE
        ===================================================== */}

        <div className="hidden md:flex md:w-1/2 relative overflow-hidden bg-gradient-to-br from-[#071a49] via-[#173681] to-[#1769ff] text-white p-10 flex-col justify-between">

          {/* Background circles */}

          <div className="absolute -top-32 -left-32 w-80 h-80 bg-blue-500/20 rounded-full" />

          <div className="absolute -bottom-40 right-[-80px] w-[400px] h-[400px] bg-blue-400/20 rounded-full" />


          {/* Logo */}

          <div className="relative z-10 flex items-center gap-3">

            <div className="w-12 h-12 rounded-xl bg-blue-400 flex items-center justify-center shadow-lg">
              <span className="text-2xl">
                ☁️
              </span>
            </div>

            <span className="text-2xl font-bold">
              Vault<span className="text-blue-300">
                IQ
              </span>
            </span>

          </div>


          {/* Main content */}

          <div className="relative z-10">

            <h1 className="text-5xl font-extrabold leading-tight">

              Your Files.
              <br />

              Your Space.
              <br />

              <span className="text-blue-300">
                Always With You.
              </span>

            </h1>


            <p className="mt-7 text-lg text-blue-100 max-w-lg">
              Store, access, and share your files securely
              from anywhere in the world.
            </p>


            {/* Features */}

            <div className="mt-10 space-y-6">

              <Feature
                icon="🛡️"
                title="Secure Storage"
                description="Your files are protected and safely stored."
              />

              <Feature
                icon="💻"
                title="Access Anywhere"
                description="Open your files anytime, on any device."
              />

              <Feature
                icon="👥"
                title="Easy Sharing"
                description="Share files and collaborate with others."
              />

            </div>

          </div>


          {/* Floating cards */}

          <div className="relative z-10 flex justify-end gap-4 mt-5">

            <div className="w-16 h-16 bg-red-500 rounded-xl rotate-[-8deg] flex items-center justify-center shadow-lg">
              📄
            </div>

            <div className="w-16 h-16 bg-blue-400 rounded-xl rotate-[5deg] flex items-center justify-center shadow-lg">
              ☁️
            </div>

            <div className="w-16 h-16 bg-purple-500 rounded-xl rotate-[8deg] flex items-center justify-center shadow-lg">
              🖼️
            </div>

          </div>

        </div>


        {/* =====================================================
            RIGHT SIDE
        ===================================================== */}

        <div className="w-full md:w-1/2 flex items-center justify-center p-8 md:p-12">

          <div className="w-full max-w-md">

            {/* Logo */}

            <div className="text-center mb-8">

              <div className="mx-auto w-14 h-14 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg">
                <span className="text-2xl">
                  ☁️
                </span>
              </div>

              <h2 className="mt-4 text-3xl font-bold text-slate-900">
                Vault<span className="text-blue-600">
                  IQ
                </span>
              </h2>

              <p className="mt-2 text-slate-500">
                Sign in to your cloud storage
              </p>

            </div>


            {/* Error message */}

            {error && (
              <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                {error}
              </div>
            )}


            {/* =================================================
                LOGIN FORM
            ================================================= */}

            <form onSubmit={handleLogin}>

              {/* Email */}

              <div className="mb-5">

                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Email
                </label>

                <div className="relative">

                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    ✉️
                  </span>

                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    required
                    className="w-full h-12 pl-12 pr-4 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />

                </div>

              </div>


              {/* Password */}

              <div className="mb-4">

                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Password
                </label>

                <div className="relative">

                  <span className="absolute left-4 top-1/2 -translate-y-1/2">
                    🔒
                  </span>

                  <input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    required
                    className="w-full h-12 pl-12 pr-12 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        !showPassword
                      )
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
                  >
                    {showPassword
                      ? "🙈"
                      : "👁️"}
                  </button>

                </div>

              </div>


              {/* Remember / Forgot */}

              <div className="flex items-center justify-between mb-6">

                <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">

                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) =>
                      setRememberMe(
                        e.target.checked
                      )
                    }
                    className="w-4 h-4"
                  />

                  Remember me

                </label>


                <button
                  type="button"
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  Forgot password?
                </button>

              </div>


              {/* Login */}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg transition disabled:opacity-60"
              >
                {loading
                  ? "Logging in..."
                  : "Login →"}
              </button>

            </form>


            {/* Divider */}

            <div className="flex items-center gap-4 my-7">

              <div className="flex-1 h-px bg-slate-200" />

              <span className="text-sm text-slate-400">
                or continue with
              </span>

              <div className="flex-1 h-px bg-slate-200" />

            </div>


            {/* =================================================
                SOCIAL LOGIN BUTTONS
            ================================================= */}

            <div className="grid grid-cols-3 gap-3">

              {/* GOOGLE */}

              <button
                type="button"
                onClick={handleGoogleLogin}
                className="h-12 border border-slate-300 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-50 transition"
              >

                <GoogleIcon />

                <span className="font-medium text-slate-700">
                  Google
                </span>

              </button>


              {/* MICROSOFT */}

              <button
                type="button"
                className="h-12 border border-slate-300 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-50 transition"
              >

                <MicrosoftIcon />

                <span className="font-medium text-slate-700">
                  Microsoft
                </span>

              </button>


              {/* GITHUB */}

              <button
                type="button"
                className="h-12 border border-slate-300 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-50 transition"
              >

                <GitHubIcon />

                <span className="font-medium text-slate-700">
                  GitHub
                </span>

              </button>

            </div>


            {/* Signup */}

            <p className="text-center mt-8 text-sm text-slate-500">

              Don't have an account?{" "}

              <button
                type="button"
                onClick={onSignup}
                className="font-semibold text-blue-600 hover:text-blue-700"
              >
                Sign up
              </button>

            </p>


            {/* Security */}

            <div className="text-center mt-8 text-xs text-slate-400">
              🔒 Secure connection · Your data is protected
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}


/* =========================================================
   FEATURE COMPONENT
========================================================= */

function Feature({
  icon,
  title,
  description,
}) {
  return (
    <div className="flex items-center gap-4">

      <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-xl">
        {icon}
      </div>

      <div>

        <h3 className="font-bold text-lg">
          {title}
        </h3>

        <p className="text-sm text-blue-100">
          {description}
        </p>

      </div>

    </div>
  );
}


/* =========================================================
   GOOGLE ICON
========================================================= */

function GoogleIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
    >
      <path
        fill="#4285F4"
        d="M21.35 12.27c0-.72-.06-1.42-.18-2.09H12v3.96h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.26z"
      />

      <path
        fill="#34A853"
        d="M12 21.8c2.63 0 4.84-.87 6.45-2.36l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.29v2.53A9.75 9.75 0 0 0 12 21.8z"
      />

      <path
        fill="#FBBC05"
        d="M6.54 13.88a5.86 5.86 0 0 1 0-3.76V7.59H3.29a9.8 9.8 0 0 0 0 8.82l3.25-2.53z"
      />

      <path
        fill="#EA4335"
        d="M12 6.09c1.43 0 2.72.49 3.73 1.45l2.8-2.8C16.83 3.18 14.63 2.2 12 2.2a9.75 9.75 0 0 0-8.71 5.39l3.25 2.53 3.25 2.53C7.31 7.81 9.46 6.09 12 6.09z"
      />
    </svg>
  );
}


/* =========================================================
   MICROSOFT ICON
========================================================= */

function MicrosoftIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
    >

      <rect
        x="2"
        y="2"
        width="9"
        height="9"
        fill="#F25022"
      />

      <rect
        x="13"
        y="2"
        width="9"
        height="9"
        fill="#7FBA00"
      />

      <rect
        x="2"
        y="13"
        width="9"
        height="9"
        fill="#00A4EF"
      />

      <rect
        x="13"
        y="13"
        width="9"
        height="9"
        fill="#FFB900"
      />

    </svg>
  );
}


/* =========================================================
   GITHUB ICON
========================================================= */

function GitHubIcon() {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="currentColor"
    >

      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.57.1.78-.25.78-.55v-2.13c-3.2.7-3.87-1.54-3.87-1.54-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.69 1.26 3.35.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.47.11-3.06 0 0 .97-.31 3.17 1.18a10.9 10.9 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.77.11 3.06.74.81 1.19 1.84 1.19 3.1 0 4.42-2.69 5.4-5.25 5.68.41.36.78 1.08.78 2.18v3.23c0 .3.2.65.79.54A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z" />

    </svg>
  );
}


export default Login;