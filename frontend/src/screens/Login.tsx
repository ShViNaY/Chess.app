import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

export const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
                const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || "Login failed");
            } else {
                login(data.token, data.user);
                navigate("/");
            }
        } catch (err) {
            setError("An error occurred during login.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen w-full text-[#E8E5DC] overflow-hidden flex items-center justify-center font-sans tracking-wide transition-colors duration-300 animate-in fade-in duration-500">

            {/* Subtle grid background */}
            <div className="absolute inset-0 bg-[radial-gradient(#A6A59E12_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

            {/* Background accent blobs */}
            <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[70%] rounded-full bg-[#4F7A5A]/8 blur-[120px] pointer-events-none" />
            <div className="absolute top-[-5%] right-[-5%] w-[55%] h-[65%] rounded-full bg-[#A6A59E]/6 blur-[130px] pointer-events-none" />

            {/* Form Container */}
            <div className="relative z-10 w-full max-w-[420px] mx-4 p-8 sm:p-10 bg-[#1D1E1C] shadow-[0_20px_40px_rgba(0,0,0,0.18)] rounded-2xl border border-[#2B2D29] transition-all duration-300">
                {/* Logo */}
                <div className="flex items-center gap-2.5 justify-center mb-7">
                    <div className="w-8 h-8 bg-[#4F7A5A] rounded-lg flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.18)]">
                        <svg className="w-4 h-4 text-[#E8E5DC]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L9 7h6zM5 10l2-2 3 2v6H5zM14 10l3-2 2 2v6h-5zM5 18h14v3H5z" /></svg>
                    </div>
                    <span className="text-lg font-bold text-[#E8E5DC] tracking-tight">Project Chess</span>
                </div>

                <h2 className="text-2xl font-bold text-[#E8E5DC] text-center mb-1.5 tracking-tight">
                    Welcome back
                </h2>
                <p className="text-sm text-[#A6A59E] text-center mb-7">
                    Sign in to continue playing
                </p>

                <form className="space-y-6" onSubmit={handleLogin}>
                    {error && (
                        <div className="bg-[#2A1F1B] border border-[#5A3D35] text-[#D7B68A] px-4 py-3 rounded-xl text-sm font-semibold text-center shadow-sm">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-[#777871] mb-1.5 uppercase tracking-wider">
                                Email
                            </label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="w-full px-4 py-3 bg-[#171817] border border-[#2B2D29] rounded-xl text-[#E8E5DC] placeholder-[#777871] focus:outline-none focus:ring-2 focus:ring-[#4F7A5A]/30 focus:border-[#4F7A5A]/50 transition-all text-sm font-medium"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-[#777871] mb-1.5 uppercase tracking-wider">
                                Password
                            </label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full px-4 py-3 bg-[#171817] border border-[#2B2D29] rounded-xl text-[#E8E5DC] placeholder-[#777871] focus:outline-none focus:ring-2 focus:ring-[#4F7A5A]/30 focus:border-[#4F7A5A]/50 transition-all text-sm font-medium"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3.5 mt-1 bg-[#4F7A5A] hover:bg-[#5D8A67] active:bg-[#446B4F] text-[#E8E5DC] rounded-xl font-bold text-sm transition-colors duration-200 flex items-center justify-center disabled:opacity-60 shadow-[0_4px_12px_rgba(0,0,0,0.18)]"
                    >
                        {isLoading ? (
                            <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-[#E8E5DC]/30 border-t-[#E8E5DC] rounded-full animate-spin"></span>Signing in...</span>
                        ) : "Sign In"}
                    </button>
                </form>

                <div className="mt-6 pt-6 border-t border-[#2B2D29] text-center">
                    <p className="text-sm text-[#A6A59E]">
                        New here?{" "}
                        <Link to="/register" className="font-bold text-[#4F7A5A] hover:text-[#5D8A67] transition-colors">
                            Create an account
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};
