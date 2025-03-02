import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import RemoteDetail from "./components/RemoteDetail";
import "./App.css";
import * as api from "./api";

interface Remote {
  id: number;
  name: string;
}

function App() {
  const [remotes, setRemotes] = useState<Remote[]>([]);

  useEffect(() => {
    api.getRemotes().then(setRemotes);
  }, []);

  const handleCreateRemote = () => {
    const name = prompt("リモコン名を入力してください:");
    if (name) {
      api
        .createRemote(name)
        .then(() => {
          return api.getRemotes();
        })
        .then(setRemotes);
    }
  };

  return (
    <Router>
      <div className="container mx-auto my-4">
        <Routes>
          <Route
            path="/"
            element={
              <>
                <div className="text-left mb-6">
                  <h1 className="text-3xl font-semibold">リモコン一覧</h1>
                </div>
                <div className="text-left">
                  <button
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
                    onClick={handleCreateRemote}
                  >
                    作成
                  </button>
                </div>
                <table className="table-auto w-full">
                  <tbody>
                    {remotes.map((remote) => (
                      <tr key={remote.id} className="border-b border-gray-300">
                        <td className="px-4 py-4">
                          <Link
                            to={`/remote/${remote.id}`}
                            className="text-blue-500 hover:text-blue-700"
                          >
                            {remote.name}
                          </Link>
                        </td>
                        <td className="px-4 py-4">
                          <button
                            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                            onClick={() => {
                              api
                                .deleteRemote(remote.id)
                                .then(() => {
                                  return api.getRemotes();
                                })
                                .then(setRemotes);
                            }}
                          >
                            削除
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
