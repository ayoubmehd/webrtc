import "./style.css";
import Peer from "peerjs";

const socket = io("http://localhost:5000"); // Old:http://localhost:5000

const constraints = (window.constraints = {
  audio: false,
  video: true,
});
let peer = new Peer();
const videoDOM = document.querySelector("video#webcam");
const remoteDOM = document.querySelector("video#remote");
const startBtn = document.querySelector("button#start");
const joinBtn = document.querySelector("button#call");
const answerCallBtn = document.querySelector("button#answer-call");
const notifyDOM = document.querySelector("#notify");
const videosDOM = document.querySelector("#videos");
const messages = document.querySelector("#messages");
/**
 * @var newMessageForm {HTMLFormElement}
 */
const newMessageForm = document.querySelector("#new-message");
const connectForm = document.querySelector("#connect");

let conn, call, stream, peerId;

newMessageForm.addEventListener("submit", (e) => e.preventDefault());
connectForm.addEventListener("submit", (e) => e.preventDefault());

startBtn.addEventListener("click", async () => {
  try {
    const _stream = await navigator.mediaDevices.getUserMedia(constraints);
    const videoTracks = _stream.getVideoTracks();
    startBtn.disabled = true;
    window._stream = _stream;
    videoDOM.srcObject = _stream;
    stream = _stream;
  } catch (error) {
    console.log(error);
  }
});

joinBtn.addEventListener("click", () => {
  socket.emit("new-user", peerId);
});

newMessageForm.addEventListener("submit", () => {
  newMessage(newMessageForm.content.value);
  conn.send(newMessageForm.content.value);
  newMessageForm.content.value = "";
});
connectForm.addEventListener("submit", () => {
  conn = peer.connect(connectForm.peer_id.value);

  call.on("stream", (stream) => {
    remoteDOM.srcObject = stream;
  });
  connectForm.peer_id.value = "";
  conn.on("data", (data) => {
    newMessage(data);
  });
});

function clearNotify(after = 7000) {
  setTimeout(() => (notifyDOM.innerHTML = ""), after);
}

function newMessage(message) {
  const p = document.createElement("p");
  p.textContent = message;
  messages.appendChild(p);
}

function connect() {
  call.on("stream", (stream) => {
    console.log("on-stream");
    const video = createElement({
      tagName: "video",
    });

    video.autoplay = true;
    video.srcObject = stream;
    videosDOM.append(video);
  });
}

socket.on("new-peer", (newPeerId) => {
  if (peerId !== newPeerId) {
    console.log("new-peer");
    conn = peer.connect(newPeerId);
    call = peer.call(newPeerId, stream);
    connect();
  }
});

peer.on("open", (id) => {
  // emit an event to the server with the user id
  peerId = id;
  document.querySelector("#peer_id").value = id;
});

peer.on("connection", (_conn) => {
  conn = _conn;
  conn.on("data", (data) => {
    newMessage(data);
  });
});

peer.on("call", (_call) => {
  call = _call;
  console.log("on-call");
  call.answer(stream);
  connect();
});

function createElement({ tagName, attrs = {}, children = [] }) {
  const $el = document.createElement(tagName);

  for (const [k, v] of Object.entries(attrs)) {
    if (k.startsWith("on")) {
      $el.addEventListener(k.replace("on", ""), v);
      continue;
    }

    $el.setAttribute(k, v);
  }

  for (const child of children) {
    if (typeof child === "string") {
      $el.appendChild(document.createTextNode(child));
    } else $el.appendChild(child);
  }

  return $el;
}
