import MarkdownIt from 'markdown-it'
import matter from 'gray-matter'
import { ResolvedOptions } from './types'
import { toArray } from './utils'

const scriptSetupRE = /<\s*script[^>]*\bsetup\b[^>]*>([\s\S]*)<\/script>/mg

function extractScriptSetup(html: string) {
  const scripts: string[] = []
  html = html.replace(scriptSetupRE, (_, script) => {
    scripts.push(script)
    return ''
  })

  return { html, scripts }
}

export function createMarkdown(options: ResolvedOptions) {
  const markdown = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    ...options.markdownItOptions,
  })

  options.markdownItUses.forEach((e) => {
    const [plugin, options] = toArray(e)

    markdown.use(plugin, options)
  })

  options.markdownItSetup(markdown)

  return (id: string, raw: string) => {
    const { wrapperClasses, wrapperComponent, transforms, headEnabled, headField, frontmatterPreprocess } = options

    if (transforms.before)
      raw = transforms.before(raw, id)

    const { content: md, data } = matter(raw)
    const frontmatter = frontmatterPreprocess(data, options)

    let html = markdown.render(md, {})

    if (wrapperClasses)
      html = `<div class="${wrapperClasses}">${html}</div>`
    else
      html = `<div>${html}</div>`
    if (wrapperComponent)
      html = `<${wrapperComponent} :frontmatter="frontmatter">${html}</${wrapperComponent}>`
    if (transforms.after)
      html = transforms.after(html, id)

    const hoistScripts = extractScriptSetup(html)
    html = hoistScripts.html

    const scriptLines: string[] = []

    scriptLines.push(`const frontmatter = ${JSON.stringify(frontmatter)}`)
    if (headEnabled) {
      scriptLines.unshift('import { useHead } from "@vueuse/head"')
      const headGetter = headField === '' ? 'frontmatter' : `frontmatter["${headField}"]`
      scriptLines.push(`useHead(${headGetter})`)
    }

    scriptLines.push(...hoistScripts.scripts)

    const sfc = `<template>${html}</template>\n<script setup>${scriptLines.join('\n')}</script>`

    return sfc
  }
}
