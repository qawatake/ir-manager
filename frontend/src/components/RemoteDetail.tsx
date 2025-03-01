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
    <div className="text-center my-4">
      <h2 className="text-2xl font-semibold">Remote: {remote.name}</h2>
      <Link to="/" className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-2 px-4 rounded inline-flex items-center">
        <svg className="fill-current w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm-3.7-4.8L8.3 10 6.3 6.8 5 5.5l-5 5 5 5 1.3-1.3 2-3.2z"/></svg>
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
        Register Button
      </button>
      <div className="max-w-md mx-auto">
        {buttons.map((button) => (
          <div
            key={button.id}
            className="flex items-center justify-between py-2 px-4 border-b m-2"
          >
            <span className="mr-4 w-1/3">{button.name}</span>
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
          </div>
        ))}
      </div>
    </div>
  );
}

export default RemoteDetail;
