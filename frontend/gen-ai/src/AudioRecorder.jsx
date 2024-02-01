import { useState, useRef } from "react";

const mimeType = "audio/webm";

const AudioRecorder = () => {
  const [permission, setPermission] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("english"); // Default language is English
  const mediaRecorder = useRef(null);
  const [recordingStatus, setRecordingStatus] = useState("inactive");
  const [stream, setStream] = useState(null);
  const [audio, setAudio] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);

  const getMicrophonePermission = async () => {
    if ("MediaRecorder" in window) {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
        setPermission(true);
        setStream(mediaStream);
      } catch (err) {
        alert(err.message);
      }
    } else {
      alert("The MediaRecorder API is not supported in your browser.");
    }
  };

  const startRecording = async () => {
    setRecordingStatus("recording");
    const media = new MediaRecorder(stream, { type: mimeType });

    mediaRecorder.current = media;

    mediaRecorder.current.start();

    let localAudioChunks = [];

    mediaRecorder.current.ondataavailable = (event) => {
      if (typeof event.data === "undefined") return;
      if (event.data.size === 0) return;
      localAudioChunks.push(event.data);
    };

    setAudioChunks(localAudioChunks);
  };

  const stopRecording = async () => {
    setRecordingStatus("inactive");
    mediaRecorder.current.stop();

    mediaRecorder.current.onstop = async () => {
      const audioBlob = new Blob(audioChunks, { type: mimeType });
      const formData = new FormData();

      formData.append("audio", audioBlob, "recordedAudio.weba");
      formData.append("language", selectedLanguage); // Add selected language

      try {
        const response = await fetch("http://localhost:5000/getinput", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          console.log("Audio successfully sent to server");
        } else {
          console.error("Failed to send audio to server");
        }
      } catch (error) {
        console.error("Error sending audio to server:", error);
      }

      setAudioChunks([]);
    };
  };

  return (
    <div>
      <main>
        <div className="audio-controls">
          {!permission ? (
            <button onClick={getMicrophonePermission} type="button">
              Get Microphone
            </button>
          ) : null}
          {permission && recordingStatus === "inactive" ? (
            <div>
              <button onClick={startRecording} type="button">
                Start Recording
              </button>
              <label>
                Language:
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                >
                  <option value="english">English</option>
                  <option value="hindi">Hindi</option>
                </select>
              </label>
            </div>
          ) : null}
          {recordingStatus === "recording" ? (
            <button onClick={stopRecording} type="button">
              Stop Recording
            </button>
          ) : null}
        </div>
        {audio ? (
          <div className="audio-player">
            <audio src={audio} controls></audio>
            <a download href={audio}>
              Download Recording
            </a>
          </div>
        ) : null}
      </main>
    </div>
  );
};

export default AudioRecorder;
