import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import Analyzer from "./Analyzer";

function App() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  // this text will auto-fill the Analyzer
  const [analysisText, setAnalysisText] = useState("");

  const onDrop = useCallback(acceptedFiles => {
    setFiles(acceptedFiles);
    setResults(null);
    setError(null);
    setAnalysisText("");   // clear analyzer on new upload
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  async function handleUpload(e) {
    e.preventDefault();
    if (files.length === 0) {
      setError("please add at least one file");
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const form = new FormData();
      files.forEach(f => form.append("files", f));

      const res = await fetch("http://localhost:8000/extract", {
        method: "POST",
        body: form
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "upload failed");
      }

      const json = await res.json();
      setResults(json);

      // Gather all extracted text to auto-fill analyzer
      const combinedText = json.files
        .map(f => f.text || "")
        .join("\n\n---\n\n");

      setAnalysisText(combinedText);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  return (<>
    <div style={{ maxWidth: 800, margin: "24px auto", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ textAlign: "center" }}>social media content analyzer</h1>

      <div
        {...getRootProps()}
        style={{
          border: "2px dashed #aaa",
          padding: 20,
          borderRadius: 8,
          textAlign: "center",
          background: isDragActive ? "#f7f7f7" : "white"
        }}
      >
        <input {...getInputProps()} />
        <p style={{ margin: 0 }}>
          {isDragActive ? "drop your files here" : "drag & drop pdf or image files here, or click to browse"}
        </p>
      </div>

      <div style={{ marginTop: 12 }}>
        <strong>selected files:</strong>
        <ul>
          {files.map((f, i) => (
            <li key={i}>{f.name} — {Math.round(f.size / 1024)}kb</li>
          ))}
        </ul>
      </div>

      <div style={{ marginTop: 12 }}>
        <button
          onClick={handleUpload}
          disabled={loading}
          style={{ padding: "8px 12px", fontSize: "20px" }}
        >
          {loading ? "processing..." : "upload & extract"}
        </button>

        <button
          style={{ marginLeft: 8 ,padding: "8px 12px", fontSize: "20px" }}
          onClick={() => {
            setFiles([]);
            setResults(null);
            setError(null);
            setAnalysisText("");
          }}
        >
          clear
        </button>
      </div>

      {error && (
        <div style={{ marginTop: 12, color: "crimson" }}>{error}</div>
      )}

      {/* {results && (
        <div style={{ marginTop: 20 }}>
          <h3>extracted text</h3>
          {results.files.map((f, idx) => (
            <div
              key={idx}
              style={{
                border: "1px solid #eee",
                padding: 12,
                marginBottom: 12,
                borderRadius: 6,
                backgroundColor: "white",
                maxHeight: "400px",
                overflow: "scroll"
              }}
            >
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <strong>{f.filename}</strong>
                <button onClick={() => downloadText(f.filename, f.text || "")}>
                  download txt
                </button>
              </div>

              {f.error ? (
                <div style={{ color: "crimson" }}>error: {f.error}</div>
              ) : (
                <pre
                  style={{
                    whiteSpace: "pre-wrap",
                    marginTop: 8,
                    background: "#fafafa",
                    padding: 10
                  }}
                >
                  {f.text || "[no text extracted]"}
                </pre>
              )}
            </div>
          ))}
        </div>
      )} */}


    </div>
    <Analyzer analysisText={analysisText} />
  </>
  );
}

export default App;