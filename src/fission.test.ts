import { parseScript } from "./fission-util";

describe(parseScript, () => {
  it("returns an empty map if there is nothing on the first line", async () => {
    const script = ``
    const contents = parseScript(script)
    expect(contents).toEqual({script: script})
  })

  it("returns an empty map if there is a map on the first line", async () => {
    const script = `{"foo":"bar"}`
    const contents = parseScript(script)
    expect(contents).toEqual({script: script})
  })

  it("returns an empty map if there is a regular comment on the first line", async () => {
    const script = `// A Comment Here`
    const contents = parseScript(script)
    expect(contents).toEqual({script: script})
  })

  it("returns an empty map if there is a trailing junk", async () => {
    const script = `// {"foo":"bar"} junk`
    const contents = parseScript(script)
    expect(contents).toEqual({script: script})
  })

  it("returns the map from the first line", async () => {
    const script = `// {"foo":"bar"}\nnext line`
    const contents = parseScript(script)
    expect(contents).toEqual({ script: script, "foo": "bar"})
  })
})
