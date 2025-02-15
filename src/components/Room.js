import React, { useState, useEffect, useCallback } from 'react';
import VideoCall from './Videocall';

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
  const meetLink = `http://localhost:3000?roomId=${roomId}`; // Removed setMeetLink

  const sendMessage = useCallback((message, isPrivate = false, recipient = null) => {
    const newMessage = { sender: username, text: message, timestamp: new Date().toLocaleTimeString(), isPrivate, recipient };
    setMessages((prevMessages) => [...prevMessages, newMessage]);
    socket.emit('send-message', { roomId, message: newMessage });
  }, [roomId, username, socket]);

  const voteInPoll = (pollIndex, optionIndex) => {
    const updatedPolls = [...polls];
    const poll = updatedPolls[pollIndex];
    if (!poll.votes) poll.votes = {};
    if (!poll.votes[username]) poll.votes[username] = optionIndex;
    setPolls(updatedPolls);
    socket.emit('vote-poll', { roomId, pollIndex, optionIndex });
  };

  const createPoll = (question, options) => {
    const newPoll = {
      question,
      options: options.map((option) => ({ text: option.trim(), votes: 0 })),
    };
    setPolls((prevPolls) => [...prevPolls, newPoll]);
    setActivePoll(newPoll);
    socket.emit('create-poll', { roomId, poll: newPoll });
  };

  const sendEmojiReaction = (emoji) => {
    setEmojiReactions((prevReactions) => [...prevReactions, emoji]);
    socket.emit('send-emoji', { roomId, emoji });
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
      mediaStream.getTracks().forEach(track => track.stop());
    }
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
    }
    setIsInRoom(false);
  };

  useEffect(() => {
    socket.on('user-joined', (user) => {
      setUsers((prevUsers) => [...prevUsers, user.username]);
      sendMessage(`${user.username} has joined the room.`);
    });

    socket.on('user-left', (user) => {
      setUsers((prevUsers) => prevUsers.filter((u) => u !== user.username));
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
        if (pollIndex !== -1) updatedPolls[pollIndex] = poll;
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
  }, [socket, sendMessage]);

  return (
    <div className="roomContainer">
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
        setIsInRoom={setIsInRoom}
        handleEndCall={handleEndCall}
      />
      <div className="chatSection">
        <div className="chatWindow">
          {messages.map((message, index) => (
            <div key={index} className="message">
              <span className="sender">{message.sender}:</span> <span className="text">{message.text}</span>
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
  );
};

export default Room;
