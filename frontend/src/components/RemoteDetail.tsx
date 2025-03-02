import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import * as api from "../api";

interface Remote {
  id: number;
  name: string;
}

interface Button {
  id: number;
  remote_id: number;
  name: string;
  ir_data: string | null;
  status: "pending" | "warning" | "success" | "error";
}

function RemoteDetail() {
  const { id } = useParams<{ id: string }>();
  const [remote, setRemote] = useState<Remote | null>(null);
  const [buttons, setButtons] = useState<Button[]>([]);

  useEffect(() => {
    const fetchRemote = async () => {
      if (id) {
        const remoteData = await api.getRemote(parseInt(id));
        setRemote(remoteData);
      }
    };

    const fetchButtons = async () => {
      if (id) {
        const buttonsData = await api.getButtons(parseInt(id));
        setButtons(buttonsData);
      }
    };

    fetchRemote();
    fetchButtons();
  }, [id]);

  if (!remote) {
    return <div>Loading...</div>;
  }

  return (
    <div className="my-4 container mx-auto">
      <div className="text-left mb-6">
        <div className="flex items-center text-xl mb-2">
          <Link to="/" className="text-blue-500 hover:text-blue-700">
            リモコン一覧
          </Link>
          <span className="mx-2">&gt;</span>
          <span className="font-medium">{remote.name}</span>
        </div>
        <h1 className="text-3xl font-semibold">{remote.name}</h1>
      </div>
      <div className="text-left">
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
          onClick={() => {
            const name = prompt("ボタン名を入力してください:");
            if (name && id) {
              if (name) {
                api
                  .createButton(parseInt(id), name)
                  .then(async () => {
                    const buttonsData = await api.getButtons(parseInt(id));
                    setButtons(buttonsData);
                  })
                  .catch((error: unknown) => {
                    if (error instanceof Error && error.message) {
                      alert(error.message);
                    } else {
                      alert("An unexpected error occurred.");
                    }
                  });
              }
            }
          }}
        >
          ボタンを追加
        </button>
      </div>
      <table className="table-auto w-full">
        <tbody>
          {buttons.map((button) => (
            <tr key={button.id} className="border-b border-gray-300">
              <td className="px-4 py-4">{button.name}</td>
              <td className="px-4 py-4">
                <button
                  className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mr-2"
                  onClick={() => {
                    api.sendIrData(button.id).catch((error: unknown) => {
                      if (error instanceof Error && error.message) {
                        alert(error.message);
                      } else {
                        alert("An unexpected error occurred.");
                      }
                    });
                  }}
                >
                  送信
                </button>
              </td>
              <td className="px-4 py-4">
                <button
                  className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                  onClick={() => {
                    api.deleteButton(button.id).then(async () => {
                      const buttonsData = await api.getButtons(
                        parseInt(id || "0")
                      );
                      setButtons(buttonsData);
                    });
                  }}
                >
                  削除
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default RemoteDetail;
