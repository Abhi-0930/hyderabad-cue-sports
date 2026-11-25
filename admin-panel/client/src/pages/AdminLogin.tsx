import { useState, type FormEvent } from "react";
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { API_BASE } from "@/lib/api";

export type AdminUser = {
  email: string;
  fullName: string;
  role: string;
  token?: string;
};

type AdminLoginProps = {
  onLogin: (user: AdminUser) => void;
};

export default function AdminLogin({ onLogin }: AdminLoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError("Please enter your admin email and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email: trimmedEmail, password }),
      });

      const data = await response.json().catch(() => null);

      if (response.ok && data?.success && data?.admin) {
        localStorage.setItem("hcs_admin_user", JSON.stringify(data.admin));
        onLogin(data.admin);
      } else {
        const errorText = `${data?.message || "Invalid admin credentials."} ${data?.error || ""}`.toLowerCase();
        const isDbTimeout =
          errorText.includes("timeout") ||
          errorText.includes("connection terminated") ||
          errorText.includes("port 6543");

        if (isDbTimeout) {
          setError(
            data?.message ||
              "Database connection timed out. If on a college or restricted Wi-Fi, port 6543 is blocked — please connect to your mobile hotspot."
          );
        } else {
          const msg = data?.message || "Invalid admin credentials. Please try again.";
          const extra = data?.error ? ` (${data.error})` : "";
          setError(`${msg}${extra}`);
        }
      }
    } catch (err: any) {
      console.error("Admin login network/server error:", err);
      const detail = err?.message ? ` (${err.message})` : "";
      setError(`Unable to connect to security server at ${API_BASE}. Please ensure backend is running.${detail}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      {/* Brand Header matching reference logo with Golden Arc */}
      <div className="admin-login-brand">
        <h1 className="admin-brand-title">
          HYDERABAD<br />CUE SPORTS
        </h1>
        <svg
          className="admin-brand-arc"
          viewBox="0 0 140 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M 2 10 Q 70 0 138 10"
            stroke="#C9A451"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Main Admin Panel Card */}
      <div className="admin-login-card">
        <h2 className="admin-card-title">Admin Panel</h2>

        {error && (
          <div className="admin-login-error" role="alert">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Email Input with Mail Icon */}
          <div className="admin-input-group">
            <span className="admin-input-icon">
              <Mail size={18} />
            </span>
            <input
              type="email"
              className="admin-input"
              placeholder="Email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError("");
              }}
              required
            />
          </div>

          {/* Password Input with Lock & Eye Toggle Icon */}
          <div className="admin-input-group">
            <span className="admin-input-icon">
              <Lock size={18} />
            </span>
            <input
              type={showPassword ? "text" : "password"}
              className="admin-input admin-input-has-toggle"
              placeholder="Password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError("");
              }}
              required
            />
            <button
              type="button"
              className="admin-password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Login Submit Button */}
          <button
            type="submit"
            className="admin-login-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <span>Login</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
