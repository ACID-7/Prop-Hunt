import { useState } from "react";
import { useRouter } from "next/router";
import * as Colyseus from "colyseus.js";

const COLYSEUS_URL =
  process.env.NEXT_PUBLIC_COLYSEUS_URL ?? "ws://localhost:2567";

export default function Landing() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const client = new Colyseus.Client(COLYSEUS_URL);

  async function createRoom() {
    if (!name.trim()) return setError("Enter your name!");
    setLoading(true);
    try {
      const room = await client.create("prop_hunt", { name: name.trim() });
      localStorage.setItem("playerName", name.trim());
      localStorage.setItem("sessionId", room.sessionId);
      router.push(`/room/${room.id}`);
    } catch (e) {
      setError("Failed to create room. Is the server running?");
      setLoading(false);
    }
  }

  async function joinRoom() {
    if (!name.trim()) return setError("Enter your name!");
    if (!joinCode.trim()) return setError("Enter a room code!");
    setLoading(true);
    try {
      const room = await client.joinById(joinCode.trim().toUpperCase(), {
        name: name.trim(),
      });
      localStorage.setItem("playerName", name.trim());
      localStorage.setItem("sessionId", room.sessionId);
      router.push(`/room/${room.id}`);
    } catch (e) {
      setError("Room not found. Check the code!");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-game-bg flex flex-col items-center justify-center p-8">
      <div className="mb-12 text-center">
        <h1 className="text-game-accent text-glow text-3xl mb-4 font-game">
          🕵️ PROP HUNT
        </h1>
        <p className="text-gray-400 text-xs font-game">
          Hide as objects. Hunt the props.
        </p>
      </div>

      <div className="pixel-border bg-game-panel p-8 w-full max-w-md">
        <div className="mb-6">
          <label className="text-game-accent text-xs font-game block mb-2">
            YOUR NAME
          </label>
          <input
            className="w-full bg-game-bg border-2 border-gray-600 text-white text-xs font-game p-3 focus:border-game-accent outline-none"
            placeholder="Enter name..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={16}
          />
        </div>

        <button
          onClick={createRoom}
          disabled={loading}
          className="w-full bg-game-accent text-game-bg font-game text-xs p-4 hover:brightness-110 transition mb-4 disabled:opacity-50"
        >
          {loading ? "CONNECTING..." : "🎮 CREATE ROOM"}
        </button>

        <div className="flex gap-2">
          <input
            className="flex-1 bg-game-bg border-2 border-gray-600 text-white text-xs font-game p-3 focus:border-game-accent outline-none uppercase"
            placeholder="ROOM CODE"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            maxLength={8}
          />
          <button
            onClick={joinRoom}
            disabled={loading}
            className="bg-game-blue text-white font-game text-xs p-3 hover:brightness-110 transition disabled:opacity-50"
          >
            JOIN
          </button>
        </div>

        {error && (
          <p className="text-game-red text-xs font-game mt-4 text-center">
            ⚠ {error}
          </p>
        )}
      </div>

      <p className="text-gray-600 text-xs font-game mt-8">
        2–8 PLAYERS • BROWSER • FREE
      </p>
    </div>
  );
}

