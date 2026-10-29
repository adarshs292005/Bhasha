export function recognizeGesture(landmarks) {
  if (!landmarks || landmarks.length === 0) {
    return "No Hand";
  }

  const fingers = {
    index: landmarks[8].y < landmarks[6].y,
    middle: landmarks[12].y < landmarks[10].y,
    ring: landmarks[16].y < landmarks[14].y,
    pinky: landmarks[20].y < landmarks[18].y,
  };

  // First gesture
  if (
    fingers.index &&
    fingers.middle &&
    fingers.ring &&
    fingers.pinky
  ) {
    return "Hello";
  }

  return "Unknown Gesture";
}