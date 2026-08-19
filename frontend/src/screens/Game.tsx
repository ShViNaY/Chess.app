import { ChessBoard } from "../components/ChessBoard";
import { useSocket } from "../hooks/useSocket";
import { useEffect, useState, useRef } from "react";
import { Chess } from "chess.js";
import { ChessClock } from "../components/ChessClock";
import { useLocation, useNavigate } from "react-router-dom";
import { useAudio } from "../hooks/useAudio";
import { useAuth } from "../context/AuthContext";

export const INIT_GAME = "init_game";
export const MOVE = "move";
export const GAME_OVER = "game_over";
export const REJOIN_GAME = "rejoin_game";
export const OPPONENT_DISCONNECTED = "opponent_disconnected";
export const RESIGN = "resign";
export const OFFER_DRAW = "offer_draw";
export const ACCEPT_DRAW = "accept_draw";
export const REJECT_DRAW = "reject_draw";

export const FIND_MATCH = "find_match";
export const CREATE_ROOM = "create_room";
export const JOIN_ROOM = "join_room";
export const ROOM_CREATED = "room_created";
export const ROOM_JOINED = "room_joined";
export const ROOM_NOT_FOUND = "room_not_found";
export const CHAT_MESSAGE = "chat_message";

type ChatMessageItem = {
  sender: "white" | "black";
  text: string;
};

type GameResult = {
  result: "checkmate" | "stalemate" | "draw" | "abandoned" | "timeout" | "resignation" | "draw_agreed";
  winner: "white" | "black" | null;
  newRating?: number;
} | null;

type MoveHistoryItem = {
  from: string;
  to: string;
  piece: string;
  color: "w" | "b";
  captured?: string | null;
  promotion?: string | null;
};

