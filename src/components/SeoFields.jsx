import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import ImageUpload from './ImageUpload.jsx'

// Google truncates around these lengths. They are guidance, not validation:
// a description slightly over is fine, one at 300 characters is not.
const TITLE_MAX = 60
const DESC_MIN = 70
const DESC_MAX = 160

// Mirrors the server-side truncation in functions/_lib/seo.js so the preview
// matches what actually gets published.
function truncateAt(text, max) {
  const clean = String(text ?? '').trim()
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max - 1)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd() + '…'
}

function Counter({ value, min, max }) {
  const n = value.length
  const state = n === 0 ? 'empty' : n > max ? 'over' : n < min ? 'short' : 'ok'
  const label = {
    empty: 'généré automatiquement',
    short: 'un peu court',
    ok: 'bonne longueur',
    over: 'sera tronqué par Google',
  }[state]

  return (
    <span className={`seo-counter seo-counter-${state}`}>
      {n}/{max} — {label}
    </span>
  )
}

/**
 * Shared "Référencement" block for the post and oeuvre editors.
 *
 * `fallbacks` carries what the server would derive on its own when a field is
 * left empty, so the previews show the page as it will actually appear rather
 * than an empty placeholder.
 */
export default function SeoFields({ value, onChange, fallbacks, canonicalPath }) {
  const [open, setOpen] = useState(false)

  const set = (k) => (v) => onChange({ ...value, [k]: v })
  const onInput = (k) => (e) => set(k)(e.target.value)

  const effectiveTitle = fallbacks.title || 'Titre de la page'
  const effectiveDesc = value.meta_description || fallbacks.description || ''
  const effectiveImage = value.og_image || fallbacks.image || ''

  // The placeholder shows what the server would actually publish, which is the
  // truncated form — showing the untruncated source would overflow the field
  // and misrepresent the result.
  const derivedPlaceholder = fallbacks.description
    ? truncateAt(fallbacks.description, DESC_MAX)
    : 'Résumé affiché sous le titre dans les résultats de recherche.'

  return (
    <section className="seo-fields">
      <button
        type="button"
        className="seo-fields-toggle"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        <span>Référencement</span>
        <small>
          {value.meta_description ? 'Personnalisé' : 'Généré automatiquement'}
        </small>
      </button>

      {open && (
        <div className="seo-fields-body">
          <label>
            <span>Description pour Google</span>
            <textarea
              value={value.meta_description || ''}
              onChange={onInput('meta_description')}
              rows={3}
              maxLength={300}
              placeholder={derivedPlaceholder}
            />
            <Counter value={value.meta_description || ''} min={DESC_MIN} max={DESC_MAX} />
            <small className="admin-hint">
              Laissez vide pour reprendre automatiquement le début du texte.
            </small>
          </label>

          <label>
            <span>Description de l'image</span>
            <input
              type="text"
              value={value.image_alt || ''}
              onChange={onInput('image_alt')}
              maxLength={200}
              placeholder={fallbacks.imageAlt || ''}
            />
            <small className="admin-hint">
              Lue par les moteurs et par les lecteurs d'écran. Décrivez ce que
              l'on voit, sans répéter le titre.
            </small>
          </label>

          <ImageUpload
            value={value.og_image || ''}
            onChange={set('og_image')}
            label="Image de partage (réseaux sociaux)"
          />
          <small className="admin-hint">
            Utilisée sur Facebook, WhatsApp et LinkedIn. Sans image dédiée,
            l'image principale est reprise.
          </small>

          <div className="seo-previews">
            <div className="seo-preview">
              <span className="seo-preview-label">Aperçu Google</span>
              <div className="seo-preview-google">
                <span className="seo-preview-url">
                  belisa-wagner.fr{canonicalPath}
                </span>
                <span className="seo-preview-title">{effectiveTitle}</span>
                <span className="seo-preview-desc">
                  {effectiveDesc.length > DESC_MAX
                    ? effectiveDesc.slice(0, DESC_MAX - 1) + '…'
                    : effectiveDesc || 'Aucune description disponible.'}
                </span>
              </div>
            </div>

            <div className="seo-preview">
              <span className="seo-preview-label">Aperçu Facebook</span>
              <div className="seo-preview-social">
                {effectiveImage ? (
                  <img src={effectiveImage} alt="" />
                ) : (
                  <div className="seo-preview-noimage">Aucune image</div>
                )}
                <div className="seo-preview-social-text">
                  <span className="seo-preview-domain">BELISA-WAGNER.FR</span>
                  <span className="seo-preview-title">{effectiveTitle}</span>
                  <span className="seo-preview-desc">{effectiveDesc}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export { TITLE_MAX, DESC_MIN, DESC_MAX }
