import React, { useRef, useEffect, useState } from "react";
import { FaVideo, FaVideoSlash, FaMicrophone, FaMicrophoneSlash, FaShareSquare, FaStop, FaHandPaper, FaPhoneSlash } from "react-icons/fa";
import { IoHandLeftOutline } from "react-icons/io5";

const VideoCall = ({
  mediaStream,
  setMediaStream,
  screenStream,
  setScreenStream,
  isCameraOn,
  setIsCameraOn,
  isMicOn,
  setIsMicOn,
  recorder,
  setRecorder,
  recordedChunks,
  setRecordedChunks,
  sendEmojiReaction,
  emojiReactions,
  users,
  raisedHands,
  toggleRaiseHand,
  meetLink,
  username,
  handleEndCall,
}) => {
  const videoRef = useRef(null);
  const screenRef = useRef(null);
  const [activeSpeaker, setActiveSpeaker] = useState(null);


  // Attach media streams to video elements
  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = mediaStream;
    if (screenRef.current) screenRef.current.srcObject = screenStream;
  }, [mediaStream, screenStream]);

  // Active speaker detection using Web Audio API
  useEffect(() => {
    let audioContext, analyser, sourceNode, intervalId;
    const analyzeAudio = async () => {
      if (!isMicOn || !mediaStream || mediaStream.getAudioTracks().length === 0) return;
      try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        sourceNode = audioContext.createMediaStreamSource(mediaStream);
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        sourceNode.connect(analyser);
        intervalId = setInterval(() => {
          analyser.getByteFrequencyData(dataArray);
          const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
          // Adjust threshold (25) as needed
          setActiveSpeaker(avg > 25 ? username : null);
        }, 300);
      } catch (error) {
        console.error("Audio analysis error:", error);
      }
    };
    analyzeAudio();
    return () => {
      clearInterval(intervalId);
      if (audioContext) audioContext.close();
    };
  }, [isMicOn, mediaStream, username]);

  // Start an audio-only stream and merge it with any existing video tracks
  const startAudioStream = async () => {
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMediaStream((prevStream) => {
        const newStream = new MediaStream();
        // Retain existing video tracks if available
        if (prevStream) {
          prevStream.getVideoTracks().forEach((track) => newStream.addTrack(track));
        }
        newStream.addTrack(audioStream.getAudioTracks()[0]);
        return newStream;
      });
      setIsMicOn(true);
    } catch (error) {
      alert("Microphone access denied!");
    }
  };

  // Toggle camera (video) on/off
  const toggleCamera = async () => {
    if (isCameraOn) {
      mediaStream?.getVideoTracks().forEach((track) => track.stop());
      setIsCameraOn(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 },
          audio: isMicOn, // include audio only if already on
        });
        setMediaStream(stream);
        setIsCameraOn(true);
      } catch (error) {
        alert("Camera access denied!");
      }
    }
  };

  // Toggle microphone independently
  const toggleMic = async () => {
    if (mediaStream) {
      const audioTracks = mediaStream.getAudioTracks();
      if (audioTracks.length > 0) {
        // Toggle enabled state of existing audio track
        audioTracks[0].enabled = !audioTracks[0].enabled;
        setIsMicOn(audioTracks[0].enabled);
      } else {
        // If no audio track exists, start an audio-only stream
        await startAudioStream();
      }
    } else {
      await startAudioStream();
    }
  };

  // Recording functions
  const startRecording = () => {
    if (mediaStream) {
      const newRecorder = new MediaRecorder(mediaStream);
      newRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setRecordedChunks((prev) => [...prev, event.data]);
        }
      };
      newRecorder.start();
      setRecorder(newRecorder);
    }
  };

  const stopRecording = () => {
    if (recorder) {
      recorder.stop();
      setRecorder(null);
    }
  };

  const downloadRecording = () => {
    const blob = new Blob(recordedChunks, { type: "video/webm" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = "recording.webm";
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
  };

  // Screen sharing functions
  const startScreenSharing = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      setScreenStream(stream);
    } catch (error) {
      alert("Screen sharing access denied!");
    }
  };

  const stopScreenSharing = () => {
    screenStream?.getTracks().forEach((track) => track.stop());
    setScreenStream(null);
  };

  // Chat functions
  

  // Component for remote participant's video (placeholder)
  const ParticipantVideo = ({ user }) => (
    <div className="participant">
      <video className="video" autoPlay playsInline />
      <div className="participant-info">
        <span>{user}</span>
        {raisedHands.includes(user) && <IoHandLeftOutline className="raised-hand" />}
        {activeSpeaker === user && <div className="speaker-indicator">🎤</div>}
      </div>
    </div>
  );

  return (
    <div className="videoSection">
      <div className={`videoContainer`}>
        {/* Local User */}
        {isCameraOn && (
          <div className="video-wrapper">
            <video ref={videoRef} autoPlay muted className="video" playsInline />
            <div className="user-status">
              <span>{username}</span>
              {raisedHands.includes(username) && <IoHandLeftOutline className="raised-hand" />}
              {activeSpeaker === username && <div className="speaker-indicator">🎤</div>}
            </div>
          </div>
        )}

        {/* Screen Share */}
        {screenStream && (
          <div className="screen-share">
            <video ref={screenRef} autoPlay muted className="video" playsInline />
            <div className="screen-share-label">Screen Sharing: {username}</div>
          </div>
        )}

        {/* Remote Participants */}
        {users.map((user) => (
          <ParticipantVideo key={user} user={user} />
        ))}
      </div>

      {/* Controls */}
      <div className="controls">
        <button onClick={toggleCamera} className="controlButton" title={isCameraOn ? "Turn Camera Off" : "Turn Camera On"}>
          {isCameraOn ? <FaVideo /> : <FaVideoSlash />}
        </button>
        <button onClick={toggleMic} className="controlButton" title={isMicOn ? "Mute Mic" : "Unmute Mic"}>
          {isMicOn ? <FaMicrophone /> : <FaMicrophoneSlash />}
        </button>
        {recordedChunks.length > 0 && (
          <button onClick={downloadRecording} className="controlButton">
            Download
          </button>
        )}
        <button onClick={screenStream ? stopScreenSharing : startScreenSharing} className="controlButton" title={screenStream ? "Stop Screen Sharing" : "Start Screen Sharing"}>
          {screenStream ? <FaStop /> : <FaShareSquare />}
        </button>
        <div className="recording-indicator">
          {recorder && <div className="recording-pulse">● REC</div>}
          <button onClick={recorder ? stopRecording : startRecording} className="controlButton">
            {recorder ? "Stop Recording" : "Start Recording"}
          </button>
          {recordedChunks.length > 0 && (
            <button onClick={downloadRecording} className="controlButton">
              Download Recording
            </button>
          )}
        </div>
        <button onClick={toggleRaiseHand} className={`controlButton raise-hand ${raisedHands.includes(username) ? "active" : ""}`} title={raisedHands.includes(username) ? "Lower Hand" : "Raise Hand"}>
          <FaHandPaper />
        </button>
        <button onClick={handleEndCall} className="controlButton end-call" title="End Call">
          <FaPhoneSlash />
        </button>
      </div>

      {/* Chat Section */}
      

      {/* Additional Features */}
      <div className="additional-features">
        
        <div>
        <button onClick={() => sendEmojiReaction('😊')} className="emojiButton">
          😊
        </button>
        <button onClick={() => sendEmojiReaction('👍')} className="emojiButton">
          👍
        </button>
        <button onClick={() => sendEmojiReaction('🎉')} className="emojiButton">
          🎉
        </button>
        <button onClick={() => sendEmojiReaction('❤️')} className="emojiButton">
          ❤️
        </button>
        <button onClick={() => sendEmojiReaction('😂')} className="emojiButton">
          😂
        </button>

      </div>
      <div className="emojiReactions">
        <h3>Emoji Reactions:</h3>
        <div>
          {emojiReactions.map((emoji, index) => (
            <span key={index} className="emoji">
              {emoji}
            </span>
          ))}
        </div>
        <div className="meet-info">
          <h3>Meeting ID: </h3>
          <a href={meetLink} target="_blank" rel="noopener noreferrer">
            {meetLink}
          </a>
          <div className="participant-count">
            Participants: {users.length + 1}
          </div>
          <div className="network-status">
            Connection: {navigator.connection?.effectiveType || "Unknown"}
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};

export default VideoCall;
