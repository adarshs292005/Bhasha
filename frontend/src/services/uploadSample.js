import { supabase } from "./supabase";

export async function uploadSample(gesture, features) {
  const { error } = await supabase
    .from("gesture_samples")
    .insert([
      {
        gesture,
        features,
      },
    ]);

  if (error) {
    console.error("Upload Failed:", error);
    return false;
  }

  console.log("✅ Sample uploaded!");
  return true;
}