'use client';

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useToast } from '@/context/ToastContext';
import { useStore } from '@/context/StoreContext';
import { fileToBlob } from '@/lib/image';
import { translateError } from '@/lib/format';
import { categoryPath, productPath } from '@/lib/slugs';
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
  const { categories, products, loading: catalogLoading } = useStore();
  const [guides, setGuides] = useState<GuideRow[]>([]);
  const [loadingGuides, setLoadingGuides] = useState(true);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [coverBlob, setCoverBlob] = useState<Blob | null>(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [guideSearch, setGuideSearch] = useState('');
  const [targetType, setTargetType] = useState<'category' | 'product'>('category');
  const [targetSearch, setTargetSearch] = useState('');
  const [selectedTargetId, setSelectedTargetId] = useState('');
  const [buttonLabel, setButtonLabel] = useState('');
  const contentRef = useRef<HTMLTextAreaElement | null>(null);
  const inlineImageRef = useRef<HTMLInputElement | null>(null);
  const objectUrl = useRef<string | null>(null);

  const sortedCategories = [...categories].sort((firstCategory, secondCategory) => firstCategory.sortOrder - secondCategory.sortOrder || firstCategory.name.localeCompare(secondCategory.name, 'es'));
  const visibleProducts = products.filter((product) => product.visible).sort((firstProduct, secondProduct) => firstProduct.name.localeCompare(secondProduct.name, 'es'));
  const catalogTargets = targetType === 'category'
    ? sortedCategories.map((category) => ({
      id: category.id,
      name: category.name,
      path: categoryPath(category),
      group: category.parentId ? categories.find((item) => item.id === category.parentId)?.name ?? 'Subcategorías' : 'Categorías principales',
    }))
    : visibleProducts.map((product) => ({
      id: product.id,
      name: product.name,
      path: productPath(product),
      group: categories.find((category) => category.id === product.categoryId)?.name ?? 'Sin categoría',
    }));
  const filteredTargets = catalogTargets.filter((target) => `${target.name} ${target.group}`.toLocaleLowerCase('es').includes(targetSearch.trim().toLocaleLowerCase('es')));
  const targetGroups = new Map<string, typeof filteredTargets>();
  filteredTargets.forEach((target) => targetGroups.set(target.group, [...(targetGroups.get(target.group) ?? []), target]));
  const selectedTarget = catalogTargets.find((target) => target.id === selectedTargetId);
  const filteredGuides = guides.filter((guide) => `${guide.title} ${guide.slug} ${guide.tag}`.toLocaleLowerCase('es').includes(guideSearch.trim().toLocaleLowerCase('es')));

  const load = async () => {
    setLoadingGuides(true);
    try {
      setGuides(await fetchAllGuides());
    } catch (err) {
      setError(translateError(err instanceof Error ? err.message : undefined));
    } finally {
      setLoadingGuides(false);
    }
  };

  useEffect(() => {
    let active = true;
    fetchAllGuides()
      .then((rows) => active && setGuides(rows))
      .catch((err) => active && setError(translateError(err instanceof Error ? err.message : undefined)))
      .finally(() => active && setLoadingGuides(false));
    return () => {
      active = false;
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    };
  }, []);

  const reset = () => {
    setDraft(null);
    setCoverBlob(null);
    setCoverPreview('');
    setError('');
    setTargetType('category');
    setTargetSearch('');
    setSelectedTargetId('');
    setButtonLabel('');
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
    setTargetType('category');
    setTargetSearch('');
    setSelectedTargetId('');
    setButtonLabel('');
  };

  const insertSuggestedButton = () => {
    if (!draft || !selectedTarget) return;
    const label = (buttonLabel.trim() || `Ver ${selectedTarget.name}`).replace(/[|\r\n]+/g, ' ').trim();
    const content = draft.content.trimEnd();
    const marker = `[boton]${selectedTarget.path}|${label}[/boton]`;
    setDraft({ ...draft, content: content ? `${content}\n\n${marker}` : marker });
    toast('Enlace sugerido añadido al final de la guía');
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
      <div className="panel__head guide-admin__head">
        <div>
          <h2>Guías y consejos</h2>
          <p className="muted">Gestiona las guías públicas, su contenido y el destino recomendado al final de cada artículo.</p>
        </div>
        {!draft && <Button onClick={() => setDraft(EMPTY)}>+ Nueva guía</Button>}
      </div>

      {error && <p className="warn">{error}</p>}

      {draft ? (
        <form className="form guide-editor" onSubmit={submit}>
          <section className="guide-editor__section">
            <div className="guide-editor__section-head"><div><span className="eyebrow">01 · PUBLICACIÓN</span><h3>Identidad y SEO</h3></div><p>Título, dirección y resumen que verá Google.</p></div>
            <div className="guide-editor__fields">
              <Field label="Título" hint="Aparece en Google y en la cabecera del artículo.">
                <input
                  className="input"
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value, slug: draft.id ? draft.slug : slugify(e.target.value) })}
                  placeholder="Ej: Cómo elegir una estación de energía para los apagones"
                  required
                />
              </Field>
              <Field label="Slug (URL)" hint="La guía quedará en /guias/slug.">
                <input className="input" value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: slugify(e.target.value) })} placeholder="como-elegir-estacion-de-energia" required />
              </Field>
              <Field label="Resumen" hint="Aparece en la tarjeta y en Google.">
                <textarea className="input" rows={2} value={draft.excerpt} onChange={(e) => setDraft({ ...draft, excerpt: e.target.value })} placeholder="Capacidad, potencia y qué equipos puedes mantener encendidos…" />
              </Field>
              <Field label="Etiqueta temática" hint="Por ejemplo: Energía, Movilidad o Tecnología.">
                <input className="input" value={draft.tag} onChange={(e) => setDraft({ ...draft, tag: e.target.value })} />
              </Field>
            </div>
          </section>

          <section className="guide-editor__section">
            <div className="guide-editor__section-head"><div><span className="eyebrow">02 · PRESENTACIÓN</span><h3>Imagen de portada</h3></div><p>Opcional. Se muestra en la tarjeta y al abrir la guía.</p></div>
            <Field label="Seleccionar imagen">
              <input type="file" accept="image/*" onChange={(e) => void acceptCover(e.target.files?.[0])} />
              {coverPreview && <img src={coverPreview} alt="Vista previa de portada" className="guide-cover-preview" />}
            </Field>
          </section>

          <section className="guide-editor__section">
            <div className="guide-editor__section-head"><div><span className="eyebrow">03 · CONTENIDO</span><h3>Información de la guía</h3></div><p>El enlace sugerido se colocará después de este contenido.</p></div>
            <Field label="Contenido" hint="Markdown: ## títulos, listas, **negritas**, [enlaces](url) e imágenes ![descripción](url).">
              <textarea
                ref={contentRef}
                className="input guide-content"
                rows={16}
                value={draft.content}
                onChange={(e) => setDraft({ ...draft, content: e.target.value })}
                placeholder={'Escribe o pega aquí el texto de la guía…\n\n## Primer apartado\n\nTexto del apartado.\n\n- Punto uno\n- Punto dos'}
              />
            </Field>

            <div className="guide-link-builder">
              <div className="guide-link-builder__head"><span className="guide-link-builder__icon" aria-hidden="true">↳</span><div><h4>Destino recomendado</h4><p>Agrega un botón al final para llevar al lector a una categoría o producto.</p></div></div>
              <div className="guide-link-builder__controls">
                <Field label="Tipo de destino">
                  <select className="input input--select guide-link-builder__type" value={targetType} onChange={(event) => { setTargetType(event.target.value as 'category' | 'product'); setSelectedTargetId(''); setButtonLabel(''); setTargetSearch(''); }}>
                    <option value="category">Categoría</option>
                    <option value="product">Producto</option>
                  </select>
                </Field>
                <Field label="Buscar destino">
                  <input className="input" type="search" value={targetSearch} onChange={(event) => setTargetSearch(event.target.value)} placeholder={targetType === 'category' ? 'Buscar categoría…' : 'Buscar producto…'} />
                </Field>
                <Field label="Seleccionar destino" hint={catalogLoading ? 'Cargando catálogo…' : `${filteredTargets.length} opciones`}>
                  <select className="input guide-link-builder__list" size={6} value={selectedTargetId} onChange={(event) => { const target = catalogTargets.find((item) => item.id === event.target.value); setSelectedTargetId(event.target.value); setButtonLabel(target ? `Ver ${target.name}` : ''); }} disabled={catalogLoading || !filteredTargets.length} aria-label="Destinos disponibles">
                    {[...targetGroups.entries()].map(([group, targets]) => (
                      <optgroup key={group} label={group}>
                        {targets.map((target) => <option key={target.id} value={target.id}>{target.name}</option>)}
                      </optgroup>
                    ))}
                    {!filteredTargets.length && <option value="" disabled>{catalogLoading ? 'Cargando opciones…' : 'No hay resultados'}</option>}
                  </select>
                </Field>
                <Field label="Texto del botón">
                  <input className="input" value={buttonLabel} onChange={(event) => setButtonLabel(event.target.value)} placeholder={selectedTarget ? `Ver ${selectedTarget.name}` : 'Selecciona un destino'} disabled={!selectedTarget} />
                </Field>
              </div>
              <div className="guide-link-builder__footer">
                <span className="muted">{selectedTarget ? `Destino: ${selectedTarget.path}` : 'Elige una opción de la lista desplazable.'}</span>
                <Button type="button" size="sm" disabled={!selectedTarget || busy} onClick={insertSuggestedButton}>＋ Añadir botón al final</Button>
              </div>
            </div>

            <div className="guide-editor__image-action">
              <Button type="button" variant="ghost" disabled={busy} onClick={() => inlineImageRef.current?.click()}>🖼️ Insertar imagen en el texto</Button>
              <input ref={inlineImageRef} type="file" accept="image/*" hidden onChange={(e) => void insertInlineImage(e)} />
            </div>
          </section>

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
        <div className="guide-admin-list">
          <div className="guide-admin-list__top">
            <div><h3>Biblioteca de guías</h3><p className="muted">{loadingGuides ? 'Cargando guías…' : `${guides.filter((guide) => guide.published).length} publicadas · ${guides.filter((guide) => !guide.published).length} borradores`}</p></div>
            <input className="input guide-admin-list__search" type="search" value={guideSearch} onChange={(event) => setGuideSearch(event.target.value)} placeholder="Buscar por título o etiqueta…" aria-label="Buscar guías" />
          </div>
          <div className="guide-admin-list__items">
            {loadingGuides ? <div className="guide-admin-list__empty" aria-live="polite">Cargando guías…</div> : filteredGuides.map((row) => (
              <article className="guide-admin-row" key={row.id}>
                <div className="guide-admin-row__main">
                  <div className="guide-admin-row__title"><strong>{row.title}</strong><span className={`guide-admin-row__status${row.published ? ' is-published' : ''}`}>{row.published ? 'Publicada' : 'Borrador'}</span></div>
                  <span className="guide-admin-row__url">/guias/{row.slug}</span>
                  <span className="guide-admin-row__meta">{row.tag} · {new Date(row.created_at).toLocaleDateString('es-CU')}</span>
                </div>
                <div className="guide-admin-row__actions">
                  {row.published && <a className="btn btn--ghost btn--sm" href={`/guias/${row.slug}`} target="_blank" rel="noreferrer">Ver guía ↗</a>}
                  <Button variant="ghost" size="sm" onClick={() => startEdit(row)}>Editar</Button>
                  <Button variant="ghost" size="sm" className="danger-text" onClick={() => void remove(row)}>Eliminar</Button>
                </div>
              </article>
            ))}
            {!loadingGuides && !filteredGuides.length && <div className="guide-admin-list__empty">{guides.length ? 'No hay guías que coincidan con la búsqueda.' : 'Todavía no hay guías creadas desde el panel.'}</div>}
          </div>
        </div>
      )}
    </section>
  );
}
