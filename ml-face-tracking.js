// Copied from external ml-face-tracking project for integration
// (UI elements referenced here are not automatically created in this project.)

const face_video = document.getElementById("webcam");
const face_canvas = document.getElementById("canvas");
const face_ctx = face_canvas ? face_canvas.getContext("2d") : null;
const face_status = document.getElementById("status");
const face_startBtn = document.getElementById("startBtn");
const face_faceList = document.getElementById("faceList");
const face_toggleNumbers = document.getElementById("toggleNumbers");

let face_detector = null;
let face_isDetecting = false;
let face_showNumbers = true;

const faceColors = ["#FF0000","#00FF00","#0088FF","#FF00FF","#FFFF00","#00FFFF"];

async function loadFaceModel() {
  try {
    if (face_status) face_status.textContent = "Loading face detection model...";
    await tf.ready();
    try {
      await tf.setBackend('webgl');
    } catch (backendErr) {
      console.warn("face webgl backend unavailable", backendErr);
      try {
        await tf.setBackend('cpu');
      } catch (cpuErr) {
        console.warn("face cpu backend unavailable", cpuErr);
      }
    }
    await tf.ready();

    face_detector = await faceLandmarksDetection.createDetector(
      faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
      { runtime: 'mediapipe', solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh', refineLandmarks: true, maxFaces: 5 }
    );

    if (face_status) face_status.textContent = "Face model loaded";
    if (face_startBtn) face_startBtn.disabled = false;
  } catch (e) {
    console.error(e);
  }
}

window.__ml_face = {
  loadModel: loadFaceModel,
  detectorRef: () => face_detector,
};
