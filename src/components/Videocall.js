import React, { useRef, useEffect } from 'react';

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
  handleEndCall, // Removed setIsInRoom as it's not used
}) => {
  const videoRef = useRef(null);
  const screenRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream;
    }
  }, [mediaStream]);

  useEffect(() => {
    if (screenRef.current && screenStream) {
      screenRef.current.srcObject = screenStream;
    }
  }, [screenStream]);

  const startVideoStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      setMediaStream(stream);
      setIsCameraOn(true);
      setIsMicOn(true);
    } catch (error) {
      console.error("Error accessing media devices:", error);
      alert("Unable to access the camera or microphone. Please check permissions.");
    }
  };

  const stopVideoStream = () => {
    if (mediaStream) {
      const videoTracks = mediaStream.getVideoTracks();
      videoTracks.forEach((track) => track.stop());
      setIsCameraOn(false);
    }
  };

  const startAudioStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMediaStream(stream);
      setIsMicOn(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Unable to access the microphone. Please check permissions.");
    }
  };

  const startScreenSharing = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      setScreenStream(stream);
      stream.getVideoTracks()[0].onended = () => setScreenStream(null);
    } catch (error) {
      console.error("Error accessing screen sharing:", error);
      alert("Unable to start screen sharing. Please check permissions.");
    }
  };

  const stopScreenSharing = () => {
    if (screenStream) {
      const tracks = screenStream.getTracks();
      tracks.forEach((track) => track.stop());
      setScreenStream(null);
    }
  };

  const toggleCamera = () => {
    if (isCameraOn) stopVideoStream();
    else startVideoStream();
  };

  const toggleMic = () => {
    if (mediaStream) {
      const audioTrack = mediaStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
      } else {
        startAudioStream();
      }
    } else {
      startAudioStream();
    }
  };

  const startRecording = async () => {
    const stream = videoRef.current.srcObject;
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) setRecordedChunks((prev) => [...prev, event.data]);
    };
    mediaRecorder.start();
    setRecorder(mediaRecorder);
  };

  const stopRecording = () => {
    if (recorder) {
      recorder.stop();
      setRecorder(null);
    }
  };

  const downloadRecording = () => {
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'recording.webm';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="videoSection">
      <div className="videoContainer">
        {isCameraOn && <video ref={videoRef} autoPlay muted={!isMicOn} className="video" />}
        {screenStream && <video ref={screenRef} autoPlay muted className="video" />}
      </div>
      <div className="controls">
        <button onClick={toggleCamera} className="controlButton" title={isCameraOn ? "Turn Camera Off" : "Turn Camera On"}>
          <i className={`fa ${isCameraOn ? "fa-video" : "fa-video-slash"}`}></i>
        </button>
        <button onClick={toggleMic} className="controlButton" title={isMicOn ? "Mute Mic" : "Unmute Mic"}>
          <i className={`fa ${isMicOn ? "fa-microphone" : "fa-microphone-slash"}`}></i>
        </button>
        <button onClick={screenStream ? stopScreenSharing : startScreenSharing} className="controlButton" title={screenStream ? "Stop Screen Sharing" : "Start Screen Sharing"}>
          <i className={`fa ${screenStream ? "fa-stop" : "fa-share-square"}`}></i>
        </button>
        <button onClick={recorder ? stopRecording : startRecording} className="controlButton">
          {recorder ? "Stop Recording" : "Start Recording"}
        </button>
        {recordedChunks.length > 0 && (
          <button onClick={downloadRecording} className="controlButton">
            Download Recording
          </button>
        )}
        <button onClick={toggleRaiseHand} className="controlButton" title={raisedHands.includes(username) ? "Lower Hand" : "Raise Hand"}>
          <i className={`fa ${raisedHands.includes(username) ? "fa-hand-paper" : "fa-hand-paper-o"}`}></i>
        </button>
        <button onClick={handleEndCall} className="controlButton" title="End Call">
          <i className="fa fa-phone-slash"></i>
        </button>
      </div>
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
      {meetLink && (
        <div className="meetLink">
          <h3>Meet Link:</h3>
          <a href={meetLink} target="_blank" rel="noopener noreferrer">
            {meetLink}
          </a>
        </div>
      )}
    </div>
  );
};

export default VideoCall;
