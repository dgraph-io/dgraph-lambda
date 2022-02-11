
export function parseScript(script: string) {
  try {
    const firstLine = script.split("\n", 1)[0];
    if (firstLine.startsWith("// ")) {
      return { ...JSON.parse(firstLine.substr(3)), script };
    }
  } catch (e) { }
  return { script };
}
