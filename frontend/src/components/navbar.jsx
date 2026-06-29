function Navbar() {
  return (
    <nav className="bg-slate-950 text-white shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-8 py-5">

        <h1 className="text-3xl font-bold text-cyan-400">
          Bhasha
        </h1>

        <ul className="flex gap-8 text-lg">
          <li className="cursor-pointer hover:text-cyan-400 transition">
            Home
          </li>

          <li className="cursor-pointer hover:text-cyan-400 transition">
            About
          </li>

          <li className="cursor-pointer hover:text-cyan-400 transition">
            Demo
          </li>

          <li className="cursor-pointer hover:text-cyan-400 transition">
            Contact
          </li>
        </ul>

      </div>
    </nav>
  );
}

export default Navbar;