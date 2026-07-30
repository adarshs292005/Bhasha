export function extractFeatures(landmarks) {
  if (!landmarks || landmarks.length === 0) {
    return [];
  }

  const features = [];

  landmarks.forEach((point) => {
    features.push(point.x);
    features.push(point.y);
    features.push(point.z);
  });

  return features;
}