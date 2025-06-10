'use client';

import { motion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  PlayIcon,
  PauseIcon,
  ForwardIcon,
  BackwardIcon,
} from '@heroicons/react/24/solid';
import { siteConfig } from './config';

interface DiscordStatus {
  username: string;
  status: string;
  activity: string;
  avatarURL: string;
  error?: string;
}

export default function Home() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const bgVideoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [discordStatus, setDiscordStatus] = useState<DiscordStatus>({
    username: 'lazysyn',
    status: 'online',
    activity: 'currently doing nothing',
    avatarURL: 'https://cdn.discordapp.com/embed/avatars/0.png'
  });
  const [videoError, setVideoError] = useState<string | null>(null);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [robloxStatus, setRobloxStatus] = useState<DiscordStatus>({
    username: 'Roblox User',
    status: 'offline',
    activity: 'Not playing',
    avatarURL: 'https://thumbnails.roblox.com/v1/users/avatar?userIds=388361463&size=256x256&format=Png&isCircular=true'
  });
  const [volume, setVolume] = useState(0.5); // Default volume

  // Initialize audio metadata and auto-play
  useEffect(() => {
    const audio = new Audio('/music.mp3');
    audio.volume = volume;
    audio.addEventListener('loadedmetadata', () => {
      console.log('Audio metadata loaded, duration:', audio.duration);
      setDuration(audio.duration);
    });
    
    // Also set up the main audio ref listener
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.addEventListener('loadedmetadata', () => {
        console.log('Audio ref metadata loaded, duration:', audioRef.current?.duration);
        setDuration(audioRef.current?.duration || 0);
      });
      
      // Force load the metadata and auto-play
      audioRef.current.load();
      audioRef.current.play().catch(error => {
        console.error('Error auto-playing audio:', error);
      });
    }
  }, [volume]);

  // Format time in MM:SS
  const formatTime = (time: number) => {
    if (!time) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Handle time update for music
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      // Update duration again if we have it but state doesn't
      if (audioRef.current.duration && !duration) {
        console.log('Updating duration from timeUpdate:', audioRef.current.duration);
        setDuration(audioRef.current.duration);
      }
    }
  };

  // Handle metadata loaded for music
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      console.log('handleLoadedMetadata called, duration:', audioRef.current.duration);
      setDuration(audioRef.current.duration);
    }
  };

  // Handle seek
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  useEffect(() => {
    const fetchDiscordStatus = async () => {
      try {
        const response = await fetch('/api/discord-status');
        const data = await response.json();
        setDiscordStatus(data);
      } catch (error) {
        console.error('Error fetching Discord status:', error);
      }
    };

    fetchDiscordStatus();
    // Poll every 5 seconds for status updates
    const interval = setInterval(fetchDiscordStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Roblox status
  useEffect(() => {
    const fetchRobloxStatus = async () => {
      try {
        const response = await fetch('/api/roblox-status');
        const data = await response.json();
        setRobloxStatus(data);
      } catch (error) {
        console.error('Error fetching Roblox status:', error);
      }
    };

    fetchRobloxStatus();
    // Poll every 5 seconds for status updates
    const interval = setInterval(fetchRobloxStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  // Initialize background video
  useEffect(() => {
    if (bgVideoRef.current) {
      bgVideoRef.current.play().catch(error => {
        // Ignore power-saving related pauses
        if (!error.message.includes('paused to save power')) {
          console.error('Error playing background video:', error);
          setVideoError(error.message);
        }
      });
    }
  }, []);

  // Handle audio play/pause
  useEffect(() => {
    if (audioRef.current && videoRef.current) {
      if (isPlaying) {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error('Error playing audio:', error);
          });
        }
        videoRef.current.play();
      } else {
        audioRef.current.pause();
        videoRef.current.pause();
      }
    }
  }, [isPlaying]);

  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const handleStart = () => {
    setHasStarted(true);
    setIsPlaying(true);
  };

  return (
    <>
      {/* Background Video */}
      <div className="background-video-container">
        {videoError && !videoError.includes('paused to save power') && (
          <div className="video-error">
            Error loading video: {videoError}
          </div>
        )}
        <video
          ref={bgVideoRef}
          className="background-video"
          loop
          muted
          playsInline
          autoPlay
          preload="auto"
          poster="/video-poster.jpg"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
          onError={(e) => {
            const error = e.currentTarget.error?.message || 'Failed to load video';
            if (!error.includes('paused to save power')) {
              console.error('Video error:', error);
              setVideoError(error);
            }
          }}
          onLoadStart={() => setIsVideoLoading(true)}
          onLoadedData={() => {
            setIsVideoLoading(false);
            bgVideoRef.current?.play().catch(error => {
              if (!error.message.includes('paused to save power')) {
                console.error('Error playing background video:', error);
                setVideoError(error.message);
              }
            });
          }}
        >
          <source src="/background.webm" type="video/webm" />
          <source src="/background.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        {isVideoLoading && videoError && !videoError.includes('paused to save power') && (
          <div className="video-loading">
            Loading video...
          </div>
        )}
      </div>

      <div className="content-wrapper">
        <main className="min-h-screen w-full flex flex-col items-center justify-center p-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="profile-container text-center"
          >
            {/* Profile Image */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-32 h-32 mx-auto mb-6 relative"
            >
              <div className="rounded-full overflow-hidden border-2 border-[rgba(255,255,255,0.1)] relative">
                <Image
                  src="/profile.jpg"
                  alt="Profile"
                  width={128}
                  height={128}
                  className="rounded-full"
                  priority
                />
              </div>
            </motion.div>

            {/* Name */}
            <motion.h1 
              className="text-4xl font-bold mb-2 neon-text"
              whileHover={{ scale: 1.05 }}
            >
              {siteConfig.name}
            </motion.h1>

            {/* Discord Status Card */}
            <motion.div
              className="status-card"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-3">
                <Image
                  src={discordStatus.avatarURL}
                  alt="Discord Avatar"
                  width={40}
                  height={40}
                  className="rounded-full"
                  unoptimized
                />
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      discordStatus.status === 'online' ? 'bg-green-500' :
                      discordStatus.status === 'idle' ? 'bg-yellow-500' :
                      discordStatus.status === 'dnd' ? 'bg-red-500' :
                      'bg-gray-500'
                    }`}></span>
                    <span className="text-white font-medium">{discordStatus.username}</span>
                  </div>
                  {discordStatus.activity && (
                    <div className="text-gray-400 text-sm mt-0.5">
                      กำลังเล่น {discordStatus.activity}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Roblox Status Card */}
            <motion.div
              className="status-card"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-3">
                <Image
                  src={robloxStatus.avatarURL}
                  alt="Roblox Avatar"
                  width={40}
                  height={40}
                  className="rounded-full"
                  unoptimized
                />
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      robloxStatus.status === 'Website' ? 'bg-blue-500' :
                      robloxStatus.status === 'Playing' ? 'bg-green-500' :
                      robloxStatus.status === 'online' ? 'bg-green-500' :
                      robloxStatus.status === 'idle' ? 'bg-yellow-500' :
                      robloxStatus.status === 'dnd' ? 'bg-red-500' :
                      'bg-gray-500'
                    }`}></span>
                    <span className="text-white font-medium">{robloxStatus.username}</span>
                  </div>
                  {robloxStatus.activity && (
                    <div className="text-gray-400 text-sm mt-0.5">
                      {robloxStatus.activity}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Social Links */}
            <motion.div
              className="flex gap-6 justify-center mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {siteConfig.socialLinks.map((link) => (
                <motion.a
                  key={link.name}
                  href={link.href}
                  className="social-icon"
                  whileHover={{ y: -2 }}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Image
                    src={link.icon}
                    alt={link.name}
                    width={28}
                    height={28}
                  />
                </motion.a>
              ))}
            </motion.div>
          </motion.div>

          {/* Music Player */}
          <motion.div
            className="music-player"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="flex flex-col w-full gap-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg overflow-hidden relative">
                  <video
                    ref={videoRef}
                    src="/album-cover.mp4"
                    className="w-full h-full object-cover"
                    loop
                    muted
                    playsInline
                  />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{siteConfig.music.title}</div>
                  <div className="text-xs text-gray-400">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button 
                    className="text-white hover:text-[rgb(var(--neon-cyan))] transition-colors"
                    onClick={() => {
                      if (audioRef.current) {
                        audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
                      }
                    }}
                  >
                    <BackwardIcon className="w-5 h-5" />
                  </button>
                  <button 
                    className="text-white hover:text-[rgb(var(--neon-cyan))] transition-colors"
                    onClick={() => setIsPlaying(!isPlaying)}
                  >
                    {isPlaying ? (
                      <PauseIcon className="w-5 h-5" />
                    ) : (
                      <PlayIcon className="w-5 h-5" />
                    )}
                  </button>
                  <button 
                    className="text-white hover:text-[rgb(var(--neon-cyan))] transition-colors"
                    onClick={() => {
                      if (audioRef.current) {
                        audioRef.current.currentTime = Math.min(
                          audioRef.current.duration,
                          audioRef.current.currentTime + 10
                        );
                      }
                    }}
                  >
                    <ForwardIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="px-2">
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-[rgb(var(--neon-cyan))]"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-24"
                />
                <span className="text-xs text-gray-400">{Math.round(volume * 100)}%</span>
              </div>
            </div>
          </motion.div>
        </main>
      </div>

      {/* Hidden Audio Player */}
      <audio
        ref={audioRef}
        src="/music.mp3"
        preload="metadata"
        loop
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onDurationChange={(e) => {
          console.log('Duration changed:', e.currentTarget.duration);
          setDuration(e.currentTarget.duration);
        }}
      />
    </>
  );
} 