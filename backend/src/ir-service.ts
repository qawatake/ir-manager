interface IRData {
  [buttonId: string]: string[];
}

const irData: IRData = {};

export const startListening = (buttonId: string) => {
  console.log(`Starting mock IR transmission service for button ${buttonId}`);

  // Simulate receiving IR data after a delay
  setTimeout(() => {
    receiveIrData(buttonId, 'AAAA');
  }, 1000);
  setTimeout(() => {
    receiveIrData(buttonId, 'AAAA');
  }, 2000);
  setTimeout(() => {
    receiveIrData(buttonId, 'AAAA');
  }, 3000);
};

const receiveIrData = (buttonId: string, data: string) => {
  if (!irData[buttonId]) {
    irData[buttonId] = [];
  }

  irData[buttonId].push(data);
  console.log(`Received IR data for button ${buttonId}: ${data}`);
};

export const getIrData = (buttonId: string) => {
  if (irData[buttonId] && irData[buttonId].length === 3) {
    const first = irData[buttonId][0];
    const allEqual = irData[buttonId].every(d => d === first);

    if (allEqual) {
      return first;
    }
  }
  return null;
};

export const clearIrData = (buttonId: string) => {
  delete irData[buttonId];
};

export { irData };
