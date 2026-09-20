'use client';

import { useState, type FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { useUI, type AuthTab } from '@/context/UIContext';
import Button from './ui/Button';
import Field from './ui/Field';
import Modal from './ui/Modal';

export default function AuthModal() {
  const { authTab, setAuthTab, thenCheckout, open, close } = useUI();
  const { signIn, signUp } = useAuth();
  const { items } = useCart();
  const toast = useToast();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const changeTab = (tab: AuthTab) => {
    setError('');
    setAuthTab(tab);
  };

  const finish = (message: string) => {
    toast(message);
    if (thenCheckout && items.length) open('checkout');
    else close();
  };

  const onLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setError('');
    const err = await signIn(String(f.get('email') ?? '').trim().toLowerCase(), String(f.get('password') ?? ''));
    setBusy(false);
    if (err) return setError(err);
    finish('Hola de nuevo 👋');
  };

  const onRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const name = String(f.get('name') ?? '').trim();
    const phone = String(f.get('phone') ?? '').trim();
    const email = String(f.get('email') ?? '').trim().toLowerCase();
    const password = String(f.get('password') ?? '');
    if (!name || !phone) return setError('Completa todos los campos.');
    if (password.length < 6) return setError('La contraseña debe tener al menos 6 caracteres.');

    setBusy(true);
    setError('');
    const res = await signUp({ name, email, phone, password });
    setBusy(false);
    if (res.error) return setError(res.error);
    if (res.needsConfirmation) {
      changeTab('login');
      toast('Te enviamos un correo para confirmar tu cuenta. Confírmalo y luego ingresa.');
      return;
    }
    finish(`¡Cuenta creada! Bienvenido/a, ${name.split(' ')[0]}`);
  };

  return (
    <Modal title={authTab === 'login' ? 'Ingresar' : 'Crear cuenta'} onClose={close}>
      <div className="tabs">
        <button type="button" className={authTab === 'login' ? 'is-active' : ''} onClick={() => changeTab('login')}>
          Ingresar
        </button>
        <button type="button" className={authTab === 'register' ? 'is-active' : ''} onClick={() => changeTab('register')}>
          Registrarme
        </button>
      </div>

      {authTab === 'login' ? (
        <form className="form" onSubmit={onLogin}>
          <Field label="Correo">
            <input className="input" type="email" name="email" autoComplete="email" required autoFocus />
          </Field>
          <Field label="Contraseña">
            <input className="input" type="password" name="password" autoComplete="current-password" required />
          </Field>
          <p className="form__error">{error}</p>
          <Button type="submit" disabled={busy}>{busy ? 'Ingresando…' : 'Ingresar'}</Button>
        </form>
      ) : (
        <form className="form" onSubmit={onRegister}>
          <Field label="Nombre completo">
            <input className="input" type="text" name="name" autoComplete="name" maxLength={60} required autoFocus />
          </Field>
          <Field label="Correo">
            <input className="input" type="email" name="email" autoComplete="email" required />
          </Field>
          <Field label="Teléfono">
            <input className="input" type="tel" name="phone" autoComplete="tel" placeholder="+53 5 123 4567" required />
          </Field>
          <Field label="Contraseña" hint="Mínimo 6 caracteres">
            <input className="input" type="password" name="password" autoComplete="new-password" minLength={6} required />
          </Field>
          <p className="form__error">{error}</p>
          <Button type="submit" disabled={busy}>{busy ? 'Creando…' : 'Crear cuenta'}</Button>
        </form>
      )}
    </Modal>
  );
}