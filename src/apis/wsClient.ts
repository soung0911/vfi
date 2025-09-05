export const extractVideoFrames = async (
  file: File,
  userName: string
): Promise<string[]> => {
  const startTime = performance.now();
  const frames: string[] = [];

  try {
    console.log("Starting frame extraction...");
    const ws = new WebSocket(`wss://${process.env.NEXT_PUBLIC_SERVER_URL}/ws/extract-frames`);

    return new Promise((resolve, reject) => {
      ws.onopen = async () => {
        console.log("WebSocket connection established");
        const reader = new FileReader();
        reader.readAsArrayBuffer(file);
        reader.onloadend = async () => {
          ws.send(
            JSON.stringify({
              user_name: userName,
            })
          );

          if (reader.result instanceof ArrayBuffer) {
            const videoData = new Uint8Array(reader.result);
            const CHUNK_SIZE = 1024 * 1024; // 1 MB chunks

            for (let i = 0; i < videoData.byteLength; i += CHUNK_SIZE) {
              const chunk = videoData.slice(i, i + CHUNK_SIZE);
              ws.send(chunk);
              console.log(`Sent chunk ${i / CHUNK_SIZE + 1}`);
            }

            ws.send("END"); // Sending a message to mark the end
            console.log("Sent all video data");
          } else {
            reject(new Error("Failed to read the file as an ArrayBuffer"));
          }
        };
      };

      ws.onmessage = async (event) => {
        if (typeof event.data === "string") {
          const data = JSON.parse(event.data);
          if (data.status === "completed") {
            console.log(`FPS set to: ${data.fps}`);

            const endTime = performance.now();
            console.log(
              `Frame extraction process completed in ${
                (endTime - startTime) / 1000
              } seconds.`
            );

            resolve(frames);
          } else if (data.status === "error") {
            reject(new Error(data.message));
          }
        } else {
          const frameBlob = new Blob([event.data]);
          const frameUrl = URL.createObjectURL(frameBlob);
          frames.push(frameUrl);

          console.log("Received and processed a frame");
        }
      };

      ws.onerror = (wsError) => {
        reject(new Error(`WebSocket error: ${wsError}`));
      };

      ws.onclose = () => {
        console.log("WebSocket connection closed");
      };
    });
  } catch (extractionError) {
    console.error(`Error during frame extraction: ${extractionError}`);
    throw extractionError;
  }
};
