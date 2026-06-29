import "./App.css";

function App() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-cyan-400">
          Welcome to Bhasha 🚀
        </h1>

        <p className="text-gray-300 mt-4 text-lg">
          AI-Powered Sign Language Communication Platform
        </p>

        <button className="mt-8 px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl transition">
          Get Started
        </button>
      </div>
    </div>
  );
}

export default App;