import { Link } from "react-router-dom";

function Hero() {
  return (
    <section className="rounded-3xl bg-gradient-to-r from-zinc-900 to-black p-10 border border-zinc-800">
      
      <p className="text-cyan-400 font-semibold uppercase tracking-widest mb-4">
        ZeroPlay Sports Platform
      </p>

      <h1 className="text-6xl font-bold text-white mb-6">
        Live Football Data & Match Analytics
      </h1>

      <p className="text-zinc-400 text-lg max-w-2xl mb-8">
        Follow the latest fixtures, standings, team stats, and football news
        across Europe’s top leagues.
      </p>

      <div className="flex gap-4">
        <Link
          to="/games"
          className="bg-cyan-400 text-black px-6 py-3 rounded-2xl font-bold hover:scale-105 transition"
        >
          Explore Matches
        </Link>

        <Link
          to="/news"
          className="border border-zinc-700 text-white px-6 py-3 rounded-2xl hover:bg-zinc-900 transition"
        >
          Latest News
        </Link>
      </div>

    </section>
  );
}

export default Hero;
