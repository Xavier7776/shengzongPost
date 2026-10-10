import { describe, expect, it } from 'vitest'
import { Editor, mergeAttributes } from '@tiptap/core'
import { Schema, DOMSerializer, type Slice } from '@tiptap/pm/model'
import { EditorState } from '@tiptap/pm/state'
import { EditorView } from '@tiptap/pm/view'
import { buildExtensions } from '@/features/editor/extensions'

describe('patched editor dependency trust boundaries', () => {
  it('does not turn an own __proto__ attribute into inherited DOM attributes', () => {
    const input = JSON.parse('{"__proto__":{"src":"https://attacker.invalid/x","onerror":"window.__editorXss=true"},"class":"safe"}')
    const attributes = mergeAttributes(input)
    const node = DOMSerializer.renderSpec(document, ['div', attributes]).dom as HTMLElement
    expect(Object.getPrototypeOf(attributes)).toBe(Object.prototype)
    expect(node.className).toBe('safe')
    expect(node.hasAttribute('src')).toBe(false)
    expect(node.hasAttribute('onerror')).toBe(false)
    expect(Object.prototype).not.toHaveProperty('onerror')
  })

  it('validates clipboard slice-context attributes before restoring their nodes', () => {
    const schema = new Schema({ nodes: {
      doc: { content: 'block+' },
      text: { group: 'inline' },
      paragraph: { group: 'block', content: 'inline*', parseDOM: [{ tag: 'p' }], toDOM: () => ['p', 0] },
      wrapper: {
        group: 'block', content: 'block+',
        attrs: { label: { default: '', validate: 'string' } },
        toDOM: node => ['section', ['span', node.attrs.label], ['div', 0]],
      },
    } })
    const host = document.createElement('div')
    document.body.append(host)
    let parsed: Slice | undefined
    const view = new EditorView(host, {
      state: EditorState.create({ schema }),
      handlePaste: (_view, _event, slice) => { parsed = slice; return false },
    })
    const clipboard = (label: unknown) => {
      const p = document.createElement('p')
      p.textContent = 'Pasted text'
      p.setAttribute('data-pm-slice', `1 1 ${JSON.stringify(['wrapper', { label }])}`)
      return p.outerHTML
    }
    try {
      const paste = new Event('paste') as ClipboardEvent
      expect(view.pasteHTML(clipboard(['img', { src: 'invalid', onerror: 'window.__editorXss=true' }]), paste)).toBe(true)
      expect(view.state.doc.textContent).toBe('Pasted text')
      expect(host.querySelector('[onerror]')).toBeNull()
      expect(host.querySelector('section')).toBeNull()
      expect(parsed?.content.firstChild?.type.name).toBe('paragraph')
      view.updateState(EditorState.create({ schema }))
      expect(view.pasteHTML(clipboard('Safe label'), paste)).toBe(true)
      expect(parsed?.content.firstChild?.type.name).toBe('wrapper')
      expect(parsed?.content.firstChild?.attrs.label).toBe('Safe label')
      expect(view.state.doc.textContent).toBe('Pasted text')
    } finally {
      view.destroy()
      host.remove()
    }
  })

  it('preserves the shared editor schema for headings, code, tables, links and video', () => {
    const editor = new Editor({ extensions: buildExtensions('Write here'), content: '<h2>Heading</h2><p><a href="https://example.com">Link</a></p><pre><code class="language-javascript">const value = 1</code></pre><table><tbody><tr><th>Key</th><td>Value</td></tr></tbody></table>' })
    try {
      expect(editor.getHTML()).toContain('<h2>Heading</h2>')
      expect(editor.getHTML()).toContain('href="https://example.com"')
      expect(editor.getHTML()).toContain('language-javascript')
      expect(editor.getHTML()).toContain('<table')
      editor.commands.insertContent({ type: 'videoEmbed', attrs: { src: 'https://youtu.be/dQw4w9WgXcQ', provider: 'youtube' } })
      expect(editor.getHTML()).toContain('https://www.youtube.com/embed/dQw4w9WgXcQ')
      expect(editor.getHTML()).not.toContain('onerror=')
    } finally {
      editor.destroy()
    }
  })
})
