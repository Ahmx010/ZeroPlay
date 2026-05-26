import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="bg-black text-white p-4 flex justify-center gap-6">
      <Link to="/">Home</Link>
      <Link to="/games">Games</Link>
      <Link to="/teams">Teams</Link>
      <Link to="/news">News</Link>
      <Link to="/login">Login</Link>
    </nav>
  );
}

export default Navbar;
