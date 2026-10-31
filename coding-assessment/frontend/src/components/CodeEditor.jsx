import { useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";

const MONACO_LANGUAGE = { python: "python", javascript: "javascript", java: "java", cpp: "cpp" };

/**
 * Monaco editor. `path` gives each challenge+language its own model, so undo
 * history and cursor position survive switching back and forth.
 */
export default function CodeEditor({ path, language, value, onChange, highlightLines = [], readOnly = false }) {
  const editorRef = useRef(null);
  const decorationsRef = useRef(null);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    decorationsRef.current?.clear();
    decorationsRef.current = editor.createDecorationsCollection(
      highlightLines.map((line) => ({
        range: { startLineNumber: line, startColumn: 1, endLineNumber: line, endColumn: 1 },
        options: { isWholeLine: true, className: "editor-hint-line", glyphMarginClassName: "editor-hint-glyph" },
      })),
    );
  }, [highlightLines, path]);

  return (
    <Editor
      path={path}
      language={MONACO_LANGUAGE[language] ?? "plaintext"}
      value={value}
      theme="vs-dark"
      onChange={(next) => onChange(next ?? "")}
      onMount={(editor) => {
        editorRef.current = editor;
      }}
      options={{
        readOnly,
        fontSize: 14,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: language === "python" ? 4 : 2,
        glyphMargin: true,
      }}
    />
  );
}
