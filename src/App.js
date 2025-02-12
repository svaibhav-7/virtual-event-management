import React, { useState, useRef, useEffect } from 'react';
import './App.css';

// Add FontAwesome CDN
const fontAwesomeCDN = document.createElement("link");
fontAwesomeCDN.rel = "stylesheet";
fontAwesomeCDN.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css";
document.head.appendChild(fontAwesomeCDN);

function App() {
  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState('');
  const [isInRoom, setIsInRoom] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [messages, setMessages] = useState([]);
  const [emojiReactions, setEmojiReactions] = useState([]);
  const [mediaStream, setMediaStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null); // State for screen-sharing stream
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const videoRef = useRef(null); // Ref for camera video
  const screenRef = useRef(null); // Ref for screen-sharing video

  // Use useEffect to handle video stream assignment
  useEffect(() => {
    if (videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream;
    }
  }, [mediaStream]);

  // Use useEffect to handle screen-sharing stream assignment
  useEffect(() => {
    if (screenRef.current && screenStream) {
      screenRef.current.srcObject = screenStream;
    }
  }, [screenStream]);

  // Handle room join
  const handleJoinRoom = () => {
    if (roomId && username) {
      setIsInRoom(true);
      console.log(`Joined room ${roomId} as ${username}`);
      startVideoStream(); // Start video stream when joining
    }
  };

  // Handle room creation
  const handleCreateRoom = () => {
    const newRoomId = Math.random().toString(36).substr(2, 9); // Generate random room ID
    setRoomId(newRoomId);
    setIsCreatingRoom(false);
    setIsInRoom(true);
    console.log(`Room ${newRoomId} created.`);
    startVideoStream(); // Start video stream when creating room
  };

  // Start video stream (getUserMedia)
  const startVideoStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user", // Use front camera
          width: { ideal: 1280 }, // Specify the width
          height: { ideal: 720 }, // Specify the height
        },
        audio: true,
      });

      setMediaStream(stream);
      setIsCameraOn(true);
      setIsMicOn(true);

      console.log("Video stream started.");
    } catch (error) {
      console.error("Error accessing media devices:", error);
      alert("Unable to access the camera or microphone. Please check permissions.");
    }
  };

  // Stop video stream
  const stopVideoStream = () => {
    if (mediaStream) {
      const tracks = mediaStream.getTracks();
      tracks.forEach((track) => track.stop());
      setMediaStream(null);
      setIsCameraOn(false);
      setIsMicOn(false);
    }
  };

  // Start screen sharing
  const startScreenSharing = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      setScreenStream(stream);
      console.log("Screen sharing started.");

      // Handle when the user stops screen sharing
      stream.getVideoTracks()[0].onended = () => {
        setScreenStream(null);
        console.log("Screen sharing stopped.");
      };
    } catch (error) {
      console.error("Error accessing screen sharing:", error);
      alert("Unable to start screen sharing. Please check permissions.");
    }
  };

  // Stop screen sharing
  const stopScreenSharing = () => {
    if (screenStream) {
      const tracks = screenStream.getTracks();
      tracks.forEach((track) => track.stop());
      setScreenStream(null);
    }
  };

  // Handle camera toggle
  const toggleCamera = () => {
    if (isCameraOn) {
      stopVideoStream(); // Stop video stream if camera is on
    } else {
      startVideoStream(); // Start video stream if camera is off
    }
  };

  // Handle microphone toggle
  const toggleMic = () => {
    if (mediaStream) {
      const audioTrack = mediaStream.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled; // Mute/unmute the microphone
      setIsMicOn(audioTrack.enabled);
    }
  };

  // Handle send emoji reaction
  const sendEmojiReaction = (emoji) => {
    setEmojiReactions((prevReactions) => [...prevReactions, emoji]);
  };

  // Handle message sending
  const sendMessage = (message) => {
    setMessages([...messages, { sender: username, text: message }]);
  };

  // Handle room exit
  const handleExitRoom = () => {
    stopVideoStream(); // Stop video when exiting room
    stopScreenSharing(); // Stop screen sharing when exiting room
    setIsInRoom(false);
    setRoomId('');
    setUsername('');
    setMessages([]);
    setEmojiReactions([]);
  };

  return (
    <div className="container">
      <h1 className="heading">Virtual Event Room</h1>

      {/* Room Input Section */}
      {!isInRoom ? (
        <div>
          {!isCreatingRoom ? (
            <div>
              <input
                type="text"
                placeholder="Enter Room ID"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="input"
              />
              <input
                type="text"
                placeholder="Enter Your Name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input"
              />
              <div className="mainButtons">
                <button onClick={handleJoinRoom} className="button">
                  Join Room
                </button>
                <button onClick={() => setIsCreatingRoom(true)} className="button">
                  Create Room
                </button>
              </div>
            </div>
          ) : (
            <div>
              <h3>Creating Room...</h3>
              <button onClick={handleCreateRoom} className="button">
                Create Room with ID: {roomId}
              </button>
              <button onClick={() => setIsCreatingRoom(false)} className="button">
                Cancel
              </button>
            </div>
          )}
        </div>
      ) : (
        <div>
          <h2>Welcome to the room, {username}</h2>

          {/* Video Stream */}
          <div className="videoContainer">
            {isCameraOn && (
              <video
                ref={videoRef}
                autoPlay
                muted={!isMicOn} // Mute video when mic is off
                className="video"
              />
            )}
            {screenStream && (
              <video
                ref={screenRef}
                autoPlay
                muted
                className="video"
              />
            )}
          </div>

          {/* Controls */}
          <div className="controls">
            <button onClick={toggleCamera} className="controlButton" title={isCameraOn ? "Turn Camera Off" : "Turn Camera On"}>
              <i className={`fa ${isCameraOn ? "fa-video" : "fa-video-slash"}`}></i> {/* Camera icon */}
            </button>
            <button onClick={toggleMic} className="controlButton" title={isMicOn ? "Mute Mic" : "Unmute Mic"}>
              <i className={`fa ${isMicOn ? "fa-microphone" : "fa-microphone-slash"}`}></i> {/* Microphone icon */}
            </button>
            <button
              onClick={screenStream ? stopScreenSharing : startScreenSharing}
              className="controlButton"
              title={screenStream ? "Stop Screen Sharing" : "Start Screen Sharing"}
            >
              <i className={`fa ${screenStream ? "fa-stop" : "fa-share-square"}`}></i> {/* Screen sharing icon */}
            </button>
            <button onClick={handleExitRoom} className="controlButton" title="End Call">
              <i className="fa fa-phone-slash"></i> {/* End call icon */}
            </button>
          </div>

          {/* Emoji Reactions */}
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
          </div>

          {/* Display Emoji Reactions */}
          <div className="emojiReactions">
            <h3>Emoji Reactions:</h3>
            <div>
              {emojiReactions.map((emoji, index) => (
                <span key={index} className="emoji">
                  {emoji}
                </span>
              ))}
            </div>
          </div>

          {/* Chat Section */}
          <div className="chatWindow">
            {messages.map((message, index) => (
              <div key={index} className="message">
                <span className="sender">{message.sender}:</span>{' '}
                <span className="text">{message.text}</span>
              </div>
            ))}
          </div>

          <input
            type="text"
            placeholder="Send a message"
            className="input"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                sendMessage(e.target.value);
                e.target.value = '';
              }
            }}
          />
        </div>
      )}
    </div>
  );
}

export default App;
