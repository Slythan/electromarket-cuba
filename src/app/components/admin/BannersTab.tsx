'use client';

import { useEffect, useRef, useState, type ChangeEvent, type CSSProperties, type DragEvent, type FormEvent } from 'react';
import { useStore } from '@/context/StoreContext';
import { useToast } from '@/context/ToastContext';
import { fileToBlob } from '@/lib/image';
import { translateError } from '@/lib/format';
import { deleteBanner, fetchAllBanners, removeBannerImage, saveBanner, uploadBannerImage } from '@/services/banners';
import type { Banner } from '@/lib/types';
import Button from '../ui/Button';
import Field from '../ui/Field';
import Thumb from '../ui/thumb';

export default function BannersTab() {
  const { reloadBanners } = useStore();
  const toast = useToast();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState('');
  const [blob, setBlob] = useState<Blob | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [draftStyle, setDraftStyle] = useState({ titleColor: '#ffffff', subtitleColor: '#a9bdd8', accentColor: '#00d5f5', fontFamily: 'display' as Banner['fontFamily'] });
  const objectUrl = useRef<string | null>(null);

  const load = async () => {
    try {
      setBanners(await fetchAllBanners());
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
    setEditing(null);
    setPreview('');
    setBlob(null);
    setError('');
    setDraftStyle({ titleColor: '#ffffff', subtitleColor: '#a9bdd8', accentColor: '#00d5f5', fontFamily: 'display' });
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    objectUrl.current = null;
  };

  const acceptFile = async (file?: File) => {
    if (!file) return;
    try {
      const nextBlob = await fileToBlob(file, 1600);
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
      objectUrl.current = URL.createObjectURL(nextBlob);
      setBlob(nextBlob);
      setPreview(objectUrl.current);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo leer la imagen.');
    }
  };

  const onFile = (event: ChangeEvent<HTMLInputElement>) => {
    void acceptFile(event.target.files?.[0]);
  };

  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragActive(false);
    void acceptFile(event.dataTransfer.files?.[0]);
  };

  const edit = (banner: Banner) => {
    setEditing(banner);
    setPreview(banner.imageUrl);
    setBlob(null);
    setError('');
    setDraftStyle({ titleColor: banner.titleColor, subtitleColor: banner.subtitleColor, accentColor: banner.accentColor, fontFamily: banner.fontFamily });
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError('');
    try {
      const imageUrl = blob ? await uploadBannerImage(blob) : preview;
      if (!imageUrl) throw new Error('Selecciona una imagen para el banner.');
      await saveBanner({
        imageUrl,
        title: String(form.get('title') ?? '').trim(),
        subtitle: String(form.get('subtitle') ?? '').trim(),
        titleColor: String(form.get('titleColor') ?? '#ffffff'),
        subtitleColor: String(form.get('subtitleColor') ?? '#a9bdd8'),
        accentColor: String(form.get('accentColor') ?? '#00d5f5'),
        fontFamily: String(form.get('fontFamily') ?? 'display') as Banner['fontFamily'],
        sortOrder: Math.max(0, Number(form.get('sortOrder') ?? 0)),
        visible: form.get('visible') === 'on',
      }, editing?.id);
      if (editing?.imageUrl && editing.imageUrl !== imageUrl) await removeBannerImage(editing.imageUrl);
      await load();
      await reloadBanners();
      reset();
      toast('Banner guardado');
    } catch (err) {
      setError(translateError(err instanceof Error ? err.message : undefined));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (banner: Banner) => {
    if (!window.confirm('¿Eliminar este banner?')) return;
    try {
      await deleteBanner(banner.id);
      await removeBannerImage(banner.imageUrl);
      await load();
      await reloadBanners();
      toast('Banner eliminado');
    } catch (err) {
      setError(translateError(err instanceof Error ? err.message : undefined));
    }
  };

  return (
    <div className="banner-admin">
      <div className="banner-admin__intro">
        <div>
          <h2>Promociones destacadas</h2>
          <p className="muted">Sube imágenes para el carrusel principal de la tienda.</p>
        </div>
        <Button onClick={() => { reset(); setPreview(''); }}>＋ Nuevo banner</Button>
      </div>

      <form className="banner-form" onSubmit={submit} key={editing?.id ?? 'new-banner'}>
        <label
          className={`banner-dropzone${dragActive ? ' is-dragging' : ''}`}
          onDragEnter={(event) => { event.preventDefault(); setDragActive(true); }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={(event) => { if (event.currentTarget === event.target) setDragActive(false); }}
          onDrop={onDrop}
        >
          {preview ? <img src={preview} alt="Vista previa del banner" /> : <span className="banner-dropzone__icon" aria-hidden="true">↥</span>}
          <strong>{dragActive ? 'Suelta la imagen aquí' : 'Arrastra una imagen aquí'}</strong>
          <small>o haz clic para seleccionarla</small>
          <input type="file" accept="image/*" onChange={onFile} required={!editing} />
        </label>
        <div className="banner-form__fields">
          <div className="two-col">
            <Field label="Título (opcional)"><input className="input" name="title" defaultValue={editing?.title ?? ''} maxLength={70} /></Field>
            <Field label="Orden"><input className="input" name="sortOrder" type="number" min={0} step={1} defaultValue={editing?.sortOrder ?? banners.length} /></Field>
          </div>
          <Field label="Texto secundario (opcional)"><input className="input" name="subtitle" defaultValue={editing?.subtitle ?? ''} maxLength={140} /></Field>
          <div className="banner-style-grid">
            <Field label="Color del título"><input className="color-input" type="color" name="titleColor" value={draftStyle.titleColor} onChange={(event) => setDraftStyle((current) => ({ ...current, titleColor: event.target.value }))} /></Field>
            <Field label="Color de la descripción"><input className="color-input" type="color" name="subtitleColor" value={draftStyle.subtitleColor} onChange={(event) => setDraftStyle((current) => ({ ...current, subtitleColor: event.target.value }))} /></Field>
            <Field label="Color de acento"><input className="color-input" type="color" name="accentColor" value={draftStyle.accentColor} onChange={(event) => setDraftStyle((current) => ({ ...current, accentColor: event.target.value }))} /></Field>
            <Field label="Tipografía"><select className="input" name="fontFamily" value={draftStyle.fontFamily} onChange={(event) => setDraftStyle((current) => ({ ...current, fontFamily: event.target.value as Banner['fontFamily'] }))}><option value="display">Display contundente</option><option value="clean">Limpia y moderna</option><option value="mono">Técnica monoespaciada</option></select></Field>
          </div>
          <div className="banner-live-preview" style={{ '--banner-title': draftStyle.titleColor, '--banner-subtitle': draftStyle.subtitleColor, '--banner-accent': draftStyle.accentColor } as CSSProperties}>
            <span>ElectroMarket · selección</span><strong>{String((editing?.title || 'Tu título') || 'Tu título')}</strong><p>{String((editing?.subtitle || 'Descripción atractiva del producto') || 'Descripción atractiva del producto')}</p>
          </div>
          <label className="switch"><input type="checkbox" name="visible" defaultChecked={editing?.visible ?? true} /><span>Mostrar en la tienda</span></label>
          <p className="form__error">{error}</p>
          <div className="banner-form__actions">
            <Button type="submit" disabled={busy}>{busy ? 'Guardando…' : editing ? 'Guardar cambios' : 'Añadir banner'}</Button>
            {editing && <Button type="button" variant="ghost" onClick={reset}>Cancelar</Button>}
          </div>
        </div>
      </form>

      <div className="banner-list-heading"><h3>Banners publicados</h3><span className="muted">{banners.length} imágenes</span></div>
      <div className="rows">
        {banners.map((banner) => (
          <div className="prow banner-row" key={banner.id}>
            <Thumb src={banner.imageUrl} size={100} />
            <div className="prow__info"><strong>{banner.title || 'Banner sin título'}</strong><span className="muted">Orden {banner.sortOrder} · {banner.visible ? 'Visible' : 'Oculto'}</span></div>
            <div className="prow__actions"><Button variant="ghost" size="sm" onClick={() => edit(banner)}>Editar</Button><Button variant="danger" size="sm" onClick={() => remove(banner)}>Eliminar</Button></div>
          </div>
        ))}
      </div>
    </div>
  );
}
