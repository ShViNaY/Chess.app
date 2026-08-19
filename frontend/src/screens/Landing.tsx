import { useNavigate, Link } from "react-router-dom";
import { ChessBoard } from "../components/ChessBoard";
import { useState } from "react";
import { Chess } from "chess.js";
import { useAuth } from "../context/AuthContext";

export const Landing = () => {
    const navigate = useNavigate();
    const [chess] = useState(new Chess());
    const board = chess.board();
    const { user, logout } = useAuth();

    const [activeTab, setActiveTab] = useState<"online" | "friend">("online");
    const [joinCode, setJoinCode] = useState("");

    return (
        <div className="relative min-h-screen text-[#E8E5DC] flex flex-col font-sans selection:bg-[#4F7A5A]/25 overflow-x-hidden transition-colors duration-300 animate-in fade-in duration-500">

            {/* Decorative muted background shapes */}
            <div className="absolute top-[10%] left-[5%] w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] bg-[#4F7A5A]/8 rounded-full blur-[120px] pointer-events-none z-0 mix-blend-multiply" />
            <div className="absolute bottom-[10%] right-[5%] w-[60vw] h-[60vw] max-w-[700px] max-h-[700px] bg-[#A6A59E]/8 rounded-full blur-[150px] pointer-events-none z-0 mix-blend-multiply" />

            {/* Navigation */}
            <nav className="relative w-full max-w-7xl mx-auto px-6 py-4 flex justify-between items-center z-10">
                <div className="flex items-center gap-3 select-none">
                    <div className="w-10 h-10 bg-[#4F7A5A] rounded-xl flex items-center justify-center shadow-[0_4px_14px_rgba(0,0,0,0.18)]">
                        <svg className="w-5 h-5 text-[#E8E5DC]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L9 7h6zM5 10l2-2 3 2v6H5zM14 10l3-2 2 2v6h-5zM5 18h14v3H5z" /></svg>
                    </div>
                    <span className="text-2xl font-bold font-outfit tracking-tight text-[#E8E5DC]">Project Chess</span>
                </div>

                <div className="flex items-center gap-4">
                    {user ? (
                        <>
                            <Link to="/profile" className="flex items-center gap-2.5 group" title="View Profile">
                                <div className="w-9 h-9 rounded-full bg-[#242725] text-[#E8E5DC] flex items-center justify-center font-bold text-sm border border-[#2B2D29] group-hover:bg-[#2B2D29] transition-colors shadow-sm">
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="font-semibold text-[#A6A59E] group-hover:text-[#E8E5DC] transition-colors hidden sm:block">
                                    {user.name}
                                </span>
                            </Link>
                            <button onClick={logout} className="text-sm px-4 py-2 border border-[#2B2D29] rounded-lg hover:bg-[#1D1E1C] transition text-[#E8E5DC]">
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="text-sm px-4 py-2 font-medium text-[#A6A59E] hover:text-[#E8E5DC] transition">Login</Link>
                            <Link to="/register" className="text-sm px-4 py-2 bg-[#4F7A5A] hover:bg-[#5D8A67] text-[#E8E5DC] rounded-lg transition font-medium shadow-[0_4px_12px_rgba(0,0,0,0.18)]">Register</Link>
                        </>
                    )}
                </div>
            </nav>

            {/* Main Content */}
            <main className="relative flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-16 z-10 overflow-y-auto py-4 sm:py-6">

                {/* Left Column (Copy) */}
                <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1D1E1C] border border-[#2B2D29] mb-8 shadow-[0_4px_10px_rgba(0,0,0,0.12)]">
                        <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4F7A5A] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#4F7A5A]"></span>
                        </span>
                        <span className="text-xs font-semibold tracking-wide text-[#E8E5DC] uppercase">Beta Access Live</span>
                    </div>

                    <h1 className="text-[2.5rem] md:text-[3.5rem] lg:text-[4rem] font-black font-outfit tracking-tighter leading-[1] text-[#E8E5DC] mb-3 mt-1">
                        Master the <br />
                        board.
                    </h1>

                    <p className="text-sm md:text-base text-[#A6A59E] font-medium leading-relaxed mb-5 max-w-lg">
                        Experience chess in its purest form. A distraction-free,
                        blisteringly fast environment designed specifically for focus and performance.
                    </p>

                    <div className="w-full max-w-md bg-[#1D1E1C] border border-[#2B2D29] rounded-2xl p-4 shadow-[0_8px_20px_rgba(0,0,0,0.14)]">
                        {/* TABS */}
                        <div className="flex gap-2 mb-3 p-1 bg-[#171817] rounded-xl border border-[#2B2D29] shadow-inner">
                            <button
                                onClick={() => setActiveTab("online")}
                                className={`flex-1 py-1.5 rounded-lg text-sm font-bold transition-colors ${activeTab === "online" ? "bg-[#242725] text-[#E8E5DC] shadow-sm" : "text-[#777871] hover:text-[#E8E5DC] hover:bg-[#20231F]"}`}
                            >
                                Play Online
                            </button>
                            <button
                                onClick={() => setActiveTab("friend")}
                                className={`flex-1 py-1.5 rounded-lg text-sm font-bold transition-colors ${activeTab === "friend" ? "bg-[#242725] text-[#E8E5DC] shadow-sm" : "text-[#777871] hover:text-[#E8E5DC] hover:bg-[#20231F]"}`}
                            >
                                Play a Friend
                            </button>
                        </div>

                        {/* TAB CONTENT */}
                        {activeTab === "online" ? (
                            <div className="flex flex-col gap-2">
                                <button onClick={() => navigate("/game", { state: { mode: "matchmaking", time: 600000 } })} className="w-full py-3 flex items-center px-4 bg-[#20231F] hover:bg-[#2A2D29] text-[#E8E5DC] rounded-xl font-bold transition-colors border border-[#2B2D29] shadow-sm">
                                    <span className="text-lg mr-2">🐢</span> 10 min Rapid
                                </button>
                                <button onClick={() => navigate("/game", { state: { mode: "matchmaking", time: 180000 } })} className="w-full py-3 flex items-center px-4 bg-[#20231F] hover:bg-[#2A2D29] text-[#E8E5DC] rounded-xl font-bold transition-colors border border-[#2B2D29] shadow-sm">
                                    <span className="text-lg mr-2">⚡</span> 3 min Blitz
                                </button>
                                <button onClick={() => navigate("/game", { state: { mode: "matchmaking", time: 60000 } })} className="w-full py-3 flex items-center px-4 bg-[#20231F] hover:bg-[#2A2D29] text-[#E8E5DC] rounded-xl font-bold transition-colors border border-[#2B2D29] shadow-sm">
                                    <span className="text-lg mr-2">🚀</span> 1 min Bullet
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                <div>
                                    <label className="text-[10px] font-bold text-[#777871] uppercase tracking-wider mb-1.5 block">Create a Room</label>
                                    <button onClick={() => navigate("/game", { state: { mode: "create_private", time: 600000 } })} className="w-full py-3 bg-[#4F7A5A] hover:bg-[#5D8A67] text-[#E8E5DC] rounded-xl font-bold transition-colors shadow-[0_4px_12px_rgba(0,0,0,0.18)]">
                                        Create Private Room
                                    </button>
                                </div>

                                <div className="relative flex items-center py-2">
                                    <div className="flex-grow border-t border-[#2B2D29]"></div>
                                    <span className="flex-shrink-0 mx-4 text-[#777871] text-xs font-medium uppercase">Or</span>
                                    <div className="flex-grow border-t border-[#2B2D29]"></div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-[#777871] uppercase tracking-wider mb-1.5 block">Join a Room</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Enter 4-letter code"
                                            value={joinCode}
                                            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                            maxLength={4}
                                            className="w-full bg-[#171817] border border-[#2B2D29] rounded-xl px-4 py-2 text-sm text-[#E8E5DC] placeholder-[#777871] font-mono focus:outline-none focus:border-[#4F7A5A] transition-colors uppercase shadow-inner"
                                        />
                                        <button
                                            onClick={() => {
                                                if (joinCode.length === 4) navigate("/game", { state: { mode: "join_private", roomId: joinCode } });
                                            }}
                                            className="px-5 py-2 bg-[#1D1E1C] text-[#E8E5DC] text-sm font-bold rounded-xl hover:bg-[#242725] transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed border border-[#2B2D29]"
                                            disabled={joinCode.length !== 4}
                                        >
                                            Join
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column (Preview Board) */}
                <div className="flex-1 w-full hidden md:flex justify-center lg:justify-end items-center">
                    <div className="group relative w-full max-w-[380px] lg:max-w-[460px] xl:max-w-[500px] transition-all duration-500 ease-out hover:scale-[1.02]">

                        {/* Ambient glow behind the board */}
                        <div className="absolute -inset-4 bg-[#4F7A5A]/8 rounded-3xl blur-2xl group-hover:bg-[#4F7A5A]/12 transition-all duration-500 pointer-events-none" />

                        <div className="pointer-events-none select-none relative z-10 rounded-2xl overflow-hidden shadow-[0_18px_40px_rgba(0,0,0,0.22)] ring-1 ring-[#2B2D29] transition-all duration-500 bg-[#1D1E1C]">
                            <ChessBoard
                                board={board}
                                socket={{} as WebSocket}
                                myColor="white"
                                isMyTurn={false}
                            />
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#171817]/35 pointer-events-none" />
                        </div>

                    </div>
                </div>

            </main>
        </div>
    );
};
