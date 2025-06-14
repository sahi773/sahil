const socket = io();
let localStream, peerConnection;

const configuration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

async function start() {
  try {
    // Get user camera
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    document.getElementById('localVideo').srcObject = localStream;

    // Initialize WebRTC peer connection
    peerConnection = new RTCPeerConnection(configuration);

    // Add local stream to peer connection
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', event.candidate);
      }
    };

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      document.getElementById('remoteVideo').srcObject = event.streams[0];
    };

    // Create offer
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit('offer', offer);

  } catch (error) {
    console.error('Error accessing camera:', error);
  }
}

// Handle incoming offer
socket.on('offer', async (offer) => {
  if (!peerConnection) {
    peerConnection = new RTCPeerConnection(configuration);
    peerConnection.ontrack = (event) => {
      document.getElementById('remoteVideo').srcObject = event.streams[0];
    };
  }
  await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  socket.emit('answer', answer);
});

// Handle incoming answer
socket.on('answer', (answer) => {
  peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
});

// Handle ICE candidate
socket.on('ice-candidate', (candidate) => {
  peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
});

// Share link (simplified)
function shareLink() {
  const link = `${window.location.origin}?room=${socket.id}`;
  alert('Share this link: ' + link);
}