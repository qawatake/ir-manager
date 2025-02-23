import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import * as api from '../api';

interface Remote {
  id: number;
  name: string;
}

interface Button {
  id: number;
  remote_id: number;
  name: string;
  ir_data: string | null;
  status: 'pending' | 'warning' | 'success' | 'error';
}

function RemoteDetail() {
  const { id } = useParams<{ id: string }>();
  const [remote, setRemote] = useState<Remote | null>(null);
  const [buttons, setButtons] = useState<Button[]>([]);
  const [registeringButtonId, setRegisteringButtonId] = useState<number | null>(null);
  const [irDataPackets, setIrDataPackets] = useState<string[]>([]);
  const [irDataCount, setIrDataCount] = useState(0);
  const [currentButtonName, setCurrentButtonName] = useState('');

  const startListeningForIrData = async (buttonId: number) => {
    setRegisteringButtonId(buttonId);
    setIrDataPackets([]);
    setIrDataCount(0);

   const receiveIr = async () => {
      try {
        const response = await api.getIrData(buttonId);
        return response.data.data;
      } catch (error) {
        console.error('Error receiving IR data:', error);
        return null;
      }
    };

    let count = 0;
    while (irDataPackets.length < 3 && count < 10) {
      const data = await receiveIr();
      if (data) {
        setIrDataPackets(prev => [...prev, data]);
      }
      count++;
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    }

    if (irDataPackets.length === 3) {
      const first = irDataPackets[0];
      const allEqual = irDataPackets.every(d => d === first);

      if (allEqual) {
        alert('IR data captured successfully!');
        api.updateButton(buttonId, currentButtonName ?? '', first).then(async () => {
          const buttonsData = await api.getButtons(parseInt(id));
          setButtons(buttonsData);
          alert('Button updated with IR data');
        });
      } else {
        alert('IR data is not consistent. Please try again.');
      }
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
      <h3>Buttons</h3>
      <button onClick={() => {
        const name = prompt('Enter button name:');
        if (name && id) {
          setCurrentButtonName(name);
          if (name) {
            api.createButton(parseInt(id), name).then(async (button) => {
              const buttonsData = await api.getButtons(parseInt(id));
              setButtons(buttonsData);
              if (button && button.id) {
                startListeningForIrData(button.id);
              }
            });
          }
        }
      }}>Register Button</button>
      <ul>
        {buttons.map((button) => (
          <li key={button.id}>
            {button.name}
            {button.status === 'warning' && <span>⚠️</span>}
            {button.status === 'error' && <span>❌</span>}
            <button onClick={() => {
              api.deleteButton(button.id).then(async () => {
                const buttonsData = await api.getButtons(parseInt(id));
                setButtons(buttonsData);
              });
            }}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default RemoteDetail;
