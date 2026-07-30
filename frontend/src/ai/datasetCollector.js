let dataset = [];

/**
 * Adds one labeled sample to the dataset.
 */
export function addSample(features, label) {
  if (features.length !== 63) {
    console.warn("Invalid feature vector.");
    return;
  }

  dataset.push([...features, label]);

  console.log(`Sample Added: ${label}`);
  console.log(`Total Samples: ${dataset.length}`);
}

/**
 * Returns the current dataset.
 */
export function getDataset() {
  return dataset;
}