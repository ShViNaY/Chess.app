import { useNavigate } from "react-router-dom";

export const NotFound = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center px-4 font-sans animate-in fade-in duration-500 bg-[#171817]">
            <div className="max-w-sm w-full text-center">

                {/* Big 404 */}
                <div className="relative mb-8 select-none">
                    <span className="text-[120px] font-black text-[#E8E5DC]/5 leading-none block">404</span>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 bg-[#1D1E1C] rounded-2xl flex items-center justify-center ring-1 ring-[#2B2D29]">
                            <svg className="w-8 h-8 text-[#4F7A5A]" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2L9 7h6zM5 10l2-2 3 2v6H5zM14 10l3-2 2 2v6h-5zM5 18h14v3H5z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <h1 className="text-2xl font-bold text-[#E8E5DC] mb-2">Page not found</h1>
                <p className="text-sm text-[#A6A59E] mb-8">
                    The page you're looking for doesn't exist or has been moved.
                </p>

                <div className="flex gap-3 justify-center">
                    <button
                        onClick={() => navigate(-1)}
                        className="px-5 py-2.5 bg-[#1D1E1C] hover:bg-[#242725] border border-[#2B2D29] text-[#E8E5DC] text-sm font-semibold rounded-xl transition-colors"
                    >
                        Go back
                    </button>
                    <button
                        onClick={() => navigate("/")}
                        className="px-5 py-2.5 bg-[#4F7A5A] hover:bg-[#5D8A67] text-[#E8E5DC] text-sm font-bold rounded-xl transition-colors shadow-[0_4px_12px_rgba(0,0,0,0.18)]"
                    >
                        Home
                    </button>
                </div>
            </div>
        </div>
    );
};
