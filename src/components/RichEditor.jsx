import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import { Bold, Italic, List, ListOrdered, Heading2, Heading3, Quote, Link as LinkIcon, Image as ImageIcon, Undo2, Redo2 } from 'lucide-react'

export default function RichEditor({ value, onChange }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' } }),
      Image,
    ],
    content: value || '',
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  })

  if (!editor) return null

  const setLink = () => {
    const prev = editor.getAttributes('link').href || ''
    const url = window.prompt('URL du lien (vide pour retirer) :', prev)
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  const addImage = () => {
    const url = window.prompt('URL de l\'image :')
    if (url) editor.chain().focus().setImage({ src: url }).run()
  }

  const btn = (active, onClick, title, Icon) => (
    <button
      type="button"
      className={`editor-btn ${active ? 'active' : ''}`}
      onClick={onClick}
      title={title}
      aria-label={title}
    >
      <Icon size={16} />
    </button>
  )

  return (
    <div className="rich-editor">
      <div className="editor-toolbar">
        {btn(editor.isActive('bold'), () => editor.chain().focus().toggleBold().run(), 'Gras', Bold)}
        {btn(editor.isActive('italic'), () => editor.chain().focus().toggleItalic().run(), 'Italique', Italic)}
        {btn(editor.isActive('heading', { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run(), 'Titre 2', Heading2)}
        {btn(editor.isActive('heading', { level: 3 }), () => editor.chain().focus().toggleHeading({ level: 3 }).run(), 'Titre 3', Heading3)}
        {btn(editor.isActive('bulletList'), () => editor.chain().focus().toggleBulletList().run(), 'Liste', List)}
        {btn(editor.isActive('orderedList'), () => editor.chain().focus().toggleOrderedList().run(), 'Liste numérotée', ListOrdered)}
        {btn(editor.isActive('blockquote'), () => editor.chain().focus().toggleBlockquote().run(), 'Citation', Quote)}
        {btn(editor.isActive('link'), setLink, 'Lien', LinkIcon)}
        {btn(false, addImage, 'Image', ImageIcon)}
        <span className="editor-spacer" />
        {btn(false, () => editor.chain().focus().undo().run(), 'Annuler', Undo2)}
        {btn(false, () => editor.chain().focus().redo().run(), 'Rétablir', Redo2)}
      </div>
      <EditorContent editor={editor} className="editor-content" />
    </div>
  )
}
