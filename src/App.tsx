import { useMemo, useState } from "react";
import Editor from "@monaco-editor/react";

type ProjectFile = {
  id: string;
  name: string;
  language: "typescript" | "javascript" | "html" | "css" | "json";
  content: string;
};

const starterFiles: ProjectFile[] = [
  {
    id: "index-html",
    name: "index.html",
    language: "html",
    content: `<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Preview</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="./main.js"></script>
  </body>
</html>`,
  },
  {
    id: "main-js",
    name: "main.js",
    language: "javascript",
    content: `const root = document.getElementById("app");
if (root) {
  root.innerHTML = ` + '"' + `<h1>Welcome to your Replit Clone</h1>
  <p>Edit files on the left and click Run.</p>` + '"' + `;
}`,
  },
  {
    id: "styles-css",
    name: "styles.css",
    language: "css",
    content: `:root {
  font-family: "Space Grotesk", "Segoe UI", sans-serif;
}

body {
  margin: 0;
  background: radial-gradient(circle at top right, #f8ffcf 0%, #d4f3ff 45%, #f4f6fb 100%);
  min-height: 100vh;
  color: #14213d;
}

h1 {
  margin: 2rem 0 0.5rem;
  font-size: 2rem;
}

p {
  font-size: 1rem;
}
`,
  },
];

function buildPreviewDocument(files: ProjectFile[]): string {
  const html = files.find((file) => file.name === "index.html")?.content ?? "";
  const js = files.find((file) => file.name === "main.js")?.content ?? "";
  const css = files.find((file) => file.name === "styles.css")?.content ?? "";

  const fallbackHtml = `<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Preview</title>
  </head>
  <body>
    <div id="app"></div>
  </body>
</html>`;

  const sourceHtml = html.trim() ? html : fallbackHtml;
  const withoutExternalMain = sourceHtml.replace(
    /<script[^>]*src=["']\.\/main\.js["'][^>]*><\/script>/gi,
    ""
  );

  const withStyles = withoutExternalMain.includes("</head>")
    ? withoutExternalMain.replace("</head>", `<style>${css}</style></head>`)
    : `<style>${css}</style>${withoutExternalMain}`;

  const safeRunner = `<script>
(() => {
  const ensureRoot = () => {
    let root = document.getElementById("app");
    if (!root) {
      root = document.createElement("div");
      root.id = "app";
      document.body.appendChild(root);
    }
    return root;
  };

  try {
    const userCode = ${JSON.stringify(js)};
    const run = new Function(userCode);
    run();

    const root = ensureRoot();
    if (!root.innerHTML.trim()) {
      root.innerHTML = "<h1>Preview ready</h1><p>Your script ran, but did not render anything yet.</p>";
    }
  } catch (error) {
    const root = ensureRoot();
    const msg = error instanceof Error ? error.message : String(error);
    root.innerHTML = '<pre style="margin:0;padding:16px;color:#b00020;background:#fff3f4;font-family:Consolas,monospace;">Preview error: ' + msg + '</pre>';
  }
})();
</script>`;

  return withStyles.includes("</body>")
    ? withStyles.replace("</body>", `${safeRunner}</body>`)
    : `${withStyles}${safeRunner}`;
}

export default function App() {
  const [files, setFiles] = useState<ProjectFile[]>(starterFiles);
  const [activeFileId, setActiveFileId] = useState<string>(starterFiles[1].id);
  const [consoleLog, setConsoleLog] = useState<string[]>(["System ready. Press Run to refresh preview."]);
  const [previewHtml, setPreviewHtml] = useState<string>(buildPreviewDocument(starterFiles));

  const activeFile = useMemo(
    () => files.find((file) => file.id === activeFileId) ?? files[0],
    [files, activeFileId]
  );

  const handleEditorChange = (value: string | undefined) => {
    setFiles((current) =>
      current.map((file) =>
        file.id === activeFile.id
          ? {
              ...file,
              content: value ?? "",
            }
          : file
      )
    );
  };

  const runProject = () => {
    setPreviewHtml(buildPreviewDocument(files));
    setConsoleLog((previous) => [
      ...previous,
      `[${new Date().toLocaleTimeString()}] Build succeeded with ${files.length} files.`,
    ]);
  };

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">Replit Clone</div>
        <button className="runButton" onClick={runProject}>
          Run
        </button>
      </header>

      <main className="workspace">
        <aside className="sidebar">
          <h2>Files</h2>
          <ul>
            {files.map((file) => (
              <li key={file.id}>
                <button
                  className={file.id === activeFile.id ? "fileButton active" : "fileButton"}
                  onClick={() => setActiveFileId(file.id)}
                >
                  {file.name}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section className="editorPanel">
          <div className="panelTitle">{activeFile.name}</div>
          <Editor
            height="100%"
            theme="vs-dark"
            language={activeFile.language}
            value={activeFile.content}
            onChange={handleEditorChange}
            options={{
              fontSize: 14,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              wordWrap: "on",
            }}
          />
        </section>

        <section className="rightPanel">
          <div className="previewHeader">Preview</div>
          <iframe className="previewFrame" srcDoc={previewHtml} sandbox="allow-scripts" title="Preview" />
          <div className="consolePanel">
            <div className="consoleHeader">Console</div>
            <div className="consoleBody">
              {consoleLog.map((line, index) => (
                <p key={`${line}-${index}`}>{line}</p>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
