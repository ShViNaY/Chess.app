import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

interface GameHistory {
    id: string;
    status: string;
    result: string | null;
    winner: "white" | "black" | null;
    whiteTime: number;
    blackTime: number;
    createdAt: string;
    whitePlayerId: string | null;
    blackPlayerId: string | null;
    whitePlayer: { id: string; name: string; rating: number } | null;
    blackPlayer: { id: string; name: string; rating: number } | null;
}

export const Profile = () => {
    const { user, token, logout, loading } = useAuth();
    const navigate = useNavigate();
    const [games, setGames] = useState<GameHistory[]>([]);
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        if (!loading && !user) {
            navigate("/login");
            return;
        }

        if (token && user) {
            fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/me/games`, {            
            headers: { Authorization: `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(data => {
                    if (data.games) {
                        setGames(data.games);
                    }
                })
                .catch(err => console.error("Failed to fetch games", err))
                .finally(() => setFetching(false));
        }
    }, [user, token, loading, navigate]);

    if (loading || fetching) {
        return <div className="min-h-screen text-[#E8E5DC] bg-[#171817] flex justify-center items-center transition-colors duration-300">Loading...</div>;
    }

    if (!user) return null;

    return (
        <div className="relative min-h-screen flex flex-col text-[#E8E5DC] p-4 sm:p-6 md:p-8 font-sans selection:bg-[#4F7A5A]/25 overflow-x-hidden transition-colors duration-300">
            {/* Abstract background shapes */}
            <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] max-w-[800px] max-h-[800px] bg-[#4F7A5A]/8 rounded-full blur-[120px] pointer-events-none z-0 mix-blend-multiply" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] max-w-[900px] max-h-[900px] bg-[#A6A59E]/8 rounded-full blur-[150px] pointer-events-none z-0 mix-blend-multiply" />

            {/* Navigation */}
            <nav className="flex-none relative z-10 mb-6 md:mb-8 flex justify-between items-center w-full max-w-5xl mx-auto">
                <Link to="/" className="flex items-center gap-3 select-none hover:opacity-80 transition group">
                    <div className="w-10 h-10 bg-[#4F7A5A] rounded-xl flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.18)] group-hover:scale-105 transition-transform duration-300">
                        <svg className="w-5 h-5 text-[#E8E5DC]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L9 7h6zM5 10l2-2 3 2v6H5zM14 10l3-2 2 2v6h-5zM5 18h14v3H5z" /></svg>
                    </div>
                    <span className="text-2xl font-bold font-outfit tracking-tight text-[#E8E5DC]">Chess Arena</span>
                </Link>
                <div className="flex items-center gap-4">
                    <button onClick={() => { logout(); navigate("/"); }} className="text-sm px-4 py-2 border border-[#2B2D29] text-[#E8E5DC] rounded-lg hover:bg-[#1D1E1C] transition font-medium shadow-sm">
                        Logout
                    </button>
                </div>
            </nav>

            <main className="flex-1 relative z-10 w-full max-w-5xl mx-auto flex flex-col gap-6 md:gap-8 pb-8">
                {/* Profile Header */}
                <section className="flex-none bg-[#1D1E1C] border border-[#2B2D29] p-6 md:p-8 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between shadow-[0_8px_20px_rgba(0,0,0,0.12)] transition-all duration-300 gap-6">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-black text-[#E8E5DC] mb-2 tracking-tight">{user.name}</h1>
                        <p className="text-[#A6A59E] font-medium">{user.email}</p>
                    </div>
                    <div className="text-left md:text-right bg-[#171817] px-6 py-4 rounded-xl border border-[#2B2D29] shadow-inner">
                        <div className="flex items-center md:justify-end gap-1.5 mb-1">
                            <p className="uppercase text-[11px] font-black text-[#DCE7DE] tracking-[0.2em]">Current Rating</p>
                            <span
                                title="Elo is a global chess rating system. You gain points by winning, and lose points by losing, based on your opponent's skill level."
                                className="cursor-help w-3 h-3 rounded-full border border-[#4F7A5A] flex items-center justify-center text-[8px] font-bold text-[#DCE7DE] hover:bg-[#4F7A5A] hover:text-[#171817] transition-colors"
                            >?</span>
                        </div>
                        <p className="text-4xl sm:text-5xl font-black text-[#4F7A5A]">{user.rating}</p>
                    </div>
                </section>

                {/* Game History */}
                <section className="flex-1 flex flex-col min-h-0 bg-transparent">
                    <h2 className="flex-none text-2xl font-bold mb-4 text-[#E8E5DC] border-b border-[#2B2D29] pb-3">Recent Games</h2>

                    {games.length === 0 ? (
                        <div className="bg-[#1D1E1C] border border-[#2B2D29] rounded-2xl p-12 text-center shadow-[0_8px_20px_rgba(0,0,0,0.12)]">
                            <p className="text-[#A6A59E] font-medium text-lg">No games played yet. <Link to="/" className="text-[#4F7A5A] hover:text-[#5D8A67] hover:underline">Go play a match!</Link></p>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col min-h-0 bg-[#1D1E1C] border border-[#2B2D29] rounded-2xl overflow-hidden shadow-[0_8px_20px_rgba(0,0,0,0.12)]">
                            <div className="flex-1 overflow-x-auto overflow-y-auto">
                                <table className="w-full text-left border-collapse min-w-[600px] relative">
                                    <thead className="sticky top-0 z-10">
                                        <tr className="bg-[#171817] text-[#A6A59E] text-[11px] uppercase tracking-wider border-b border-[#2B2D29] shadow-sm">
                                            <th className="py-4 px-6 font-bold">Result</th>
                                            <th className="py-4 px-6 font-bold">Opponent</th>
                                            <th className="py-4 px-6 font-bold text-right">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#2B2D29] text-sm">
                                        {games.map(game => {
                                            const isWhite = game.whitePlayerId === user.id;
                                            const myColor = isWhite ? 'white' : 'black';
                                            const opponent = isWhite ? (game.blackPlayer || { name: 'Guest', rating: '?' }) : (game.whitePlayer || { name: 'Guest', rating: '?' });

                                            let resultText = "In Progress";
                                            let resultColor = "text-[#D7B68A] bg-[#2B231D] border-[#6B513C]";

                                            if (game.status === "FINISHED") {
                                                if (game.result === "draw" || game.result === "stalemate" || game.result === "draw_agreed") {
                                                    resultText = "Draw";
                                                    resultColor = "text-[#D8D6C8] bg-[#272822] border-[#5A5F53]";
                                                } else if (game.winner === myColor) {
                                                    resultText = "Victory";
                                                    resultColor = "text-[#DCE7DE] bg-[#2B3B2E] border-[#4F7A5A]";
                                                } else {
                                                    resultText = "Defeat";
                                                    resultColor = "text-[#D7B68A] bg-[#2D2120] border-[#6A4742]";
                                                }
                                            }

                                            return (
                                                <tr key={game.id} className="hover:bg-[#242725] transition-colors group">
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`px-2.5 py-1 rounded-md font-bold text-xs border ${resultColor} shadow-sm`}>{resultText}</span>
                                                            {game.result && <span className="text-[11px] font-bold text-[#777871] uppercase tracking-wide">({game.result.replace('_', ' ')})</span>}
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-3.5 h-3.5 rounded shadow-sm ${isWhite ? 'bg-[#E8E5DC] border border-[#C9C4B7]' : 'bg-[#171817] border border-[#2B2D29]'}`} title={`Played as ${myColor}`} />
                                                            <span className="font-bold text-[#E8E5DC]">{opponent.name}</span>
                                                            <span className="text-[11px] font-bold text-[#A6A59E] bg-[#171817] px-2 py-0.5 rounded-full border border-[#2B2D29]">{opponent.rating} Elo</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-6 text-sm font-medium text-[#A6A59E] text-right">
                                                        {new Date(game.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </section>
            </main>

        </div>
    );
};
