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
    <div>
      <h2>Remote: {remote.name}</h2>
      <Link to="/" className="mb-4 block">
        Back to Remote List
      </Link>
      <h3>Buttons</h3>
      <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded m-2"
        onClick={() => {
          const name = prompt("Enter button name:");
          if (name && id) {
            if (name) {
              api
                .createButton(parseInt(id), name)
                .then(async () => {
                  const buttonsData = await api.getButtons(parseInt(id));
                  setButtons(buttonsData);
                })
                .catch((error: unknown) => {
                  if (
                    error instanceof Error &&
                    error.message
                  ) {
                    alert(error.message);
                  } else {
                    alert("An unexpected error occurred.");
                  }
                });
            }
          }
        }}
      >
        Register Button
      </button>
      <ul>
        {buttons.map((button) => (
          <li
            key={button.id}
            className="flex items-center justify-between py-2 px-4 border-b m-2"
          >
            <span className="mr-4">{button.name}</span>
            {button.status === "pending" && <span>⏳</span>}
            {button.status === "warning" && <span>⚠️</span>}
            {button.status === "success" && <span>✅</span>}
            {button.status === "error" && <span>❌</span>}
            <button
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mr-2"
              onClick={() => {
                api
                  .sendIrData(button.id)
                  .then(() => {
                    alert("IR data sent!");
                  })
                  .catch((error: unknown) => {
                    if (
                      error instanceof Error &&
                      error.message
                    ) {
                      alert(error.message);
                    } else {
                      alert("An unexpected error occurred.");
                    }
                  });
              }}
            >
              Send
            </button>
            <button
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
              onClick={() => {
                api.deleteButton(button.id).then(async () => {
                  const buttonsData = await api.getButtons(parseInt(id || "0"));
                  setButtons(buttonsData);
                });
              }}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default RemoteDetail;
