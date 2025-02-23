import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
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

import { Link } from "react-router-dom";

function RemoteDetail() {
  const { id } = useParams<{ id: string }>();
  const [remote, setRemote] = useState<Remote | null>(null);
  const [buttons, setButtons] = useState<Button[]>([]);
  const [irDataPackets, setIrDataPackets] = useState<string[]>([]);
  const [currentButtonName, setCurrentButtonName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const startListeningForIrData = async (buttonId: number) => {
    setIrDataPackets([]);
    setIsLoading(true);

    try {
      await api.listenIr(buttonId);

      const receiveIr = async () => {
        try {
          const response = await api.getIrData(buttonId);
          return response.data.data;
        } catch (error) {
          console.error("Error receiving IR data:", error);
          return null;
        }
      };

      let count = 0;
      let noDataCount = 0;
      while (irDataPackets.length < 3 && count < 10) {
        const data = await receiveIr();
        if (data) {
          setIrDataPackets((prev) => [...prev, data]);
          noDataCount = 0;
        } else {
          noDataCount++;
        }
        count++;
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second

        if (noDataCount >= 5) {
          console.log("No IR data received for 5 seconds. Aborting.");
          alert("No IR data received. Please try again.");
          break;
        }
      }

      if (irDataPackets.length === 3) {
        const first = irDataPackets[0];
        const allEqual = irDataPackets.every((d) => d === first);

        if (allEqual) {
          alert("IR data captured successfully!");
          api
            .updateButton(buttonId, currentButtonName ?? "", first)
            .then(async () => {
              const buttonsData = await api.getButtons(parseInt(id ?? "0"));
              setButtons(buttonsData);
              alert("Button updated with IR data");
            });
        } else {
          alert("IR data is not consistent. Please try again.");
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

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
      <Link to="/" className="mb-4 block">Back to Remote List</Link>
      <h3>Buttons</h3>
      <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        onClick={() => {
          const name = prompt("Enter button name:");
          if (name && id) {
            setCurrentButtonName(name);
            if (name) {
              api.createButton(parseInt(id), name).then(async (button) => {
                const buttonsData = await api.getButtons(parseInt(id));
                setButtons(buttonsData);
                if (button && button.id) {
                  startListeningForIrData(button.id);
                }
              }).catch((error: any) => {
                if (error.response && error.response.data && error.response.data.message) {
                  alert(error.response.data.message);
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
          <li key={button.id} className="flex items-center justify-between py-2 px-4 border-b m-2">
            <span>{button.name}</span>
            {button.status === "pending" && <span>⏳</span>}
            {button.status === "warning" && <span>⚠️</span>}
            {button.status === "success" && <span>✅</span>}
            {button.status === "error" && <span>❌</span>}
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
      {isLoading && <p>Loading...</p>}
    </div>
  );
}

export default RemoteDetail;
