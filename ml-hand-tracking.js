// Copied from external ml-hand-tracking project for integration
// (UI elements referenced here are not automatically created in this project.)

// Get DOM elements
const hand_video = document.getElementById("webcam");
const hand_canvas = document.getElementById("canvas");
const hand_ctx = hand_canvas ? hand_canvas.getContext("2d") : null;
const hand_status = document.getElementById("status");
const hand_startBtn = document.getElementById("startBtn");
const hand_handList = document.getElementById("handList");
const hand_toggleNumbers = document.getElementById("toggleNumbers");

let hand_detector = null;
let hand_isDetecting = false;
let hand_showNumbers = true;

// Colors for different hands
const handColors = [
  "#FF0000", // Red
  "#00FF00", // Green
  "#0088FF", // Blue
  "#FF00FF", // Magenta
  "#FFFF00", // Yellow
  "#00FFFF", // Cyan
];

// Hand landmark connections (finger bones)
const HAND_CONNECTIONS = [
  [0, 1],[1, 2],[2, 3],[3, 4],
  [0, 5],[5, 6],[6, 7],[7, 8],
  [0, 9],[9,10],[10,11],[11,12],
  [0,13],[13,14],[14,15],[15,16],
  [0,17],[17,18],[18,19],[19,20],
];

const LANDMARK_NAMES = [
  "Wrist","Thumb CMC","Thumb MCP","Thumb IP","Thumb Tip",
  "Index MCP","Index PIP","Index DIP","Index Tip",
  "Middle MCP","Middle PIP","Middle DIP","Middle Tip",
  "Ring MCP","Ring PIP","Ring DIP","Ring Tip",
  "Pinky MCP","Pinky PIP","Pinky DIP","Pinky Tip",
];

async function loadHandModel() {
  try {
    if (hand_status) hand_status.textContent = "Loading hand detection model...";
    await tf.ready();
    try {
      await tf.setBackend("webgl");
    } catch (backendErr) {
      console.warn("hand webgl backend unavailable", backendErr);
      try {
        await tf.setBackend("cpu");
      } catch (cpuErr) {
        console.warn("hand cpu backend unavailable", cpuErr);
      }
    }
    await tf.ready();

    hand_detector = await handPoseDetection.createDetector(
      handPoseDetection.SupportedModels.MediaPipeHands,
      { runtime: "mediapipe", solutionPath: "https://cdn.jsdelivr.net/npm/@mediapipe/hands", modelType: "full", maxHands: 2, minDetectionConfidence: 0.45, minTrackingConfidence: 0.45 }
    );

    if (hand_status) hand_status.textContent = "Hand model loaded";
    if (hand_startBtn) hand_startBtn.disabled = false;
  } catch (e) {
    console.error(e);
  }
}

// Expose minimal API for manual integration
window.__ml_hand = {
  loadModel: loadHandModel,
  detectorRef: () => hand_detector,
};
