'use client';

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useToast } from '@/context/ToastContext';
import { fileToBlob } from '@/lib/image';
import { translateError } from '@/lib/format';
import {
  deleteGuide,
  fetchAllGuides,
  saveGuide,
  slugify,
  uploadGuideImage,
  type GuideRow,
} from '@/services/guides';
import Button from '../ui/Button';
import Field from '../ui/Field';

interface Draft {
  id?: string;
  slug: string;
  title: string;
  excerpt: string;
  tag: string;
  coverImage: string | null;
  content: string;
  published: boolean;
}

const EMPTY: Draft = {
  slug: '',
  title: '',
  excerpt: '',
  tag: 'Energía',
  coverImage: null,
  content: '',
  published: false,
};

export default function GuidesTab() {
  const toast = useToast();
  const [guides, setGuides] = useState<GuideRow[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [coverBlob, setCoverBlob] = useState<Blob | null>(null);
  const [coverPreview, setCoverPreview] = useState('');
  const contentRef = useRef<HTMLTextAreaElement | null>(null);
  const inlineImageRef = useRef<HTMLInputElement | null>(null);
  const objectUrl = useRef<string | null>(null);

  const load = async () => {
    try {
      setGuides(await fetchAllGuides());
    } catch (err) {
      setError(translateError(err instanceof Error ? err.message : undefined));
    }
  };

  useEffect(() => {
    void load();
    return () => {
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    };
  }, []);

  const reset = () => {
    setDraft(null);
    setCoverBlob(null);
    setCoverPreview('');
    setError('');
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    objectUrl.current = null;
  };

  const startEdit = (row: GuideRow) => {
    setDraft({
      id: row.id,
      slug: row.slug,
      title: row.title,
      excerpt: row.excerpt,
      tag: row.tag,
      coverImage: row.cover_image,
      content: row.content,
      published: row.published,
    });
    setCoverPreview(row.cover_image ?? '');
    setCoverBlob(null);
    setError('');
  };

  const acceptCover = async (file?: File) => {
    if (!file) return;
    try {
      const nextBlob = await fileToBlob(file, 1600);
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
      objectUrl.current = URL.createObjectURL(nextBlob);
      setCoverBlob(nextBlob);
      setCoverPreview(objectUrl.current);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo leer la imagen.');
    }
  };

  /** Sube una imagen y la inserta como marcador [imagen] en la posición del cursor. */
  const insertInlineImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !draft) return;
    setBusy(true);
    try {
      const blob = await fileToBlob(file, 1400);
      const url = await uploadGuideImage(blob);
      const marker = `\n\n[imagen]${url}[/imagen]\n\n`;
      const area = contentRef.current;
      const pos = area?.selectionStart ?? draft.content.length;
      const next = draft.content.slice(0, pos) + marker + draft.content.slice(pos);
      setDraft({ ...draft, content: next });
      toast('Imagen insertada en la guía');
    } catch (err) {
      setError(translateError(err instanceof Error ? err.message : undefined));
    } finally {
      setBusy(false);
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft) return;
    setBusy(true);
    setError('');
    try {
      const coverImage = coverBlob ? await uploadGuideImage(coverBlob) : draft.coverImage;
      const slug = draft.slug.trim() || slugify(draft.title);
      if (!draft.title.trim()) throw new Error('La guía necesita un título.');
      if (!slug) throw new Error('No se pudo generar el slug (URL) de la guía.');
      await saveGuide({
        slug,
        title: draft.title.trim(),
        excerpt: draft.excerpt.trim(),
        tag: draft.tag.trim() || 'General',
        coverImage,
        content: draft.content,
        published: draft.published,
      }, draft.id);
      await load();
      reset();
      toast('Guía guardada');
    } catch (err) {
      setError(translateError(err instanceof Error ? err.message : undefined));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (row: GuideRow) => {
    if (!window.confirm(`¿Eliminar la guía "${row.title}"?`)) return;
    try {
      await deleteGuide(row.id);
      await load();
      toast('Guía eliminada');
    } catch (err) {
      setError(translateError(err instanceof Error ? err.message : undefined));
    }
  };

  return (
    <section className="panel">
      <div className="panel__head">
        <div>
          <h2>Guías y consejos</h2>
          <p className="muted">Artículos del blog público en /guias. Ayudan al SEO y atraen visitas desde Google.</p>
        </div>
        {!draft && <Button onClick={() => setDraft(EMPTY)}>+ Nueva guía</Button>}
      </div>

      {error && <p className="warn">{error}</p>}

      {draft ? (
        <form className="form" onSubmit={submit}>
          <Field label="Título" hint="Aparece en Google y en la cabecera del artículo.">
            <input
              className="input"
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value, slug: draft.id ? draft.slug : slugify(e.target.value) })}
              placeholder="Ej: Cómo elegir una estación de energía para los apagones"
              required
            />
          </Field>

          <Field label="Slug (URL)" hint="Se genera solo a partir del título. La guía quedará en /guias/slug.">
            <input
              className="input"
              value={draft.slug}
              onChange={(e) => setDraft({ ...draft, slug: slugify(e.target.value) })}
              placeholder="como-elegir-estacion-de-energia"
              required
            />
          </Field>

          <Field label="Resumen" hint="Texto corto para la tarjeta y la descripción en Google (máx. ~160 caracteres).">
            <textarea
              className="input"
              rows={2}
              value={draft.excerpt}
              onChange={(e) => setDraft({ ...draft, excerpt: e.target.value })}
              placeholder="Capacidad, potencia y qué equipos puedes mantener encendidos…"
            />
          </Field>

          <Field label="Etiqueta" hint="Categoría temática: Energía, Movilidad, Tecnología…">
            <input
              className="input"
              value={draft.tag}
              onChange={(e) => setDraft({ ...draft, tag: e.target.value })}
            />
          </Field>

          <Field label="Imagen de portada (opcional)">
            <input type="file" accept="image/*" onChange={(e) => void acceptCover(e.target.files?.[0])} />
            {coverPreview && <img src={coverPreview} alt="Portada" className="guide-cover-preview" />}
          </Field>

          <Field
            label="Contenido"
            hint={'Párrafos separados por línea en blanco. Marcadores: "## Título" para encabezados, "- item" para listas, "[boton]URL|Texto[/boton]" para botones. Usa el botón de abajo para insertar imágenes donde esté el cursor.'}
          >
            <textarea
              ref={contentRef}
              className="input guide-content"
              rows={14}
              value={draft.content}
              onChange={(e) => setDraft({ ...draft, content: e.target.value })}
              placeholder={'Escribe o pega aquí el texto de la guía…\n\n## Primer apartado\n\nTexto del apartado.\n\n- Punto uno\n- Punto dos'}
            />
          </Field>

          <div className="form__actions">
            <Button type="button" variant="ghost" disabled={busy} onClick={() => inlineImageRef.current?.click()}>
              🖼️ Insertar imagen en el texto
            </Button>
            <input ref={inlineImageRef} type="file" accept="image/*" hidden onChange={(e) => void insertInlineImage(e)} />
          </div>

          <label className="check">
            <input
              type="checkbox"
              checked={draft.published}
              onChange={(e) => setDraft({ ...draft, published: e.target.checked })}
            />
            Publicada (visible en la tienda y en Google)
          </label>

          <div className="form__actions">
            <Button type="submit" disabled={busy}>{busy ? 'Guardando…' : 'Guardar guía'}</Button>
            <Button type="button" variant="ghost" onClick={reset}>Cancelar</Button>
          </div>
        </form>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Título</th><th>Etiqueta</th><th>Estado</th><th>Fecha</th><th></th></tr>
            </thead>
            <tbody>
              {guides.map((row) => (
                <tr key={row.id}>
                  <td>
                    <b>{row.title}</b>
                    <br /><small className="muted">/guias/{row.slug}</small>
                  </td>
                  <td>{row.tag}</td>
                  <td>{row.published ? '✅ Publicada' : '📝 Borrador'}</td>
                  <td>{new Date(row.created_at).toLocaleDateString('es-CU')}</td>
                  <td className="table__actions">
                    {row.published && (
                      <a className="btn btn--ghost btn--sm" href={`/guias/${row.slug}`} target="_blank" rel="noreferrer">Ver</a>
                    )}
                    <Button variant="ghost" onClick={() => startEdit(row)}>Editar</Button>
                    <Button variant="ghost" className="danger-text" onClick={() => void remove(row)}>Eliminar</Button>
                  </td>
                </tr>
              ))}
              {!guides.length && (
                <tr><td colSpan={5} className="muted">Todavía no hay guías creadas desde el panel.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
