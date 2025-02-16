import React, { useState, useEffect, useCallback } from "react";
import VideoCall from "./Videocall";

const Room = ({ roomId, username, setIsInRoom, socket }) => {
  // State variables for room features
  const [messages, setMessages] = useState([]);
  const [mediaStream, setMediaStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [recorder, setRecorder] = useState(null);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [polls, setPolls] = useState([]);
  const [activePoll, setActivePoll] = useState(null);
  const [emojiReactions, setEmojiReactions] = useState([]);
  const [users, setUsers] = useState([]);
  const [raisedHands, setRaisedHands] = useState([]);
  const [welcomeMessage, setWelcomeMessage] = useState("");
  
  // Meeting link (for sharing)
  const meetLink = `http://localhost:3000?roomId=${roomId}`;

  // Send a message and emit it via socket
  const sendMessage = useCallback(
    (message, isPrivate = false, recipient = null) => {
      const newMessage = {
        sender: username,
        text: message,
        timestamp: new Date().toLocaleTimeString(),
        isPrivate,
        recipient,
      };
      setMessages((prev) => [...prev, newMessage]);
      socket.emit("send-message", { roomId, message: newMessage });
    },
    [roomId, username, socket]
  );

  // Set welcome message for the local user
  useEffect(() => {
    setWelcomeMessage(`Welcome, ${username}!`);
  }, [username]);

  // Poll functions
  const voteInPoll = (pollIndex, optionIndex) => {
    const updatedPolls = [...polls];
    const poll = updatedPolls[pollIndex];
    if (!poll.votes) poll.votes = {};
    if (!poll.votes[username]) poll.votes[username] = optionIndex;
    setPolls(updatedPolls);
    socket.emit("vote-poll", { roomId, pollIndex, optionIndex });
  };

  const createPoll = (question, options) => {
    const newPoll = {
      question,
      options: options.map((option) => ({ text: option.trim(), votes: 0 })),
    };
    setPolls((prev) => [...prev, newPoll]);
    setActivePoll(newPoll);
    socket.emit("create-poll", { roomId, poll: newPoll });
  };

  // Emoji reaction: update state and notify others
  const sendEmojiReaction = (emoji) => {
    setEmojiReactions((prev) => [...prev, emoji]);
    socket.emit("send-emoji", { roomId, emoji });
  };

  // Toggle raised hand and send a chat message about it
  const toggleRaiseHand = () => {
    if (raisedHands.includes(username)) {
      setRaisedHands((prev) => prev.filter((user) => user !== username));
      sendMessage(`✋ ${username} has lowered their hand.`);
    } else {
      setRaisedHands((prev) => [...prev, username]);
      sendMessage(`✋ ${username} has raised their hand.`);
    }
  };

  // End call: stop all media tracks and exit room
  const handleEndCall = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
    }
    if (screenStream) {
      screenStream.getTracks().forEach((track) => track.stop());
    }
    setIsInRoom(false);
  };

  // Toggle microphone independently
  const toggleMic = async () => {
    if (!mediaStream) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setMediaStream(stream);
        setIsMicOn(true);
      } catch (error) {
        alert("Microphone access denied!");
      }
    } else {
      const audioTracks = mediaStream.getAudioTracks();
      if (audioTracks.length > 0) {
        audioTracks.forEach((track) => {
          track.enabled = !track.enabled;
        });
        setIsMicOn(!isMicOn);
      } else {
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          setMediaStream((prevStream) => {
            const newStream = new MediaStream();
            // Preserve existing video tracks
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
      }
    }
  };

  // Toggle camera: if no stream, request full media; otherwise, toggle video tracks
  const toggleCamera = async () => {
    if (!mediaStream) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setMediaStream(stream);
        setIsCameraOn(true);
        setIsMicOn(true);
      } catch (error) {
        alert("Camera access denied!");
      }
    } else {
      mediaStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsCameraOn(!isCameraOn);
    }
  };

  // Socket event listeners for real-time updates
  useEffect(() => {
    socket.on("user-joined", (user) => {
      setUsers((prev) => [...prev, user.username]);
      setWelcomeMessage(`Welcome, ${user.username}!`);
    });

    socket.on("user-left", (user) => {
      setUsers((prev) => prev.filter((u) => u !== user.username));
    });

    socket.on("receive-message", (message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on("receive-emoji", (emoji) => {
      setEmojiReactions((prev) => [...prev, emoji]);
    });

    socket.on("update-poll", (poll) => {
      setPolls((prevPolls) => {
        const updatedPolls = [...prevPolls];
        const pollIndex = updatedPolls.findIndex((p) => p.question === poll.question);
        if (pollIndex !== -1) updatedPolls[pollIndex] = poll;
        return updatedPolls;
      });
    });

    return () => {
      socket.off("user-joined");
      socket.off("user-left");
      socket.off("receive-message");
      socket.off("receive-emoji");
      socket.off("update-poll");
    };
  }, [socket]);

  return (
    <div className="roomContainer">
      {welcomeMessage && (
        <div
          className="welcomeMessage"
          style={{
            fontFamily: "Arial, sans-serif",
            fontSize: "20px",
            fontWeight: "bold",
            marginBottom: "10px",
          }}
        >
          {welcomeMessage}
        </div>
      )}

      {/* Video Call Component */}
      <VideoCall
        mediaStream={mediaStream}
        setMediaStream={setMediaStream}
        screenStream={screenStream}
        setScreenStream={setScreenStream}
        isCameraOn={isCameraOn}
        setIsCameraOn={setIsCameraOn}
        isMicOn={isMicOn}
        setIsMicOn={setIsMicOn}
        recorder={recorder}
        setRecorder={setRecorder}
        recordedChunks={recordedChunks}
        setRecordedChunks={setRecordedChunks}
        sendEmojiReaction={sendEmojiReaction}
        emojiReactions={emojiReactions}
        users={users}
        raisedHands={raisedHands}
        toggleRaiseHand={toggleRaiseHand}
        meetLink={meetLink}
        username={username}
        handleEndCall={handleEndCall}
        toggleMic={toggleMic}
        toggleCamera={toggleCamera}
      />

      {/* Chat Section */}
      <div className="chatSection">
        <div className="chatWindow">
          {messages.map((message, index) => (
            <div key={index} className="message">
              <span className="sender">{message.sender}:</span>{" "}
              <span className="text">{message.text}</span>{" "}
              <span className="timestamp">{message.timestamp}</span>
              {message.isPrivate && (
                <span className="private">(Private to {message.recipient})</span>
              )}
            </div>
          ))}
        </div>
        <input
          type="text"
          placeholder="Send a message"
          className="input"
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.target.value.trim()) {
              sendMessage(e.target.value);
              e.target.value = "";
            }
          }}
        />
        <input
          type="text"
          placeholder="Send a private message"
          className="input"
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.target.value.trim()) {
              const recipient = prompt("Enter recipient's username:");
              if (recipient) {
                sendMessage(e.target.value, true, recipient);
                e.target.value = "";
              }
            }
          }}
        />
      </div>

      {/* Polls Section */}
      <div className="polls">
        <h3>Polls:</h3>
        {activePoll && (
          <div className="poll">
            <h4>{activePoll.question}</h4>
            <ul>
              {activePoll.options.map((option, index) => (
                <li key={index}>
                  {option.text} - {option.votes} votes{" "}
                  <button onClick={() => voteInPoll(polls.indexOf(activePoll), index)}>
                    Vote
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        <button
          onClick={() => {
            const question = prompt("Enter poll question:");
            if (question) {
              const optionsInput = prompt("Enter poll options (comma separated):");
              if (optionsInput) {
                const options = optionsInput.split(",");
                createPoll(question, options);
              }
            }
          }}
          className="controlButton"
        >
          Create Poll
        </button>
      </div>
    </div>
  );
};

export default Room;

