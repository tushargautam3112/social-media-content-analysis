import { useState, useEffect } from "react";
import "github-markdown-css/github-markdown.css";
import { marked } from "marked";

export default function Analyzer({ analysisText }) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  // Auto-fill textarea whenever extracted text arrives
  useEffect(() => {
    if (analysisText) setInput(analysisText);
  }, [analysisText]);

    const handleCopy = () => {
    navigator.clipboard.writeText(input);
  };

  const handleDownload = () => {
    const blob = new Blob([input], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "analysis.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAnalyze = async () => {
    if (!input.trim()) return;
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8000/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input })
      });

      const data = await res.json();
      setResult(data.analysis);
    } catch (err) {
      console.log(err);
      setResult("error connecting to backend");
    }

    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 800, margin: "24px auto", fontFamily: "system-ui, sans-serif" }}>
      <h2 style={{ marginBottom: "10px" }}>edit before analysis?</h2>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="extracted text will appear here..."
        style={{
          width: "97%",
          height: "120px",
          padding: "10px",
          borderRadius: "8px",
          resize: "none"
        }}
      />

      <div style={{ display: "flex", justifyContent:"space-between", marginTop: "10px" }}>
        <button
          onClick={handleAnalyze}
          disabled={loading}
          style={{
            padding: "8px 12px", fontSize: "20px"
          }}
        >
          {loading ? "analyzing…" : "analyze"}
        </button>
          <div style={{display: "flex", gap: "10px"}}>
        <button
          onClick={handleCopy}
          style={{
            padding: "8px 12px", fontSize: "20px"
          }}
        >
          copy text
        </button>

        <button
          onClick={handleDownload}
          style={{
            padding: "8px 12px", fontSize: "20px"
          }}
        >
          download txt
        </button>
        </div>
      </div>


      {/* {result && (
        <div
          style={{
            marginTop: "20px",
            padding: "15px",
            background: "#f3f3f3",
            borderRadius: "10px",
            whiteSpace: "pre-wrap"
          }}
        >
          {result}
        </div>
      )} */}

      {result && (
  <div
    className="markdown-body"
    style={{
      marginTop: "20px",
      padding: "20px",
      borderRadius: "10px",
      color: "black",
      background: "#fff",
      boxShadow: "0 0 10px rgba(0,0,0,0.05)",
    }}
    dangerouslySetInnerHTML={{
      __html: marked.parse(result)
    }}
  />
)}
<p>tushar.gautam.mailbox@gmail.com</p>
    </div>
  );
}