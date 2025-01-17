// src/components/Room.js
import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import SimplePeer from 'simple-peer';
import { useParams } from 'react-router-dom';
import VideoCall from './Videocall';

const socket = io('http://localhost:5000');

function Room() {
  const { roomId } = useParams();
  const [peers, setPeers] = useState([]);
  const userVideo = useRef();
  const peersRef = useRef([]);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      userVideo.current.srcObject = stream;
      socket.emit('join-room', roomId);

      socket.on('user-connected', (userId) => {
        const peer = createPeer(userId, socket.id, stream);
        peersRef.current.push({ peerID: userId, peer });
        setPeers((prevPeers) => [...prevPeers, peer]);
      });

      socket.on('receive-call', ({ signal, from }) => {
        const peer = addPeer(signal, from, stream);
        peersRef.current.push({ peerID: from, peer });
        setPeers((prevPeers) => [...prevPeers, peer]);
      });

      socket.on('call-accepted', ({ signal, id }) => {
        const peerObj = peersRef.current.find((p) => p.peerID === id);
        if (peerObj) {
          peerObj.peer.signal(signal);
        }
      });
    });
  }, [roomId]);

  const createPeer = (userToSignal, callerID, stream) => {
    const peer = new SimplePeer({
      initiator: true,
      trickle: false,
      stream,
    });

    peer.on('signal', (signal) => {
      socket.emit('send-call', { userToSignal, callerID, signal });
    });

    return peer;
  };

  const addPeer = (incomingSignal, callerID, stream) => {
    const peer = new SimplePeer({
      initiator: false,
      trickle: false,
      stream,
    });

    peer.on('signal', (signal) => {
      socket.emit('accept-call', { signal, to: callerID });
    });

    peer.signal(incomingSignal);

    return peer;
  };

  return (
    <div>
      <video ref={userVideo} autoPlay playsInline />
      {peers.map((peer, index) => (
        <VideoCall key={index} peer={peer} />
      ))}
    </div>
  );
}

export default Room;