function Hero() {
  return (
    <section className="min-h-[85vh] bg-slate-900 flex items-center justify-center">

      <div className="text-center max-w-4xl px-6">

        <h1 className="text-6xl font-extrabold text-cyan-400 leading-tight">
          Breaking Communication Barriers
        </h1>

        <p className="mt-6 text-xl text-gray-300">
          Bhasha uses Artificial Intelligence and Computer Vision
          to translate Sign Language into Text and Speech
          in real time.
        </p>

        <div className="mt-10 flex justify-center gap-6">

          <button className="bg-cyan-500 hover:bg-cyan-600 text-white px-7 py-3 rounded-xl transition">
            Try Demo
          </button>

          <button className="border border-cyan-500 text-cyan-400 px-7 py-3 rounded-xl hover:bg-cyan-500 hover:text-white transition">
            Learn More
          </button>

        </div>

      </div>

    </section>
  );
}

export default Hero;