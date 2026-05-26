import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Games from "./pages/Games";
import Login from "./pages/Login";
import League from "./pages/League";
import Team from "./pages/Team";
import Teams from "./pages/Teams";
import News from "./pages/News";

import Navbar from "./components/Navbar";

function App() {
  return (
    <BrowserRouter>

      <Navbar />

      <Routes>

        <Route path="/" element={<Home />} />

        <Route path="/games" element={<Games />} />

        <Route path="/teams" element={<Teams />} />

        <Route path="/news" element={<News />} />

        <Route path="/login" element={<Login />} />

        <Route
          path="/league/:leagueName"
          element={<League />}
        />

        <Route
          path="/team/:teamName"
          element={<Team />}
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;
