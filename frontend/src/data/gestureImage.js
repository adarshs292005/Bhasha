const images = import.meta.glob("../assets/gestures/*.{png,jpg,jpeg}", {
  eager: true,
});

const gestureImages = {};

for (const path in images) {
  const fileName = path.split("/").pop().split(".")[0];
  gestureImages[fileName] = images[path].default;
}

export default gestureImages;