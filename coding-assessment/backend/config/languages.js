// Judge0 CE language ids. Ids differ between Judge0 releases and hosted
// providers, so each one can be overridden from the environment
// (GET {JUDGE0_URL}/languages lists what your instance supports).
export const LANGUAGES = {
  python: {
    label: "Python 3",
    monaco: "python",
    judge0Id: Number(process.env.JUDGE0_LANG_PYTHON || 71),
  },
  javascript: {
    label: "JavaScript (Node.js)",
    monaco: "javascript",
    judge0Id: Number(process.env.JUDGE0_LANG_JAVASCRIPT || 63),
  },
  java: {
    label: "Java",
    monaco: "java",
    judge0Id: Number(process.env.JUDGE0_LANG_JAVA || 62),
  },
  cpp: {
    label: "C++ (GCC)",
    monaco: "cpp",
    judge0Id: Number(process.env.JUDGE0_LANG_CPP || 54),
  },
};

export const LANGUAGE_KEYS = Object.keys(LANGUAGES);

export function isSupportedLanguage(language) {
  return Object.hasOwn(LANGUAGES, language);
}
