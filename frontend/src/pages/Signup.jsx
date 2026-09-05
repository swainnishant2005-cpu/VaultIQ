import { useState } from "react";

function Signup({ onLogin }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSignup = async (e) => {
    e.preventDefault();

    setMessage("");

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setMessage("Password must be at least 8 characters.");
      return;
    }

    if (!agree) {
      setMessage("Please accept the terms and conditions.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email,
            password: password,
            full_name: fullName,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.detail || "Registration failed.");
        return;
      }

      setMessage("Account created successfully!");

      setTimeout(() => {
        onLogin();
      }, 1000);
    } catch (error) {
      console.error(error);
      setMessage(
        "Cannot connect to backend. Make sure FastAPI is running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7fb] flex items-center justify-center p-4 sm:p-6">

      <div className="w-full max-w-[1250px] min-h-[720px] bg-white rounded-[30px] overflow-hidden shadow-[0_25px_80px_rgba(15,23,42,0.15)] grid lg:grid-cols-[0.95fr_1fr]">

        {/* LEFT SIDE */}

        <div className="relative overflow-hidden bg-gradient-to-br from-[#07143d] via-[#102d78] to-[#1769e8] text-white p-8 sm:p-12 lg:p-14">

          <div className="absolute -top-32 -right-32 w-[420px] h-[420px] rounded-full bg-blue-400/10" />

          <div className="absolute -bottom-48 -left-40 w-[500px] h-[500px] rounded-full bg-cyan-300/10" />

          <div className="absolute top-1/3 right-[-100px] w-[260px] h-[260px] rounded-full bg-white/5" />

          {/* LOGO */}

          <div className="relative z-10 flex items-center gap-3">

            <div className="w-12 h-12 rounded-[15px] bg-gradient-to-br from-blue-400 to-cyan-300 flex items-center justify-center shadow-lg">

              <svg
                width="29"
                height="29"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M7.5 18.5H17C19.2091 18.5 21 16.7091 21 14.5C21 12.4301 19.4277 10.7354 17.3074 10.5128C16.7706 7.37604 14.0316 5 10.75 5C7.35591 5 4.60473 7.54047 4.26612 10.845C2.38943 11.2506 1 12.9184 1 14.9C1 16.8882 2.61177 18.5 4.6 18.5H7.5Z"
                  fill="white"
                />
              </svg>

            </div>

            <h1 className="text-3xl font-extrabold">
              Vault<span className="text-cyan-300">IQ</span>
            </h1>

          </div>

          {/* HEADING */}

          <div className="relative z-10 mt-20 lg:mt-24">

            <p className="uppercase tracking-[4px] text-blue-200 text-xs font-bold mb-5">
              START YOUR JOURNEY
            </p>

            <h2 className="text-4xl sm:text-5xl lg:text-[52px] leading-[1.08] font-extrabold max-w-xl">

              One Account.
              <br />

              All Your Files.
              <br />

              <span className="text-cyan-300">
                One Secure Place.
              </span>

            </h2>

            <p className="mt-7 text-blue-100 text-base sm:text-lg leading-8 max-w-lg">
              Create your VaultIQ account and keep your
              digital world organized, secure and accessible.
            </p>

          </div>

          {/* FEATURES */}

          <div className="relative z-10 mt-12 space-y-5 max-w-lg">

            <Feature
              icon="cloud"
              title="Cloud Storage"
              description="Keep your important files safely in the cloud."
            />

            <Feature
              icon="lock"
              title="Private & Secure"
              description="Your personal files stay protected."
            />

            <Feature
              icon="share"
              title="Share Easily"
              description="Share your files whenever you need."
            />

          </div>

          {/* DECORATIVE FILES */}

          <div className="relative z-10 hidden xl:block mt-12 h-28">

            <div className="absolute left-[35%] top-5 w-44 h-24 bg-white/95 rounded-[55%] shadow-2xl flex items-center justify-center">

              <span className="text-6xl">☁️</span>

            </div>

            <div className="absolute left-[15%] top-10 w-14 h-14 rounded-2xl bg-red-400 flex items-center justify-center text-2xl shadow-xl rotate-[-10deg]">
              📄
            </div>

            <div className="absolute right-[14%] top-2 w-14 h-14 rounded-2xl bg-purple-400 flex items-center justify-center text-2xl shadow-xl rotate-[10deg]">
              🖼️
            </div>

          </div>

          <div className="absolute bottom-7 left-8 sm:left-12 text-blue-200 text-xs">
            © 2026 VaultIQ • Secure Cloud Storage
          </div>

        </div>

        {/* RIGHT SIDE */}

        <div className="flex items-center justify-center px-6 py-10 sm:px-12 lg:px-16">

          <div className="w-full max-w-[450px]">

            {/* MOBILE LOGO */}

            <div className="lg:hidden flex justify-center mb-8">

              <div className="flex items-center gap-3">

                <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center">
                  ☁️
                </div>

                <h1 className="text-3xl font-extrabold text-slate-900">
                  Vault<span className="text-blue-600">IQ</span>
                </h1>

              </div>

            </div>

            {/* TITLE */}

            <div className="mb-7">

              <h2 className="text-[32px] sm:text-[36px] font-extrabold text-slate-900">
                Create your account
              </h2>

              <p className="text-slate-500 mt-2 text-[15px]">
                Join VaultIQ and start storing your files securely.
              </p>

            </div>

            {/* FORM */}

            <form onSubmit={handleSignup} className="space-y-4">

              {/* FULL NAME */}

              <div>

                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Full name
                </label>

                <div className="relative">

                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">

                    <svg
                      width="19"
                      height="19"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="8" r="4" />
                      <path d="M4 21c0-4 3.5-7 8-7s8 3 8 7" />
                    </svg>

                  </div>

                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    required
                    className="w-full h-[52px] pl-12 pr-4 rounded-xl border border-slate-200 bg-slate-50/50 outline-none transition-all focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />

                </div>

              </div>

              {/* EMAIL */}

              <div>

                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Email address
                </label>

                <div className="relative">

                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">

                    <svg
                      width="19"
                      height="19"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect
                        x="3"
                        y="5"
                        width="18"
                        height="14"
                        rx="2"
                      />
                      <path d="m3 7 9 6 9-6" />
                    </svg>

                  </div>

                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="w-full h-[52px] pl-12 pr-4 rounded-xl border border-slate-200 bg-slate-50/50 outline-none transition-all focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />

                </div>

              </div>

              {/* PASSWORD */}

              <div>

                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Password
                </label>

                <div className="relative">

                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    🔒
                  </div>

                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password"
                    required
                    className="w-full h-[52px] pl-12 pr-14 rounded-xl border border-slate-200 bg-slate-50/50 outline-none transition-all focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>

                </div>

              </div>

              {/* CONFIRM PASSWORD */}

              <div>

                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Confirm password
                </label>

                <div className="relative">

                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    🔐
                  </div>

                  <input
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(e.target.value)
                    }
                    placeholder="Confirm your password"
                    required
                    className="w-full h-[52px] pl-12 pr-14 rounded-xl border border-slate-200 bg-slate-50/50 outline-none transition-all focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(
                        !showConfirmPassword
                      )
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showConfirmPassword ? "🙈" : "👁️"}
                  </button>

                </div>

              </div>

              {/* TERMS */}

              <label className="flex items-start gap-3 cursor-pointer pt-1">

                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) =>
                    setAgree(e.target.checked)
                  }
                  className="w-4 h-4 mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />

                <span className="text-sm text-slate-500 leading-5">
                  I agree to the{" "}
                  <button
                    type="button"
                    className="text-blue-600 font-semibold"
                  >
                    Terms & Conditions
                  </button>{" "}
                  and{" "}
                  <button
                    type="button"
                    className="text-blue-600 font-semibold"
                  >
                    Privacy Policy
                  </button>
                  .
                </span>

              </label>

              {/* BUTTON */}

              <button
                type="submit"
                disabled={loading}
                className="group w-full h-[55px] rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold shadow-lg shadow-blue-600/25 hover:from-blue-700 hover:to-blue-600 hover:shadow-blue-600/40 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >

                {loading ? (
                  <span className="flex items-center justify-center gap-2">

                    <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>

                    Creating account...

                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">

                    Create Account

                    <span className="text-lg group-hover:translate-x-1 transition-transform">
                      →
                    </span>

                  </span>
                )}

              </button>

            </form>

            {/* MESSAGE */}

            {message && (
              <div
                className={`mt-5 px-4 py-3 rounded-xl text-sm text-center font-medium ${
                  message ===
                  "Account created successfully!"
                    ? "bg-green-50 text-green-600 border border-green-100"
                    : "bg-red-50 text-red-600 border border-red-100"
                }`}
              >
                {message}
              </div>
            )}

            {/* LOGIN */}

            <div className="text-center mt-7">

              <p className="text-sm text-slate-500">

                Already have an account?{" "}

                <button
                  type="button"
                  onClick={onLogin}
                  className="font-bold text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Sign in
                </button>

              </p>

            </div>

            {/* SECURITY */}

            <div className="flex items-center justify-center gap-2 mt-7 text-xs text-slate-400">

              🔒 Your information is securely protected

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}


/* FEATURE */

function Feature({ icon, title, description }) {

  const icons = {
    cloud: "☁️",
    lock: "🔐",
    share: "↗️",
  };

  return (
    <div className="flex items-center gap-4">

      <div className="w-12 h-12 flex-shrink-0 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-xl">
        {icons[icon]}
      </div>

      <div>

        <h3 className="font-bold text-[15px]">
          {title}
        </h3>

        <p className="text-blue-200 text-sm mt-1">
          {description}
        </p>

      </div>

    </div>
  );
}

export default Signup;