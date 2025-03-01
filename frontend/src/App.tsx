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
      <div className="App mx-4 md:mx-6 lg:mx-8">
        <div className="max-w-screen-md mx-auto py-8">
          <div className="flex flex-col items-start space-y-2">
            <h1 className="text-3xl font-bold text-center">IR Manager</h1>
            <Routes>
              <Route
                path="/"
                element={
                  <>
                    <h2 className="text-2xl font-semibold text-center">
                      Remotes
                    </h2>
                    <button
                      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
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
                    <div className="grid grid-cols-2 gap-4">
                      {remotes.map((remote) => (
                        <div
                          key={remote.id}
                          className=""
                        >
                          <div className="flex-grow overflow-hidden text-ellipsis p-1">
                            <Link
                              to={`/remote/${remote.id}`}
                              className="text-center"
                            >
                              {remote.name}
                            </Link>
                          </div>
                          <button
                            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                            onClick={() => {
                              api.deleteRemote(remote.id).then(async () => {
                                const data = await api.getRemotes();
                                setRemotes(data);
                              });
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                }
              />
              <Route path="/remote/:id" element={<RemoteDetail />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;
