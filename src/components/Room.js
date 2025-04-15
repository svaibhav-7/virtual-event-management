import React, { useState, useEffect, useCallback } from "react";
import VideoCall from "./Videocall";

const Room = ({ roomId, username, setIsInRoom, socket }) => {
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
  const [newMessage, setNewMessage] = useState("");
  const [privateMessage, setPrivateMessage] = useState("");
  
  const meetLink = `${window.location.origin}?roomId=${roomId}`;

  // Initialize room connection
  

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

  useEffect(() => {
    setWelcomeMessage(`Welcome, ${username}!`);
  }, [username]);

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

  const sendEmojiReaction = (emoji) => {
    setEmojiReactions((prev) => [...prev, emoji]);
    socket.emit("send-emoji", { roomId, emoji });
  };

  const toggleRaiseHand = () => {
    if (raisedHands.includes(username)) {
      setRaisedHands((prev) => prev.filter((user) => user !== username));
      sendMessage(`✋ ${username} has lowered their hand.`);
    } else {
      setRaisedHands((prev) => [...prev, username]);
      sendMessage(`✋ ${username} has raised their hand.`);
    }
  };

  const handleEndCall = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
    }
    if (screenStream) {
      screenStream.getTracks().forEach((track) => track.stop());
    }
    setIsInRoom(false);
  };

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

  // Socket event listeners
  useEffect(() => {
    const handleUserJoined = (user) => {
      if (user.userId !== socket.id) { // Don't add yourself again
        setUsers((prev) => [...prev, user.username]);
        setWelcomeMessage(`${user.username} has joined the room!`);
      }
    };

    const handleUserLeft = (user) => {
      setUsers((prev) => prev.filter((u) => u !== user.username));
      setWelcomeMessage(`${user.username} has left the room.`);
    };

    const handleExistingParticipants = (participants) => {
      setUsers(participants.map(p => p.username));
    };

    socket.on("user-joined", handleUserJoined);
    socket.on("user-left", handleUserLeft);
    socket.on("existing-participants", handleExistingParticipants);
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
      socket.off("user-joined", handleUserJoined);
      socket.off("user-left", handleUserLeft);
      socket.off("existing-participants", handleExistingParticipants);
      socket.off("receive-message");
      socket.off("receive-emoji");
      socket.off("update-poll");
    };
  }, [socket]);

  return (
    <div className="roomContainer">
      {welcomeMessage && (
        <div className="welcomeMessage">
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
        

        <div className="sendMessageContainer">
          <input
            type="text"
            placeholder="Send a message"
            className="messageInput"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newMessage.trim()) {
                sendMessage(newMessage);
                setNewMessage("");
              }
            }}
          />
          <button
            className="sendButton"
            onClick={() => {
              if (newMessage.trim()) {
                sendMessage(newMessage);
                setNewMessage("");
              }
            }}
          >
            Send
          </button>
        </div>

        
        <div className="sendMessageContainer">
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
          <button
            className="sendButton"
            onClick={() => {
              if (privateMessage.trim()){
                sendMessage(privateMessage, true);
                setPrivateMessage("");
              }
            }}
          >
            Send Private
          </button>
        </div>
      </div>

      {/* Polls Section */}
      <div className="polls">
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
          Poll
        </button>
      </div>
    </div>
  );
};

export default Room;
