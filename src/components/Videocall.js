// src/components/VideoCall.js
import React, { useEffect, useRef } from 'react';

function VideoCall({ peer }) {
  const ref = useRef();

  useEffect(() => {
    peer.on('stream', (stream) => {
      ref.current.srcObject = stream;
    });
  }, [peer]);

  return <video ref={ref} autoPlay playsInline />;
}

export default VideoCall;