<template>
  <div class="markdown-content" v-html="renderedContent"></div>
</template>

<script>
import DOMPurify from 'dompurify'
import { marked } from 'marked'

marked.setOptions({
  breaks: true,
  gfm: true,
})

export default {
  name: 'MarkdownContent',
  props: {
    content: {
      type: String,
      default: '',
    },
  },
  computed: {
    renderedContent() {
      const renderedMarkdown = marked.parse(this.content || '')
      return DOMPurify.sanitize(renderedMarkdown)
    },
  },
}
</script>
