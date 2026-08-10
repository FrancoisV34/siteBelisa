import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import ImageUpload from '../../components/ImageUpload.jsx'
import SeoFields from '../../components/SeoFields.jsx'

export default function OeuvreEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = !id

  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({
    title: '', slug: '', year: '', technique: '', dimensions: '', description: '',
    image_url: '', book_url: '', ebook_url: '', isbn: '', status: 'visible',
    meta_description: '', og_image: '', image_alt: '',
  })

  useEffect(() => {
    if (isNew) return
    fetch(`/api/admin/oeuvres/${id}`, { credentials: 'include' })
      .then((r) => r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status)))
      .then((d) => setForm({
        title: d.oeuvre.title || '',
        slug: d.oeuvre.slug || '',
        year: d.oeuvre.year || '',
        technique: d.oeuvre.technique || '',
        dimensions: d.oeuvre.dimensions || '',
        description: d.oeuvre.description || '',
        image_url: d.oeuvre.image_url || '',
        book_url: d.oeuvre.book_url || '',
        ebook_url: d.oeuvre.ebook_url || '',
        isbn: d.oeuvre.isbn || '',
        meta_description: d.oeuvre.meta_description || '',
        og_image: d.oeuvre.og_image || '',
        image_alt: d.oeuvre.image_alt || '',
        status: d.oeuvre.status || 'visible',
      }))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [id, isNew])

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }))
  const onInput = (k) => (e) => set(k)(e.target.value)

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      const r = await fetch(isNew ? '/api/admin/oeuvres' : `/api/admin/oeuvres/${id}`, {
        method: isNew ? 'POST' : 'PATCH',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(form),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Erreur')
      navigate('/admin/oeuvres')
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!window.confirm('Supprimer cette œuvre ?')) return
    await fetch(`/api/admin/oeuvres/${id}`, { method: 'DELETE', credentials: 'include' })
    navigate('/admin/oeuvres')
  }

  if (loading) return <p>Chargement…</p>

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <h1>{isNew ? 'Nouvelle œuvre' : 'Éditer l\'œuvre'}</h1>
        <div className="admin-page-actions">
          {!isNew && <button className="btn btn-secondary" onClick={remove}>Supprimer</button>}
          <button className="btn btn-secondary" onClick={() => navigate('/admin/oeuvres')}>Annuler</button>
          <button className="btn btn-primary" onClick={save} disabled={saving || !form.title}>
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </header>
      {error && <p className="auth-error">{error}</p>}

      <div className="admin-form">
        <label>
          <span>Titre</span>
          <input type="text" value={form.title} onChange={onInput('title')} required maxLength={200} />
        </label>
        <div className="admin-form-row">
          <label style={{ flex: 1 }}>
            <span>Année</span>
            <input type="number" value={form.year} onChange={onInput('year')} placeholder="2023" />
          </label>
          <label style={{ flex: 2 }}>
            <span>Technique</span>
            <input type="text" value={form.technique} onChange={onInput('technique')} placeholder="Huile sur toile" maxLength={200} />
          </label>
          <label style={{ flex: 2 }}>
            <span>Dimensions</span>
            <input type="text" value={form.dimensions} onChange={onInput('dimensions')} placeholder="120 × 80 cm" maxLength={100} />
          </label>
        </div>
        <ImageUpload value={form.image_url} onChange={set('image_url')} label="Image de l'œuvre" />
        <label>
          <span>Description</span>
          <textarea value={form.description} onChange={onInput('description')} rows={4} maxLength={2000} />
        </label>
        <label>
          <span>Lien livre (URL externe)</span>
          <input type="url" value={form.book_url} onChange={onInput('book_url')} placeholder="https://…" maxLength={500} />
        </label>
        <label>
          <span>Lien ebook (URL externe)</span>
          <input type="url" value={form.ebook_url} onChange={onInput('ebook_url')} placeholder="https://…" maxLength={500} />
        </label>
        <label>
          <span>ISBN</span>
          <input type="text" value={form.isbn} onChange={onInput('isbn')} placeholder="978-2-1234-5680-3" maxLength={20} />
          <small className="admin-hint">
            Permet à Google de relier cette page à l'édition réelle du livre.
          </small>
        </label>
        <label>
          <span>Adresse de la page</span>
          <input
            type="text"
            value={form.slug}
            onChange={onInput('slug')}
            placeholder={isNew ? 'généré depuis le titre' : ''}
            maxLength={80}
          />
          <small className="admin-hint">
            {form.slug
              ? `Adresse : /oeuvres/${form.slug}.`
              : 'Laissez vide pour générer automatiquement depuis le titre.'}
            {!isNew && form.slug && ' La modifier casse les liens existants vers cette page.'}
          </small>
        </label>
        <SeoFields
          value={form}
          onChange={setForm}
          canonicalPath={`/oeuvres/${form.slug || '…'}`}
          fallbacks={{
            title: form.title,
            description: form.description,
            image: form.image_url,
            imageAlt: form.title ? `Couverture de « ${form.title} »` : '',
          }}
        />
        <label>
          <span>Statut</span>
          <select value={form.status} onChange={onInput('status')}>
            <option value="visible">Visible</option>
            <option value="hidden">Masquée</option>
          </select>
        </label>
      </div>

      <div className="admin-page-actions" style={{ marginTop: '2rem', justifyContent: 'flex-end' }}>
        {!isNew && <button className="btn btn-secondary" onClick={remove}>Supprimer</button>}
        <button className="btn btn-secondary" onClick={() => navigate('/admin/oeuvres')}>Annuler</button>
        <button className="btn btn-primary" onClick={save} disabled={saving || !form.title}>
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </div>
  )
}
