import { useState } from "react";

function Login() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleLogin(event) {
    event.preventDefault();

    setLoading(true);

    setTimeout(() => {

      console.log({
        email,
        password,
        rememberMe,
      });

      alert("Login successful");

      setLoading(false);

    }, 1500);
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
            Welcome Back
          </h1>

          <p className="text-zinc-400 mt-3">
            Login to ZeroPlay
          </p>

        </div>

        {/* FORM */}
        <form
          onSubmit={handleLogin}
          className="space-y-6"
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

          {/* PASSWORD */}
          <div>

            <label className="block mb-2 text-sm text-zinc-400">
              Password
            </label>

            <input
              type="password"
              placeholder="Enter your password"
              value={password}
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
              className="
                text-cyan-400
                hover:text-cyan-300
                transition-all
              "
            >
              Forgot password?
            </button>

          </div>

          {/* LOGIN BUTTON */}
          <button
            type="submit"
            className="
              w-full
              bg-cyan-400
              text-black
              font-bold
              py-3
              rounded-xl
              hover:bg-cyan-300
              hover:scale-[1.01]
              transition-all
              duration-300
            "
          >
            {loading ? "Logging in..." : "Login"}
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
            Don’t have an account?
          </p>

          <button
            className="
              mt-2
              text-cyan-400
              hover:text-cyan-300
              transition-all
            "
          >
            Create Account
          </button>

        </div>

      </div>

    </div>
  );
}

export default Login;