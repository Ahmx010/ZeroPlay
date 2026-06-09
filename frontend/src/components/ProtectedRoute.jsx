import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "../context/useAuth";

function ProtectedRoute({ children }) {
  const location = useLocation();
  const { isAuthenticated, isRestoring } = useAuth();

  if (isRestoring) {
    return (
      <div className="flex min-h-[calc(100vh-72px)] items-center justify-center bg-[#050505] px-6 text-white">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 px-6 py-5 text-sm font-black uppercase tracking-wide text-cyan-300">
          Restoring session
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

export default ProtectedRoute;
