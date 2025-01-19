'use client'
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [roomId, setRoomId] = useState("");
  const router = useRouter();

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomId.trim()) {
      router.push(`/call/${roomId}`);
    }
  };
  

  const handleCreateRoom = () => {
    const newRoomId = Math.random().toString(36).substring(7);
    router.push(`/call/${newRoomId}`);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
            Virtual Power Slap Game
          </h1>
          <p className="text-xl text-gray-300">
            Challenge your friends to an epic virtual slap battle! Use hand gestures to score points and face tracking to dodge.
          </p>
        </div>

        {/* Room Creation/Joining Section */}
        <div className="mt-12 max-w-md mx-auto bg-gray-800/50 p-6 rounded-xl border border-gray-700 backdrop-blur-sm">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-center mb-6">
              Start Playing
            </h2>
            
            {/* Create Room Button */}
            <div>
              <Button 
                onClick={handleCreateRoom}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                Create New Game Room
              </Button>
            </div>

            <div className="relative flex items-center">
              <div className="flex-grow border-t border-gray-700"></div>
              <span className="flex-shrink mx-4 text-gray-400">or</span>
              <div className="flex-grow border-t border-gray-700"></div>
            </div>

            {/* Join Room Form */}
            <form onSubmit={handleJoinRoom} className="space-y-3">
              <Input
                type="text"
                placeholder="Enter Room ID"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full bg-gray-700/50 border-gray-600 text-white placeholder-gray-400"
              />
              <Button 
                type="submit" 
                className="w-full"
                variant="secondary"
                disabled={!roomId.trim()}
              >
                Join Existing Room
              </Button>
            </form>
          </div>
        </div>

        {/* How to Play Section */}
        <div className="mt-24 grid md:grid-cols-3 gap-8">
          <div className="bg-gray-800/30 p-6 rounded-xl border border-gray-700">
            <div className="text-blue-400 text-4xl mb-4">👋</div>
            <h3 className="text-xl font-semibold mb-2">Hand Gestures</h3>
            <p className="text-gray-400">
              Use hand movements to throw virtual slaps. The more accurate your gesture, the more powerful the slap!
            </p>
          </div>

          <div className="bg-gray-800/30 p-6 rounded-xl border border-gray-700">
            <div className="text-purple-400 text-4xl mb-4">😎</div>
            <h3 className="text-xl font-semibold mb-2">Face Tracking</h3>
            <p className="text-gray-400">
              Dodge incoming slaps by moving your head. Quick reflexes are key to victory!
            </p>
          </div>

          <div className="bg-gray-800/30 p-6 rounded-xl border border-gray-700">
            <div className="text-green-400 text-4xl mb-4">🏆</div>
            <h3 className="text-xl font-semibold mb-2">Score Points</h3>
            <p className="text-gray-400">
              Land successful slaps to score points. First player to reach the target score wins!
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-24 text-center text-gray-400">
          <p>Built with Next.js, WebRTC, and MediaPipe for NWHacks 2024</p>
        </div>
      </div>
    </main>
  );
}
