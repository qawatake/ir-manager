import { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import "./App.css";
import * as api from "./api";
import RemoteDetail from "./components/RemoteDetail";

function App() {
  const [remotes, setRemotes] = useState<Remote[]>([]);

  useEffect(() => {
    const fetchRemotes = async () => {
      const data = await api.getRemotes();
      setRemotes(data);
    };

    fetchRemotes();
  }, []);

  interface Remote {
    id: number;
    name: string;
  }

  return (
    <Router>
      <div className="App">
        <h1>IR Manager</h1>
        <Routes>
          <Route
            path="/"
            element={
              <>
                <h2>Remotes</h2>
               <button
                  onClick={() => {
                    const name = prompt("Enter remote name:") || "";
                      api.createRemote(name).then(async () => {
                        const data = await api.getRemotes();
                        setRemotes(data);
                      });
                  }}
                >
                  Register Remote
                </button>
                <ul>
                  {remotes.map((remote) => (
                    <li key={remote.id}>
                      <Link to={`/remote/${remote.id}`}>{remote.name}</Link>
                    </li>
                  ))}
                </ul>
              </>
            }
          />
          <Route path="/remote/:id" element={<RemoteDetail />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
