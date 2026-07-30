import { getDataset } from "../ai/datasetCollector";

export function downloadDataset() {
  const dataset = getDataset();

  if (dataset.length === 0) {
    alert("Dataset is empty!");
    return;
  }

  const csv = dataset.map(row => row.join(",")).join("\n");

  const blob = new Blob([csv], { type: "text/csv" });

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");

  a.href = url;
  a.download = "isl_dataset.csv";

  a.click();

  URL.revokeObjectURL(url);
}