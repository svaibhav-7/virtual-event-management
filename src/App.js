import React, { useState, useRef, useEffect, useCallback } from 'react';
import './App.css';
import io from 'socket.io-client';

// Add FontAwesome CDN
const fontAwesomeCDN = document.createElement("link");
fontAwesomeCDN.rel = "stylesheet";
fontAwesomeCDN.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css";
document.head.appendChild(fontAwesomeCDN);

const socket = io('http://localhost:5000'); // Replace with your server URL

function App() {
  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState('');
  const [isInRoom, setIsInRoom] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [messages, setMessages] = useState([]);
  const [emojiReactions, setEmojiReactions] = useState([]);
  const [mediaStream, setMediaStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [users, setUsers] = useState([]); // List of users in the room
  const [recorder, setRecorder] = useState(null); // For recording
  const [recordedChunks, setRecordedChunks] = useState([]); // For recording
  const [raisedHands, setRaisedHands] = useState([]); // For raise hand feature
  const [polls, setPolls] = useState([]); // For polling feature
  const [activePoll, setActivePoll] = useState(null); // For active poll
  const [meetLink, setMeetLink] = useState(''); // For meet link

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
      socket.emit('join-room', { roomId, username });
      setIsInRoom(true);
      addUser(username); // Add user to the list
      console.log(`Joined room ${roomId} as ${username}`);
      startVideoStream(); // Start video stream when joining
      sendMessage(`${username} has joined the room.`); // Welcome message
    }
  };

  // Handle room creation
  const handleCreateRoom = () => {
    const newRoomId = Math.random().toString(36).substr(2, 9); // Generate random room ID
    setRoomId(newRoomId);
    setIsCreatingRoom(false);
    setIsInRoom(true);
    addUser(username); // Add user to the list
    console.log(`Room ${newRoomId} created.`);
    startVideoStream(); // Start video stream when creating room
    sendMessage(`${username} has created the room.`); // Welcome message
    setMeetLink(`${window.location.origin}/join/${newRoomId}`); // Generate meet link
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
    socket.emit('send-emoji', { roomId, emoji });
  };

  // Handle message sending
  const sendMessage = useCallback((message, isPrivate = false, recipient = null) => {
    const newMessage = {
      sender: username,
      text: message,
      timestamp: new Date().toLocaleTimeString(),
      isPrivate,
      recipient,
    };
    setMessages((prevMessages) => [...prevMessages, newMessage]);
    socket.emit('send-message', { roomId, message: newMessage });
  }, [roomId, username]);

  // Handle room exit
  const handleExitRoom = () => {
    stopVideoStream(); // Stop video when exiting room
    stopScreenSharing(); // Stop screen sharing when exiting room
    setIsInRoom(false);
    removeUser(username); // Remove user from the list
    setRoomId('');
    setUsername('');
    setMessages([]);
    setEmojiReactions([]);
    socket.emit('leave-room', { roomId, username });
  };

  // Add user to the list
  const addUser = (username) => {
    setUsers((prevUsers) => [...prevUsers, username]);
  };

  // Remove user from the list
  const removeUser = (username) => {
    setUsers((prevUsers) => prevUsers.filter((user) => user !== username));
  };

  // Start recording
  const startRecording = async () => {
    const stream = videoRef.current.srcObject;
    const mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        setRecordedChunks((prev) => [...prev, event.data]);
      }
    };

    mediaRecorder.start();
    setRecorder(mediaRecorder);
  };

  // Stop recording
  const stopRecording = () => {
    if (recorder) {
      recorder.stop();
      setRecorder(null);
    }
  };

  // Download recording
  const downloadRecording = () => {
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'recording.webm';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Toggle raise/lower hand
  const toggleRaiseHand = () => {
    if (raisedHands.includes(username)) {
      setRaisedHands((prev) => prev.filter((user) => user !== username));
      sendMessage(`✋ ${username} has lowered their hand.`);
    } else {
      setRaisedHands((prev) => [...prev, username]);
      sendMessage(`✋ ${username} has raised their hand.`);
    }
  };


  // Create poll
  const createPoll = (question, options) => {
    const newPoll = {
      question,
      options: options.map((option) => ({ text: option, votes: 0 })),
    };
    setPolls((prev) => [...prev, newPoll]);
    setActivePoll(newPoll);
    socket.emit('create-poll', { roomId, poll: newPoll });
  };

  // Vote in poll
  const voteInPoll = (pollIndex, optionIndex) => {
    setPolls((prev) => {
      const updatedPolls = [...prev];
      updatedPolls[pollIndex].options[optionIndex].votes += 1;
      return updatedPolls;
    });
    socket.emit('vote-poll', { roomId, pollIndex, optionIndex });
  };

  // Socket event listeners
  useEffect(() => {
    socket.on('user-joined', (user) => {
      addUser(user.username);
      sendMessage(`${user.username} has joined the room.`);
    });

    socket.on('user-left', (user) => {
      removeUser(user.username);
      sendMessage(`${user.username} has left the room.`);
    });

    socket.on('receive-message', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    socket.on('receive-emoji', (emoji) => {
      setEmojiReactions((prevReactions) => [...prevReactions, emoji]);
    });

    socket.on('update-poll', (poll) => {
      setPolls((prevPolls) => {
        const updatedPolls = [...prevPolls];
        const pollIndex = updatedPolls.findIndex((p) => p.question === poll.question);
        if (pollIndex !== -1) {
          updatedPolls[pollIndex] = poll;
        }
        return updatedPolls;
      });
    });

    return () => {
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('receive-message');
      socket.off('receive-emoji');
      socket.off('update-poll');
    };
  }, [sendMessage]);

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
        <div className="roomContainer">
          {/* Left Side: Video and Controls */}
          <div className="videoSection">
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
                <i className={`fa ${isCameraOn ? "fa-video" : "fa-video-slash"}`}></i>
              </button>
              <button onClick={toggleMic} className="controlButton" title={isMicOn ? "Mute Mic" : "Unmute Mic"}>
                <i className={`fa ${isMicOn ? "fa-microphone" : "fa-microphone-slash"}`}></i>
              </button>
              <button
                onClick={screenStream ? stopScreenSharing : startScreenSharing}
                className="controlButton"
                title={screenStream ? "Stop Screen Sharing" : "Start Screen Sharing"}
              >
                <i className={`fa ${screenStream ? "fa-stop" : "fa-share-square"}`}></i>
              </button>
              <button onClick={handleExitRoom} className="controlButton" title="End Call">
                <i className="fa fa-phone-slash"></i>
              </button>
              <button
                onClick={recorder ? stopRecording : startRecording}
                className="controlButton"
              >
                {recorder ? "Stop Recording" : "Start Recording"}
              </button>
              {recordedChunks.length > 0 && (
                <button onClick={downloadRecording} className="controlButton">
                  Download Recording
                </button>
              )}
              {/* Raise/Lower Hand Button */}
              <button
                onClick={toggleRaiseHand}
                className="controlButton"
                title={raisedHands.includes(username) ? "Lower Hand" : "Raise Hand"}
              >
                <i
                  className={`fa ${
                    raisedHands.includes(username) ? "fa-hand-paper" : "fa-hand-paper-o"
                  }`}
                ></i>
              </button>
            </div>

            {/* User List */}
            <div className="userList">
              <h3>Users in Room:</h3>
              <ul>
                {users.map((user, index) => (
                  <li key={index}>
                    {user}
                    {raisedHands.includes(user) && <span className="raisedHand">✋</span>}
                  </li>
                ))}
              </ul>
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

            {/* Meet Link */}
            {meetLink && (
              <div className="meetLink">
                <h3>Meet Link:</h3>
                <a href={meetLink} target="_blank" rel="noopener noreferrer">
                  {meetLink}
                </a>
              </div>
            )}
          </div>


          {/* Right Side: Chat Section */}
          <div className="chatSection">
            <div className="chatWindow">
              {messages.map((message, index) => (
                <div key={index} className="message">
                  <span className="sender">{message.sender}:</span>{' '}
                  <span className="text">{message.text}</span>
                  <span className="timestamp">{message.timestamp}</span>
                  {message.isPrivate && <span className="private">(Private to {message.recipient})</span>}
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
            <input
              type="text"
              placeholder="Send a private message"
              className="input"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const recipient = prompt("Enter recipient's username:");
                  if (recipient) {
                    sendMessage(e.target.value, true, recipient);
                    e.target.value = '';
                  }
                }
              }}
            />

            {/* Polling Feature */}
            <div className="polls">
              <h3>Polls:</h3>
              {activePoll && (
                <div className="poll">
                  <h4>{activePoll.question}</h4>
                  <ul>
                    {activePoll.options.map((option, index) => (
                      <li key={index}>

                        {option.text} - {option.votes} votes
                        <button onClick={() => voteInPoll(polls.indexOf(activePoll), index)}>Vote</button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <button
                onClick={() => {
                  const question = prompt("Enter poll question:");
                  const options = prompt("Enter poll options (comma separated):").split(',');
                  createPoll(question, options);
                }}
                className="controlButton"
              >
                Create Poll
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