export const Game = () => {
  const socket = useSocket();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { playSound, toggleMute, isMuted } = useAudio();
  const [mutedUi, setMutedUi] = useState(isMuted.current);

  // Auto start/find game when socket connects based on routing state
  useEffect(() => {
    if (!socket) return;

    const state = location.state as { mode?: string, time?: number, roomId?: string } | null;

    if (state?.mode === "matchmaking") {
      socket.send(JSON.stringify({ type: FIND_MATCH, payload: { time: state.time || 600000 } }));
    } else if (state?.mode === "create_private") {
      socket.send(JSON.stringify({ type: CREATE_ROOM, payload: { time: state.time || 600000 } }));
    } else if (state?.mode === "join_private") {
      socket.send(JSON.stringify({ type: JOIN_ROOM, payload: { code: state.roomId } }));
    } else {
      // Fallback to auto-matchmaking standard game if directly navigated
      socket.send(JSON.stringify({ type: FIND_MATCH, payload: { time: 600000 } }));
    }
  }, [socket, location.state, navigate]);

  const [chess, setChess] = useState(new Chess());
  const [board, setBoard] = useState(chess.board());
  const [myColor, setMyColor] = useState<"white" | "black" | null>(null);
  const [gameResult, setGameResult] = useState<GameResult>(null);
  const [moveHistory, setMoveHistory] = useState<MoveHistoryItem[]>([]);
  const [capturedWhite, setCapturedWhite] = useState<string[]>([]);
  const [capturedBlack, setCapturedBlack] = useState<string[]>([]);

  // Room State
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [roomError, setRoomError] = useState<string | null>(null);

  // Draw State
  const [drawOfferReceived, setDrawOfferReceived] = useState(false);
  const [showDrawRejectedToast, setShowDrawRejectedToast] = useState(false);

  // Clocks state
  const [whiteTime, setWhiteTime] = useState<number>(600000); // 10 minutes default
  const [blackTime, setBlackTime] = useState<number>(600000);

  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessageItem[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  const isChatOpenRef = useRef(isChatOpen);
  useEffect(() => {
    isChatOpenRef.current = isChatOpen;
  }, [isChatOpen]);

  // ===============================
  // SOCKET MESSAGE HANDLER
  // ===============================
  useEffect(() => {
    if (!socket) return;

    const handleMessage = (event: MessageEvent) => {
      const message = JSON.parse(event.data);

      switch (message.type) {

        case INIT_GAME: {
          const fen = message.payload?.fen;
          const newChess = fen ? new Chess(fen) : new Chess();

          setChess(newChess);
          setBoard(newChess.board());
          setGameResult(null);
          setMoveHistory([]);
          setCapturedWhite([]);
          setCapturedBlack([]);
          setDrawOfferReceived(false);
          setInviteCode(null);
          setRoomError(null);
          setChatMessages([]);

          if (message.payload?.color) {
            setMyColor(message.payload.color);
            // Play start sound only when we are fully assigned to a game
            playSound("game-start");
          }

          if (message.payload?.whiteTime !== undefined) {
            setWhiteTime(message.payload.whiteTime);
          }
          if (message.payload?.blackTime !== undefined) {
            setBlackTime(message.payload.blackTime);
          }

          break;
        }

        case ROOM_CREATED: {
          setInviteCode(message.payload.code);
          break;
        }

        case ROOM_NOT_FOUND: {
          setRoomError("Room not found or already full.");
          setTimeout(() => navigate("/"), 3000); // Send back to lobby
          break;
        }

        case MOVE: {
          const payload = message.payload;

          if (payload?.fen) {
            const newChess = new Chess(payload.fen);
            setChess(newChess);
            setBoard(newChess.board());
          }

          if (payload?.whiteTime !== undefined) {
            setWhiteTime(payload.whiteTime);
          }
          if (payload?.blackTime !== undefined) {
            setBlackTime(payload.blackTime);
          }

          if (payload?.move) {
            const move = payload.move;

            setMoveHistory(prev => [...prev, move]);

            if (move.captured) {
              if (move.color === "w") {
                setCapturedBlack(prev => [...prev, move.captured]);
              } else {
                setCapturedWhite(prev => [...prev, move.captured]);
              }
              playSound("capture");
            } else {
              playSound("move");
            }

            // After applying move, see if the next state is check
            if (payload.fen) {
              const checkTest = new Chess(payload.fen);
              if (checkTest.inCheck()) {
                playSound("check");
              }
            }
          }

          break;
        }

        case GAME_OVER: {
          let updatedRating: number | undefined;

          if (message.payload.newRatings && user && myColor) {
            updatedRating = myColor === "white"
              ? message.payload.newRatings.whiteElo
              : message.payload.newRatings.blackElo;

            if (updatedRating !== undefined && updatedRating !== user.rating) {
              updateUser({ ...user, rating: updatedRating });
            }
          }

          setGameResult({
            result: message.payload.result,
            winner: message.payload.winner ?? null,
            newRating: updatedRating
          });
          setDrawOfferReceived(false);
          playSound("game-end");
          break;
        }

        case OPPONENT_DISCONNECTED: {
          let updatedRating: number | undefined;

          if (message.payload.newRatings && user && myColor) {
            updatedRating = myColor === "white"
              ? message.payload.newRatings.whiteElo
              : message.payload.newRatings.blackElo;

            if (updatedRating !== undefined && updatedRating !== user.rating) {
              updateUser({ ...user, rating: updatedRating });
            }
          }

          setGameResult({
            result: "abandoned",
            winner: myColor,
            newRating: updatedRating
          });
          setDrawOfferReceived(false);
          playSound("game-end");
          break;
        }

        case OFFER_DRAW: {
          setDrawOfferReceived(true);
          break;
        }

        case REJECT_DRAW: {
          setShowDrawRejectedToast(true);
          setTimeout(() => setShowDrawRejectedToast(false), 3000);
          break;
        }

        case CHAT_MESSAGE: {
          setChatMessages(prev => [...prev, message.payload]);
          if (!isChatOpenRef.current) {
            setUnreadChatCount(prev => prev + 1);
          }
          break;
        }
      }
    };

    socket.addEventListener("message", handleMessage);
    return () => socket.removeEventListener("message", handleMessage);
  }, [socket, myColor, playSound, navigate]);

  if (!socket) return <div className="min-h-screen flex justify-center items-center bg-neutral-50 dark:bg-[#0a0a0a] text-neutral-900 dark:text-white transition-colors duration-300">Connecting...</div>;

  // ===============================
  // MATERIAL CALCULATION
  // ===============================
  const pieceValue: Record<string, number> = {
    p: 1,
    n: 3,
    b: 3,
    r: 5,
    q: 9,
  };

  const whiteScore = capturedBlack.reduce(
    (sum, p) => sum + (pieceValue[p] ?? 0),
    0
  );

  const blackScore = capturedWhite.reduce(
    (sum, p) => sum + (pieceValue[p] ?? 0),
    0
  );

  const materialDiff = whiteScore - blackScore;

  // ===============================
  // TURN LOGIC
  // ===============================
  const isMyTurn =
    gameResult === null &&
    myColor !== null &&
    ((chess.turn() === "w" && myColor === "white") ||
      (chess.turn() === "b" && myColor === "black"));

  return (
   <div className="relative min-h-screen w-full flex justify-center items-start text-[#E8E5DC] font-sans selection:bg-[#4F7A5A]/25 transition-colors duration-300 overflow-x-hidden">

     {/* Abstract Background Blobs */}
     <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] max-w-[800px] max-h-[800px] bg-[#4F7A5A]/8 rounded-full blur-[120px] pointer-events-none z-0 mix-blend-multiply" />
     <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] max-w-[900px] max-h-[900px] bg-[#A6A59E]/8 rounded-full blur-[150px] pointer-events-none z-0 mix-blend-multiply" />

     {/* Top Left Controls */}
     <div className="absolute top-6 left-6 flex items-center gap-3 z-50">
       <button
         onClick={() => {
           const isNowMuted = toggleMute();
           setMutedUi(isNowMuted);
         }}
         className="p-3 bg-[#1D1E1C] hover:bg-[#242725] border border-[#2B2D29] rounded-xl text-[#A6A59E] hover:text-[#E8E5DC] transition-colors flex items-center gap-2 font-bold text-sm shadow-[0_4px_12px_rgba(0,0,0,0.12)]"
       >
         <span>{mutedUi ? "🔇" : "🔊"}</span>
         <span className="hidden sm:inline">{mutedUi ? "Muted" : "Sound On"}</span>
       </button>
     </div>



      <div className="relative z-10 flex flex-col lg:flex-row gap-6 lg:gap-12 w-full max-w-6xl justify-center px-4 sm:px-6 items-center lg:items-center py-4 sm:py-8">

        {/* BOARD AREA (Center Column) */}
        <div className="flex flex-col w-full max-w-[512px] shrink-0">

          {/* Opponent Clock (Mobile Fallback - Top) */}
          {myColor && (
            <div className="flex lg:hidden justify-end mb-3 w-full">
              <ChessClock
                time={myColor === "white" ? blackTime : whiteTime}
                isActive={!isMyTurn && gameResult === null && moveHistory.length > 0}
                color={myColor === "white" ? "black" : "white"}
              />
            </div>
          )}

          {/* TURN INFO HEADER separated from the board */}
          {myColor && (
            <div className="flex items-center justify-between bg-[#1D1E1C] border border-[#2B2D29] rounded-xl px-4 py-3 mb-3 shadow-[0_8px_20px_rgba(0,0,0,0.12)] transition-all">
              <div className="text-sm font-medium text-[#A6A59E]">
                You are <span className="font-bold text-[#E8E5DC] capitalize">{myColor}</span>
              </div>

              <div className={`text-xs px-3 py-1.5 rounded-md font-bold uppercase tracking-wider ${gameResult
                ? (gameResult.winner === myColor
                  ? "bg-[#2B3B2E] text-[#DCE7DE] border border-[#4F7A5A]"
                  : gameResult.result === "abandoned"
                    ? "bg-[#2B231D] text-[#D7B68A] border border-[#6B513C]"
                    : gameResult.result === "draw_agreed" || gameResult.result === "draw" || gameResult.result === "stalemate"
                      ? "bg-[#272822] text-[#D8D6C8] border border-[#5A5F53]"
                      : "bg-[#2D2120] text-[#D7B68A] border border-[#6A4742]")
                : (isMyTurn ? "bg-[#2B3B2E] text-[#DCE7DE] border border-[#4F7A5A]" : "bg-[#1F211F] text-[#A6A59E] border border-[#2B2D29]")
                }`}>
                {gameResult ? (
                  gameResult.result === "abandoned" ? "⚠️ Opponent Left" :
                    gameResult.result === "timeout" ? (gameResult.winner === myColor ? "⏱ You Won by Timeout!" : "⏳ You Lost by Timeout") :
                      gameResult.result === "resignation" ? (gameResult.winner === myColor ? "🏆 Won by Resignation" : "🏳️ You Resigned") :
                        gameResult.result === "checkmate" ? (gameResult.winner === myColor ? "🏆 You Won!" : "💀 You Lost") :
                          "🤝 Draw"
                ) : (
                  isMyTurn ? "♟ Your turn" : "⏳ Opponent's turn"
                )}
              </div>
            </div>
          )}

          {/* Captured Black Pieces (Top of the board) */}
          <div className="flex gap-1 mb-1.5 h-6 items-center overflow-hidden px-1">
            {capturedBlack.map((piece, i) => (
              <div key={i} className="w-5 h-full flex items-center justify-center">
                <img
                  src={`/pieces/b${piece.toUpperCase()}.webp`}
                  className="w-full h-full object-contain opacity-90 drop-shadow-sm"
                  alt={`Captured ${piece}`}
                />
              </div>
            ))}
            {materialDiff > 0 && (
              <span className="text-[#DCE7DE] font-bold ml-2 text-xs bg-[#2B3B2E] border border-[#4F7A5A] px-1.5 py-0.5 rounded shadow-sm">
                +{materialDiff}
              </span>
            )}
          </div>

          <div className="relative z-10 mt-1 w-full max-w-[512px]">
            {/* Desktop Timers (Floating Left) */}
            {myColor && (
              <div className="hidden lg:flex absolute right-[100%] top-0 bottom-0 pr-6 flex-col justify-between items-end pointer-events-none w-[180px]">
                <div className="pointer-events-auto">
                  <ChessClock
                    time={myColor === "white" ? blackTime : whiteTime}
                    isActive={!isMyTurn && gameResult === null && moveHistory.length > 0}
                    color={myColor === "white" ? "black" : "white"}
                  />
                </div>
                <div className="pointer-events-auto">
                  <ChessClock
                    time={myColor === "white" ? whiteTime : blackTime}
                    isActive={isMyTurn && gameResult === null && moveHistory.length > 0}
                    color={myColor}
                  />
                </div>
              </div>
            )}

            <div className={`w-full aspect-square border border-white/60 dark:border-white/10 bg-white/60 dark:bg-black/20 backdrop-blur-md relative flex items-center justify-center rounded-xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all`}>
              <ChessBoard
                socket={socket}
                board={board}
                myColor={myColor ?? "white"}
                isMyTurn={isMyTurn}
                chess={chess}
              />

              {/* Matchmaking / Waiting Overlay */}
              {!myColor && !gameResult && (
                <div className="absolute inset-0 bg-[#171817]/90 backdrop-blur-sm flex flex-col items-center justify-center z-40 transition-colors">
                  {roomError ? (
                    <div className="text-center animate-in fade-in zoom-in duration-300">
                      <div className="text-4xl mb-4">⚠️</div>
                      <h3 className="text-xl font-bold text-[#D7B68A] mb-2">Error</h3>
                      <p className="text-[#A6A59E]">{roomError}</p>
                      <p className="text-sm text-[#777871] mt-4">Returning to lobby...</p>
                    </div>
                  ) : inviteCode ? (
                    <div className="text-center animate-in fade-in zoom-in duration-500">
                      <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#2B3B2E] flex items-center justify-center relative">
                        <div className="absolute inset-0 rounded-full border border-[#4F7A5A] animate-ping"></div>
                        <div className="text-2xl">🔗</div>
                      </div>
                      <h3 className="text-xl font-bold text-[#E8E5DC] mb-2">Private Room Created</h3>
                      <p className="text-[#A6A59E] text-sm mb-6">Share this code with your friend</p>
                      <div className="bg-[#1D1E1C] border border-[#2B2D29] px-8 py-4 rounded-xl font-mono text-4xl text-[#DCE7DE] font-bold tracking-[0.2em] shadow-inner mb-6 mx-auto inline-block">
                        {inviteCode}
                      </div>
                      <div className="flex justify-center flex-col items-center">
                        <div className="flex h-1.5 w-1.5 relative mb-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4F7A5A] opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#5D8A67]"></span>
                        </div>
                        <p className="text-xs text-[#777871] uppercase tracking-widest font-semibold">Waiting for them to join...</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center animate-in fade-in zoom-in duration-500">
                      <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[#1F211F] flex items-center justify-center relative">
                        <div className="absolute inset-0 rounded-full border-t-2 border-[#4F7A5A] animate-spin"></div>
                        <div className="text-2xl">🔍</div>
                      </div>
                      <h3 className="text-xl font-bold text-[#E8E5DC] mb-2">Finding Opponent</h3>
                      <p className="text-[#A6A59E] text-sm max-w-[250px] mx-auto leading-relaxed">
                        Searching for a player seeking a match with the same time control...
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Game Over Modal Overlay */}
              {gameResult && (
                <div className="absolute inset-0 bg-white/40 dark:bg-black/60 backdrop-blur-md flex flex-col items-center justify-center z-50 animate-in fade-in duration-300 transition-colors">
                  <div className="bg-[#1D1E1C] p-8 rounded-2xl border border-[#2B2D29] shadow-[0_8px_20px_rgba(0,0,0,0.12)] flex flex-col items-center text-center max-w-[80%] backdrop-blur-sm">

                    {/* Icon */}
                    <div className="text-5xl mb-4 drop-shadow-lg">
                      {gameResult.result === "abandoned" ? "🏆" :
                        gameResult.result === "timeout" ? (gameResult.winner === myColor ? "🏆" : "⏳") :
                          gameResult.result === "resignation" ? (gameResult.winner === myColor ? "🏆" : "🏳️") :
                            gameResult.result === "checkmate" ? (gameResult.winner === myColor ? "🏆" : "💀") :
                              "🤝"}
                    </div>

                    <h2 className={`text-3xl font-black mb-2 tracking-tight ${gameResult.winner === myColor || gameResult.result === "abandoned" ? "text-[#DCE7DE]" :
                      gameResult.result === "draw" || gameResult.result === "draw_agreed" || gameResult.result === "stalemate" ? "text-[#D8D6C8]" : "text-[#E8E5DC]"
                      }`}>
                      {gameResult.result === "abandoned" ? "You Won!" :
                        gameResult.result === "timeout" ? (gameResult.winner === myColor ? "You Won!" : "Time's Up!") :
                          gameResult.result === "resignation" ? (gameResult.winner === myColor ? "You Won!" : "You Resigned") :
                            gameResult.result === "checkmate" ? (gameResult.winner === myColor ? "You Won!" : "Game Over") :
                              "It's a Draw"}
                    </h2>

                    {/* Subtitle */}
                    <p className="text-[#A6A59E] text-sm mb-4">
                      {gameResult.result === "checkmate" && gameResult.winner === myColor ? "Brilliant checkmate." :
                        gameResult.result === "checkmate" && gameResult.winner !== myColor ? "You were checkmated by the opponent." :
                          gameResult.result === "timeout" && gameResult.winner === myColor ? "Your opponent ran out of time." :
                            gameResult.result === "timeout" && gameResult.winner !== myColor ? "You ran out of time." :
                              gameResult.result === "resignation" && gameResult.winner === myColor ? "Your opponent has resigned." :
                                gameResult.result === "resignation" && gameResult.winner !== myColor ? "You conceded the match." :
                                  gameResult.result === "abandoned" ? "Your opponent abandoned the match." :
                                    gameResult.result === "draw_agreed" ? "A draw was agreed upon by mutual consent." :
                                      "The game ended in a stalemate or agreed draw."}
                    </p>

                    {/* Rating Changes */}
                    {gameResult.newRating !== undefined && user && (
                      <div className="mb-8 flex items-center justify-center gap-3">
                        <span className="text-[#777871] font-bold uppercase text-xs tracking-widest">New Rating</span>
                        <span className="text-2xl font-black text-[#E8E5DC]">{gameResult.newRating}</span>
                        <span className={`text-sm font-bold px-2 py-0.5 rounded-full border shadow-sm ${gameResult.newRating > user.rating ? "bg-[#2B3B2E] border-[#4F7A5A] text-[#DCE7DE]" : gameResult.newRating < user.rating ? "bg-[#2D2120] border-[#6A4742] text-[#D7B68A]" : "bg-[#1F211F] border-[#2B2D29] text-[#A6A59E]"}`}>
                          {gameResult.newRating > user.rating ? "+" : ""}{gameResult.newRating - user.rating}
                        </span>
                      </div>
                    )}

                    {!gameResult.newRating && <div className="mb-4"></div>}

                    {/* Play Again Button */}
                    <button
                      onClick={() => {
                        navigate("/");
                      }}
                      className="group relative px-8 py-3 w-full font-bold text-[#E8E5DC] rounded-xl bg-[#4F7A5A] hover:bg-[#5D8A67] shadow-[0_4px_12px_rgba(0,0,0,0.18)] transition-colors"
                    >
                      Back to Lobby
                    </button>

                  </div>
                </div>
              )}

              {/* Draw Offer Modal */}
              {drawOfferReceived && (
                <div className="absolute inset-0 bg-white/40 dark:bg-black/40 backdrop-blur-md flex items-center justify-center z-40 transition-colors">
                    <div className="bg-[#1D1E1C] p-6 rounded-2xl border border-[#2B2D29] shadow-[0_8px_20px_rgba(0,0,0,0.12)] flex flex-col items-center text-center max-w-[80%] backdrop-blur-sm">
                    <div className="text-3xl mb-3">🤝</div>
                    <h3 className="text-xl font-bold text-[#E8E5DC] mb-2">Draw Offered</h3>
                    <p className="text-sm text-[#A6A59E] mb-6">Your opponent has offered a draw.</p>

                    <div className="flex gap-3 w-full">
                      <button
                        onClick={() => {
                          socket.send(JSON.stringify({ type: REJECT_DRAW }));
                          setDrawOfferReceived(false);
                        }}
                        className="flex-1 py-2 px-4 rounded-xl font-bold bg-[#1F211F] hover:bg-[#242725] text-[#E8E5DC] transition-colors border border-[#2B2D29] shadow-sm"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => {
                          socket.send(JSON.stringify({ type: ACCEPT_DRAW }));
                          setDrawOfferReceived(false);
                        }}
                        className="flex-1 py-2 px-4 rounded-xl font-bold bg-[#2B3B2E] hover:bg-[#334E3B] text-[#DCE7DE] transition-colors border border-[#4F7A5A] shadow-sm"
                      >
                        Accept
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Captured White Pieces (Bottom of the board) */}
          <div className="flex gap-1 mt-2.5 h-6 items-center overflow-hidden px-1">
            {capturedWhite.map((piece, i) => (
              <div key={i} className="w-5 h-full flex items-center justify-center">
                <img
                  src={`/pieces/w${piece.toUpperCase()}.webp`}
                  className="w-full h-full object-contain opacity-90 drop-shadow-sm"
                  alt={`Captured ${piece}`}
                />
              </div>
            ))}
            {materialDiff < 0 && (
              <span className="text-[#DCE7DE] font-bold ml-2 text-xs bg-[#2B3B2E] border border-[#4F7A5A] px-1.5 py-0.5 rounded shadow-sm">
                +{Math.abs(materialDiff)}
              </span>
            )}
          </div>


          {/* Player Clock (Mobile Fallback - Bottom) */}
          {myColor && (
            <div className="flex lg:hidden justify-end mt-2 w-full">
              <ChessClock
                time={myColor === "white" ? whiteTime : blackTime}
                isActive={isMyTurn && gameResult === null && moveHistory.length > 0}
                color={myColor}
              />
            </div>
          )}

          {/* Toast Notification for Rejected Draw */}
          {showDrawRejectedToast && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#2D2120] border border-[#6A4742] text-[#D7B68A] px-4 py-2 rounded-full text-sm font-bold shadow-lg z-50 animate-in slide-in-from-bottom flex items-center gap-2">
              <span>✕</span> Your draw offer was declined.
            </div>
          )}

        </div>

        {/* MOVE PANEL & ACTION BUTTONS */}
        <div className="w-full lg:w-[320px] shrink-0 flex flex-col h-auto min-h-[300px] lg:min-h-[512px] self-stretch justify-between py-2">

          <div className="bg-white/5 dark:bg-black/20 border border-white/10 dark:border-white/5 rounded-3xl p-0 overflow-hidden flex flex-col backdrop-blur-3xl shadow-[0_16px_40px_rgba(0,0,0,0.4)] flex-1 min-h-[150px] transition-all">
            <div className="text-sm font-bold uppercase tracking-wide bg-white/5 dark:bg-white/[0.02] border-b border-white/10 dark:border-white/5 px-4 py-3 text-neutral-300 dark:text-gray-300 shrink-0 flex items-center justify-between transition-colors shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
              <span>Move History</span>
              <span className="text-[10px] bg-neutral-200 dark:bg-white/10 text-neutral-600 dark:text-gray-400 px-2 py-0.5 rounded-full font-bold">{moveHistory.length} moves</span>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden p-0 scrollbar-thin scrollbar-thumb-neutral-300 dark:scrollbar-thumb-white/10 scrollbar-track-transparent">
              <div className="flex flex-col text-[13px] leading-relaxed">
                {Array.from({ length: Math.ceil(moveHistory.length / 2) }).map((_, i) => {
                  const whiteMove = moveHistory[i * 2];
                  const blackMove = moveHistory[i * 2 + 1];
                  const isLatestWhite = i * 2 === moveHistory.length - 1;
                  const isLatestBlack = i * 2 + 1 === moveHistory.length - 1;

                  return (
                    <div key={i} className={`flex border-b border-white/10 dark:border-white/5 ${i % 2 === 0 ? "bg-white/5 dark:bg-white/[0.02]" : "bg-transparent"} hover:bg-white/10 dark:hover:bg-white/[0.06] transition-colors`}>
                      <div className="w-10 py-1.5 text-center text-neutral-500 font-mono border-r border-white/10 dark:border-white/5 bg-white/5 dark:bg-black/20 select-none flex items-center justify-center text-xs font-bold shadow-inner">
                        {i + 1}
                      </div>

                      <div className={`flex-1 flex items-center py-1.5 px-3 font-mono font-medium ${isLatestWhite ? "bg-[#2B3B2E] text-[#DCE7DE] font-bold shadow-inner" : "text-[#A6A59E]"}`}>
                        {whiteMove ? `${whiteMove.from} → ${whiteMove.to}` : ""}
                      </div>

                      <div className={`flex-1 flex items-center py-1.5 px-3 font-mono font-medium border-l border-[#2B2D29] border-dashed ${isLatestBlack ? "bg-[#2B3B2E] text-[#DCE7DE] font-bold shadow-inner" : "text-[#A6A59E]"}`}>
                        {blackMove ? `${blackMove.from} → ${blackMove.to}` : ""}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Action Buttons & Chat Toggle */}
          {myColor && gameResult === null && (
            <div className="flex flex-col gap-3 mt-4">
              {!isChatOpen && (
                <button
                  onClick={() => {
                    setIsChatOpen(true);
                    setUnreadChatCount(0);
                  }}
                  className="w-full bg-white/50 hover:bg-white/80 dark:bg-black/20 dark:hover:bg-white/5 text-neutral-600 hover:text-neutral-900 dark:text-gray-400 dark:hover:text-white border border-white/60 dark:border-white/10 transition-all rounded-xl py-3 text-sm font-bold tracking-wider uppercase flex items-center justify-center gap-2 shadow-sm backdrop-blur-md"
                >
                  <span>💬</span> Open Chat
                  {unreadChatCount > 0 && (
                    <span className="bg-[#4F7A5A] text-[#E8E5DC] px-2 py-0.5 rounded-full text-xs normal-case tracking-normal">
                      {unreadChatCount} new
                    </span>
                  )}
                </button>
              )}

              {/* CHAT PANEL */}
              {isChatOpen && (
                <div className="bg-white/60 dark:bg-black/20 border border-white/50 dark:border-white/10 rounded-2xl flex flex-col backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.04)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex-1 min-h-[250px] overflow-hidden transition-colors relative">
                  <div className="flex items-center justify-between bg-white/40 dark:bg-white/5 border-b border-white/60 dark:border-white/5 px-6 py-3 shadow-inner">
                    <span className="text-sm font-bold uppercase tracking-wide text-neutral-600 dark:text-white/80">Live Chat</span>
                    <button onClick={() => setIsChatOpen(false)} className="text-neutral-500 hover:text-neutral-800 dark:text-gray-400 dark:hover:text-white text-xl leading-none px-2">&times;</button>
                  </div>

                  {/* Messages Area */}
                  <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 scrollbar-thin scrollbar-thumb-neutral-300 dark:scrollbar-thumb-white/10 scrollbar-track-transparent min-h-[150px]">
                    {chatMessages.length === 0 ? (
                      <div className="m-auto text-xs font-medium text-neutral-400 dark:text-gray-500 italic">Say hi to your opponent!</div>
                    ) : (
                      chatMessages.map((msg, idx) => {
                        const isMe = msg.sender === myColor;
                        return (
                          <div key={idx} className={`max-w-[85%] rounded-xl px-3 py-2 text-[13px] shadow-sm font-medium ${isMe ? 'bg-[#4F7A5A] text-[#E8E5DC] self-end rounded-tr-sm' : 'bg-[#1F211F] text-[#E8E5DC] self-start rounded-tl-sm border border-[#2B2D29] backdrop-blur-sm'}`}>
                            {msg.text}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Input Area */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!chatInput.trim()) return;
                      socket.send(JSON.stringify({ type: CHAT_MESSAGE, payload: { text: chatInput.trim() } }));
                      setChatInput("");
                    }}
                    className="p-3 bg-black/20 dark:bg-black/40 border-t border-white/10 dark:border-white/5 flex gap-2 transition-colors shadow-inner"
                  >
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 bg-[#171817] border border-[#2B2D29] rounded-lg px-3 py-2 text-sm text-[#E8E5DC] placeholder-[#777871] focus:outline-none focus:border-[#4F7A5A] transition-colors shadow-inner"
                    />
                    <button
                      type="submit"
                      disabled={!chatInput.trim()}
                      className="bg-[#4F7A5A] hover:bg-[#5D8A67] disabled:opacity-50 disabled:hover:bg-[#4F7A5A] text-[#E8E5DC] rounded-lg px-4 py-2 text-sm font-bold transition-colors shadow-sm"
                    >
                      Send
                    </button>
                  </form>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (confirm("Are you sure you want to resign?")) {
                      socket.send(JSON.stringify({ type: RESIGN }));
                    }
                  }}
                  className="flex-1 bg-[#1F211F] hover:bg-[#242725] text-[#E8E5DC] hover:text-[#D7B68A] border border-[#2B2D29] hover:border-[#6A4742] transition-colors rounded-xl py-3 text-sm font-bold tracking-wider uppercase flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
                >
                  <span>🏳️</span> Resign
                </button>

                <button
                  onClick={() => {
                    socket.send(JSON.stringify({ type: OFFER_DRAW }));
                    alert("Draw offer sent to opponent.");
                  }}
                  className="flex-1 bg-[#1F211F] hover:bg-[#242725] text-[#E8E5DC] hover:text-[#DCE7DE] border border-[#2B2D29] hover:border-[#4F7A5A] transition-colors rounded-xl py-3 text-sm font-bold tracking-wider uppercase flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
                >
                  <span>🤝</span> Offer Draw
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};