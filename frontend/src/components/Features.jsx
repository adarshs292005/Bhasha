import FeatureCard from "./FeatureCard";

import {
  Hand,
  Mic,
  Volume2,
  Brain,
  Language,
} from "lucide-react";

function Features() {
  const features = [
    {
      icon: Hand,
      title: "Sign to Text",
      description:
        "Recognize hand gestures in real time using AI and convert them into readable text.",
    },
    {
      icon: Mic,
      title: "Speech to Sign",
      description:
        "Listen to spoken words and display the corresponding sign language for seamless communication.",
    },
    {
      icon: Volume2,
      title: "Text to Speech",
      description:
        "Transform translated text into natural speech, making conversations easier for everyone.",
    },
    {
      icon: Brain,
      title: "AI Gesture Recognition",
      description:
        "Powered by MediaPipe and Computer Vision for fast and accurate sign language recognition.",
    },
    {
        icon: Language,
        title: "Multilingual Support",
        description:
          "Supports multiple languages, enabling communication across diverse linguistic backgrounds.",
      },
  ];

  return (
    <section className="bg-slate-950 py-24 px-8">

      <div className="max-w-7xl mx-auto">

        <h2 className="text-5xl font-bold text-center text-white">
          Powerful Features
        </h2>

        <p className="text-center text-gray-400 text-lg mt-5 max-w-2xl mx-auto">
          Bhasha combines Artificial Intelligence, Computer Vision,
          and Speech Technologies to make communication more
          accessible and inclusive.
        </p>

        <div className="grid gap-8 mt-16 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-4">

          {features.map((feature) => (

            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />

          ))}

        </div>

      </div>

    </section>
  );
}

export default Features;