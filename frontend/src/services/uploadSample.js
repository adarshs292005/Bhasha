import { supabase } from "./supabase";

export async function uploadSample(gesture, features, participant) {
 console.log("Uploading sample...");
 console.log("Gesture:", gesture);
 console.log("Features:", features);
 console.log("Feature length:", features.length);
 console.log("Participant:", participant);

 const { data, error } = await supabase
 .from("gesture_samples")
 .insert([
 {
   gesture: gesture,
   features: features,
  participant: participant,
 },
 ])
.select();

 if (error) {
   console.error("Upload error message:", error.message);

   console.error("Upload error details:", error.details);
 
   console.error("Upload error hint:", error.hint);

   console.error("Upload error code:", error.code);
   return false;
 }

 console.log("Sample uploaded:", data);

 return true;
}