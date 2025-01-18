import React, { useRef, useState, useEffect } from "react";
import io from "socket.io-client";
import SimplePeer from "simple-peer";
import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaVideo,
  FaVideoSlash,
  FaPhoneSlash,
} from "react-icons/fa";

const socket = io("http://localhost:5000"); // Backend server

function App() {
  const [stream, setStream] = useState(null);
  const [peers, setPeers] = useState([]);
  const [roomId, setRoomId] = useState("");
  const [joined, setJoined] = useState(false);
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const videoRef = useRef(null);

  // Create Room and Generate Random Room ID
  const createRoom = async () => {
    const generatedRoomId = Math.random().toString(36).substring(2, 10); // Generate random Room ID
    setRoomId(generatedRoomId);
    joinRoom(generatedRoomId);
  };

  // Join Room
  const joinRoom = async (id) => {
    if (!id && !roomId) {
      alert("Enter a Room ID to join!");
      return;
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      setStream(mediaStream);
      setJoined(true);

      // Attach the local stream to videoRef
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      socket.emit("join-room", id || roomId);

      // When a new user joins, create a peer
      socket.on("user-joined", (peerSignal) => {
        const peer = new SimplePeer({
          initiator: false,
          stream: mediaStream,
        });

        peer.signal(peerSignal);
        peer.on("stream", (peerStream) => {
          console.log("Received peer stream");
          setPeers((prev) => [...prev, { id: Math.random(), stream: peerStream }]);
        });
      });

      // Handle incoming signals
      socket.on("receive-signal", ({ signal }) => {
        const peer = new SimplePeer({ initiator: true, stream: mediaStream });

        peer.signal(signal);
        peer.on("stream", (peerStream) => {
          console.log("Received peer stream");
          setPeers((prev) => [...prev, { id: Math.random(), stream: peerStream }]);
        });

        socket.emit("return-signal", { signal: peer.signal() });
      });
    } catch (error) {
      console.error("Error accessing media devices:", error);
      alert("Could not access media devices. Please check your permissions.");
    }
  };

  // Toggle Mute
  const toggleMute = () => {
    setMuted((prevMuted) => {
      const audioTrack = stream.getAudioTracks()[1];
      if (audioTrack) audioTrack.enabled = !prevMuted;
      return !prevMuted;
    });
  };

  

  // Toggle Video
  const toggleVideo = () => {
    setVideoOff((prevVideoOff) => {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) videoTrack.enabled =!prevVideoOff;
      return !prevVideoOff;
    });
  };

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      console.log("Local video stream attached", stream);
    }
  }, [stream]);
  

  // Leave Room
  const leaveRoom = () => {
    socket.emit("leave-room", roomId);
    setStream(null);
    setPeers([]);
    setJoined(false);
    setRoomId("");
  };

  return (
    <div style={styles.container}>
      {!joined ? (
        <>
          <h1 style={styles.heading}>Virtual Meeting</h1>
          <input
            type="text"
            placeholder="Enter Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            style={styles.input}
          />
          <div style={styles.mainButtons}>
            <button style={styles.button} onClick={() => joinRoom()}>
              Join Room
            </button>
            <button style={styles.button} onClick={createRoom}>
              Create Room
            </button>
          </div>
        </>
      ) : (
        <div>
          <h1 style={styles.roomHeading}>Room: {roomId}</h1>
          <div style={styles.videoContainer}>
            <video
              ref={videoRef}
              autoPlay
              muted
              style={styles.video}
            ></video>
            {peers.map((peer, index) => (
              <PeerVideo key={peer.id} stream={peer.stream} />
            ))}
          </div>
          <div style={styles.controls}>
            <button style={styles.controlButton} onClick={toggleMute}>
              {muted ? (
                <FaMicrophoneSlash style={styles.icon} />
              ) : (
                <FaMicrophone style={styles.icon} />
              )}
            </button>
            <button style={styles.controlButton} onClick={toggleVideo}>
              {videoOff ? (
                <FaVideoSlash style={styles.icon} />
              ) : (
                <FaVideo style={styles.icon} />
              )}
            </button>
            <button style={styles.controlButton} onClick={leaveRoom}>
              <FaPhoneSlash style={{ ...styles.icon, color: "red" }} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Separate Component for Peer Videos
const PeerVideo = ({ stream }) => {
  const videoRef = useRef();

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return <video ref={videoRef} autoPlay style={styles.video}></video>;
};

const styles = {
  container: {
    textAlign: "center",
    marginTop: "50px",
    fontFamily: "'Roboto', Arial, sans-serif",
    backgroundColor: "#f5f5f5",
    padding: "20px",
    borderRadius: "12px",
    maxWidth: "800px",
    margin: "0 auto",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
  },
  heading: {
    fontSize: "36px",
    color: "#3b82f6",
    marginBottom: "20px",
    fontWeight: "bold",
    textShadow: "1px 1px 2px rgba(0, 0, 0, 0.1)",
  },
  input: {
    padding: "12px",
    fontSize: "16px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    marginBottom: "20px",
    width: "80%",
    boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.05)",
  },
  mainButtons: {
    display: "flex",
    justifyContent: "center",
    gap: "15px",
    marginTop: "20px",
  },
  button: {
    padding: "12px 24px",
    fontSize: "16px",
    fontWeight: "500",
    backgroundColor: "#3b82f6",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "background-color 0.3s ease",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
  },
  buttonHover: {
    backgroundColor: "#2563eb",
  },
  roomHeading: {
    fontSize: "28px",
    color: "#111827",
    marginBottom: "20px",
    fontWeight: "600",
  },
  videoContainer: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: "20px",
  },
  video: {
    width: "300px",
    height: "200px",
    borderRadius: "12px",
    backgroundColor: "#000",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
    transition: "transform 0.2s ease",
  },
  videoHover: {
    transform: "scale(1.05)",
  },
  controls: {
    display: "flex",
    justifyContent: "center",
    marginTop: "20px",
    gap: "20px",
  },
  controlButton: {
    padding: "12px",
    borderRadius: "50%",
    border: "none",
    backgroundColor: "#f3f4f6",
    cursor: "pointer",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    transition: "background-color 0.3s ease",
  },
  controlButtonHover: {
    backgroundColor: "#e5e7eb",
  },
  icon: {
    fontSize: "20px",
    color: "#111827",
  },
};


export default App;
