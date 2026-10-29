function FeatureCard({ icon: Icon, title, description }) {
  return (
    <div className="bg-slate-800 p-8 rounded-xl text-center shadow-lg hover:scale-105 transition duration-300">
      <Icon className="w-14 h-14 text-cyan-400 mx-auto" />

      <h3 className="text-2xl font-semibold text-white mt-6">
        {title}
      </h3>

      <p className="text-gray-400 mt-4">
        {description}
      </p>
    </div>
  );
}

export default FeatureCard;