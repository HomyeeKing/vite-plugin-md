import MarkdownIt from 'markdown-it'
import { SourceMapGenerator, RawSourceMap } from 'source-map'

const splitRE = /\r?\n/g
const emptyRE = /^(?:\/\/)?\s*$/
const scriptRe = /(<!--)?\s*<\/?script\b[^>]*>(-->)?/g

export function extractScriptTag(md: string) {
  const lines = md.split(splitRE)
  const tag = []
  for (let i = 0, len = lines.length; i < len; i++) {
    if (scriptRe.test(lines[i]))
      tag.push(lines[i])
  }

  return tag
}

export function generateSourceMap(
  filename: string,
  source: string,
  generated: string,
  markdownInstance: MarkdownIt,
): RawSourceMap {
  const map = new SourceMapGenerator({
    file: filename.replace(/\\/g, '/'),
    sourceRoot: '',
  })
  map.setSourceContent(filename, source)

  const contentLineMap = new Map<string, number>()
  let countSR = 0
  let countGE = 0
  let prevGE = ''
  const generatedArr = generated.split(splitRE)
  const originalArr = source.split(splitRE)

  for (let i = 0, len = generatedArr.length; i < len; i++) {
    if (!emptyRE.test(generatedArr[i])) prevGE = generatedArr[i]
    else break
  }

  originalArr.forEach((line, index) => {
    if (line && !emptyRE.test(line)) {
      const renderedLine = markdownInstance.render(line).trim()
      if (!contentLineMap.has(renderedLine)) {
        countSR = 0
        contentLineMap.set(renderedLine, index + 1)
      }
      else {
        contentLineMap.set(renderedLine + countSR++, index + 1)
      }
    }
  })

  generatedArr.forEach((line, index) => {
    if (line && !emptyRE.test(line)) {
      const renderedLine = markdownInstance.render(line).trim()
      let originalLine = index + 1
      if (prevGE === line) {
        originalLine = contentLineMap.get(renderedLine + countGE++) || originalLine
      }
      else {
        countGE = 0
        originalLine = contentLineMap.get(renderedLine) || originalLine
      }

      prevGE = line
      const generatedLine = index + 1

      console.log(line, generatedLine, originalLine)

      for (let i = 0, len = line.length; i < len; i++) {
        if (!/\s/.test(line[i])) {
          map.addMapping({
            source: filename,
            original: {
              line: originalLine,
              column: i,
            },
            generated: {
              line: generatedLine,
              column: i,
            },
          })
        }
      }
    }
  })

  return JSON.parse(map.toString())
}