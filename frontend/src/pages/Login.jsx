import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import { useAuth } from "../context/useAuth";

function Login() {
  const navigate = useNavigate();
  const { isAuthenticated, isRestoring, signIn, signUp } = useAuth();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isSignup = mode === "signup";

  if (!isRestoring && isAuthenticated) {
    return <Navigate to="/profile" replace />;
  }

  function validateForm() {
    const trimmedEmail = email.trim();
    const trimmedUsername = username.trim();

    if (!trimmedEmail) {
      return "Email is required";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return "Enter a valid email address";
    }

    if (isSignup && trimmedUsername.length < 3) {
      return "Username must be at least 3 characters";
    }

    if (isSignup && !/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
      return "Username can only contain letters, numbers, and underscores";
    }

    if (!password) {
      return "Password is required";
    }

    if (isSignup && password.length < 8) {
      return "Password must be at least 8 characters";
    }

    return null;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const authData = isSignup
        ? await signUp({
            email: email.trim(),
            password,
            username: username.trim(),
            rememberMe,
          })
        : await signIn({
            email: email.trim(),
            password,
            rememberMe,
          });

      if (isSignup && authData.emailVerificationRequired) {
        setSuccess("Account created. Check your email to verify your account.");
        setMode("login");
      } else {
        navigate("/profile", { replace: true });
      }

      setPassword("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    setError("");
    setSuccess("");
    setPassword("");
  }

  function handleUnavailableAction(message) {
    setError("");
    setSuccess(message);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-950 to-black text-white flex items-center justify-center p-6">

      <div
        className="
          w-full
          max-w-md
          bg-zinc-900/90
          border
          border-zinc-800
          rounded-3xl
          p-8
          shadow-2xl
          backdrop-blur
        "
      >

        {/* HEADER */}
        <div className="mb-8 text-center">

          <div
            className="
              w-16
              h-16
              mx-auto
              mb-5
              rounded-2xl
              bg-cyan-400/10
              border
              border-cyan-400/20
              flex
              items-center
              justify-center
              text-cyan-400
              text-2xl
              font-black
            "
          >
            ZP
          </div>

          <h1 className="text-4xl font-bold">
            {isSignup ? "Create Account" : "Welcome Back"}
          </h1>

          <p className="text-zinc-400 mt-3">
            {isSignup ? "Join ZeroPlay" : "Login to ZeroPlay"}
          </p>

        </div>

        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          className="space-y-6"
          noValidate
        >

          {/* EMAIL */}
          <div>

            <label className="block mb-2 text-sm text-zinc-400">
              Email
            </label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              autoComplete="email"
              onChange={(event) =>
                setEmail(event.target.value)
              }
              className="
                w-full
                bg-zinc-950
                border
                border-zinc-800
                rounded-xl
                px-4
                py-3
                text-white
                outline-none
                focus:border-cyan-400
                focus:ring-2
                focus:ring-cyan-400/20
                transition-all
              "
            />

          </div>

          {isSignup && (
            <div>

              <label className="block mb-2 text-sm text-zinc-400">
                Username
              </label>

              <input
                type="text"
                placeholder="Choose a username"
                value={username}
                autoComplete="username"
                onChange={(event) =>
                  setUsername(event.target.value)
                }
                className="
                  w-full
                  bg-zinc-950
                  border
                  border-zinc-800
                  rounded-xl
                  px-4
                  py-3
                  text-white
                  outline-none
                  focus:border-cyan-400
                  focus:ring-2
                  focus:ring-cyan-400/20
                  transition-all
                "
              />

            </div>
          )}

          {/* PASSWORD */}
          <div>

            <label className="block mb-2 text-sm text-zinc-400">
              Password
            </label>

            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              autoComplete={isSignup ? "new-password" : "current-password"}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              className="
                w-full
                bg-zinc-950
                border
                border-zinc-800
                rounded-xl
                px-4
                py-3
                text-white
                outline-none
                focus:border-cyan-400
                focus:ring-2
                focus:ring-cyan-400/20
                transition-all
              "
            />

          </div>

          {/* OPTIONS */}
          <div className="flex items-center justify-between text-sm">

            <label className="flex items-center gap-2 text-zinc-400">

              <input
                type="checkbox"
                checked={rememberMe}
                onChange={() =>
                  setRememberMe(!rememberMe)
                }
                className="accent-cyan-400"
              />

              Remember me

            </label>

            <button
              type="button"
              onClick={() => handleUnavailableAction("Password reset is not connected yet.")}
              className="
                text-cyan-400
                hover:text-cyan-300
                transition-all
              "
            >
              Forgot password?
            </button>

          </div>

          {(error || success) && (
            <div
              role="alert"
              className={`
                rounded-xl
                border
                px-4
                py-3
                text-sm
                ${error
                  ? "border-red-500/30 bg-red-500/10 text-red-200"
                  : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"}
              `}
            >
              {error || success}
            </div>
          )}

          {/* LOGIN BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="
              w-full
              bg-cyan-400
              text-black
              font-bold
              py-3
              rounded-xl
              hover:bg-cyan-300
              hover:scale-[1.01]
              disabled:opacity-60
              disabled:cursor-not-allowed
              disabled:hover:scale-100
              transition-all
              duration-300
            "
          >
            {loading
              ? (isSignup ? "Creating account..." : "Logging in...")
              : (isSignup ? "Create Account" : "Login")}
          </button>

        </form>

        {/* DIVIDER */}
        <div className="flex items-center gap-4 my-8">

          <div className="h-px flex-1 bg-zinc-800"></div>

          <span className="text-zinc-500 text-sm">
            OR
          </span>

          <div className="h-px flex-1 bg-zinc-800"></div>

        </div>

        {/* SOCIAL BUTTONS */}
        <div className="space-y-3">

          <button
            type="button"
            onClick={() => handleUnavailableAction("Google login is not configured yet.")}
            className="
              w-full
              border
              border-zinc-800
              bg-zinc-950
              rounded-xl
              py-3
              hover:border-cyan-400
              transition-all
            "
          >
            Continue with Google
          </button>

          <button
            type="button"
            onClick={() => handleUnavailableAction("Apple login is not configured yet.")}
            className="
              w-full
              border
              border-zinc-800
              bg-zinc-950
              rounded-xl
              py-3
              hover:border-cyan-400
              transition-all
            "
          >
            Continue with Apple
          </button>

        </div>

        {/* FOOTER */}
        <div className="mt-8 text-center">

          <p className="text-zinc-500">
            {isSignup ? "Already have an account?" : "Don't have an account?"}
          </p>

          <button
            type="button"
            onClick={() => switchMode(isSignup ? "login" : "signup")}
            className="
              mt-2
              text-cyan-400
              hover:text-cyan-300
              transition-all
            "
          >
            {isSignup ? "Login" : "Create Account"}
          </button>

        </div>

      </div>

    </div>
  );
}

export default Login;
