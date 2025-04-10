"use client";
import { Card } from "@/components/ui/card";
import AudioRecorder from "@/components/AudioRecorder";
import { useEffect } from "react";
import { Toaster } from "sonner";
import Logo from "@/components/Logo";

const Index = () => {
  useEffect(() => {
    // Set body to dark theme
    document.body.className = "bg-gradient-to-b from-blue-950 to-black";
  }, []);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4">
      <Toaster position="top-center" richColors />
      
      <div className="w-full max-w-lg mx-auto">
        <Logo />
        
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-white">Audio Recorder</h1>
          <p className="text-blue-300 mt-2">Record, play, and save audio from your device</p>
        </div>
        
        <Card className="p-6 backdrop-blur-lg bg-black/40 border border-blue-900/30 rounded-xl shadow-2xl">
          <AudioRecorder />
        </Card>
        
        <footer className="mt-8 text-center text-blue-400/60 text-sm">
          <p>© {new Date().getFullYear()} Affordable.AI</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;