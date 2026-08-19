import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/** Spinner shown while auth state is resolving */
const LoadingSpinner = () => (
    <div className="min-h-screen flex items-center justify-center bg-[#171817]">
        <div className="w-8 h-8 border-2 border-[#4F7A5A]/30 border-t-[#4F7A5A] rounded-full animate-spin" />
    </div>
);

/**
 * PrivateRoute — wraps routes that require authentication.
 * Unauthenticated users are redirected to /login.
 */
export const PrivateRoute = () => {
    const { user, loading } = useAuth();
    if (loading) return <LoadingSpinner />;
    return user ? <Outlet /> : <Navigate to="/login" replace />;
};

/**
 * PublicRoute — wraps routes only for unauthenticated users (login, register).
 * Logged-in users are redirected to the home page.
 */
export const PublicRoute = () => {
    const { user, loading } = useAuth();
    if (loading) return <LoadingSpinner />;
    return user ? <Navigate to="/" replace /> : <Outlet />;
};
