import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/store/authStore";

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        navigate("/dashboard", { replace: true });
      } else {
        navigate("/login", { replace: true });
      }
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-slate-800 flex items-center justify-center gap-3">
            <svg
              className="animate-spin h-8 w-8 text-slate-400"
              viewBox="0 0 50 50"
            >
              <circle
                className="opacity-30"
                cx="25"
                cy="25"
                r="20"
                stroke="currentColor"
                strokeWidth="5"
                fill="none"
              />
              <circle
                className="text-slate-600"
                cx="25"
                cy="25"
                r="20"
                stroke="currentColor"
                strokeWidth="5"
                fill="none"
                strokeDasharray="100"
                strokeDashoffset="75"
              />
            </svg>
            Loading your social network...
          </h1>
        </div>
      </div>
    );
  }

  return null;
};

export default Index;
