import { UserConfig } from 'vite'
import Vue from '@vitejs/plugin-vue'
import Markdown from 'vite-plugin-md'
import prism from 'markdown-it-prism'

const config: UserConfig = {
  plugins: [
    Vue({
      include: [/\.vue$/, /\.md$/],
    }),
    Markdown({
      headEnabled: true,
      markdownItUses: [
        prism,
      ],
    }),
  ],
}

export default config
