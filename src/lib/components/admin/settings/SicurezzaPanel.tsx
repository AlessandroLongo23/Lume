'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Mail, Key, Shield, ShieldCheck, LogOut, Eye, EyeOff, Loader2, Save } from 'lucide-react';
import { SettingsCard } from './SettingsCard';
import { supabase } from '@/lib/supabase/client';
import { usePreferencesStore } from '@/lib/stores/preferences';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';

type MfaState =
  | { status: 'unknown' }
  | { status: 'none' }
  | { status: 'enrolling'; factorId: string; qr: string; uri: string }
  | { status: 'verified'; factorId: string };

export function SicurezzaPanel() {
  const email = usePreferencesStore((s) => s.email);

  // ── Email change ──────────────────────────────────────────────────────────
  const [newEmail, setNewEmail] = useState('');
  const [emailSaving, setEmailSaving] = useState(false);

  const onChangeEmail = async () => {
    const trimmed = newEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      messagePopup.getState().error('Email non valida');
      return;
    }
    if (trimmed === email.toLowerCase()) {
      messagePopup.getState().info("L'email è già quella attuale");
      return;
    }
    setEmailSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: trimmed });
      if (error) throw error;
      messagePopup.getState().success(
        'Controlla la tua casella per confermare la nuova email',
        6000,
      );
      setNewEmail('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Errore durante l'aggiornamento";
      messagePopup.getState().error(msg);
    } finally {
      setEmailSaving(false);
    }
  };

  // ── Password change ───────────────────────────────────────────────────────
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [pwdSaving, setPwdSaving] = useState(false);

  const onChangePassword = async () => {
    if (!currentPwd) {
      messagePopup.getState().error('Inserisci la password attuale');
      return;
    }
    if (newPwd.length < 8) {
      messagePopup.getState().error('La nuova password deve avere almeno 8 caratteri');
      return;
    }
    if (newPwd !== confirmPwd) {
      messagePopup.getState().error('Le password non coincidono');
      return;
    }
    setPwdSaving(true);
    try {
      const { error: reAuthErr } = await supabase.auth.signInWithPassword({
        email,
        password: currentPwd,
      });
      if (reAuthErr) {
        messagePopup.getState().error('Password attuale errata');
        return;
      }
      const { error } = await supabase.auth.updateUser({ password: newPwd });
      if (error) throw error;
      messagePopup.getState().success('Password aggiornata');
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Errore durante l'aggiornamento";
      messagePopup.getState().error(msg);
    } finally {
      setPwdSaving(false);
    }
  };

  // ── MFA ───────────────────────────────────────────────────────────────────
  const [mfa, setMfa] = useState<MfaState>({ status: 'unknown' });
  const [mfaCode, setMfaCode] = useState('');
  const [mfaBusy, setMfaBusy] = useState(false);

  const refreshMfa = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      // `data.totp` already filters to verified TOTP factors.
      const verifiedTotp = data.totp?.[0];
      if (verifiedTotp) {
        setMfa({ status: 'verified', factorId: verifiedTotp.id });
        return;
      }
      // Clean up orphaned unverified factors (in `all` but not `totp`) so re-enrollment is clean.
      const verifiedIds = new Set((data.totp ?? []).map((f) => f.id));
      const orphaned = (data.all ?? []).filter((f) => f.factor_type === 'totp' && !verifiedIds.has(f.id));
      for (const f of orphaned) {
        await supabase.auth.mfa.unenroll({ factorId: f.id }).catch(() => {});
      }
      setMfa({ status: 'none' });
    } catch {
      setMfa({ status: 'none' });
    }
  };

  useEffect(() => {
    refreshMfa();
  }, []);

  const onEnrollMfa = async () => {
    setMfaBusy(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
      if (error) throw error;
      setMfa({
        status: 'enrolling',
        factorId: data.id,
        qr: data.totp.qr_code,
        uri: data.totp.uri,
      });
      setMfaCode('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Errore durante l'attivazione";
      messagePopup.getState().error(msg);
    } finally {
      setMfaBusy(false);
    }
  };

  const onVerifyMfa = async () => {
    if (mfa.status !== 'enrolling') return;
    if (!/^\d{6}$/.test(mfaCode)) {
      messagePopup.getState().error('Inserisci il codice a 6 cifre');
      return;
    }
    setMfaBusy(true);
    try {
      const { data: ch, error: chErr } = await supabase.auth.mfa.challenge({
        factorId: mfa.factorId,
      });
      if (chErr) throw chErr;
      const { error: vErr } = await supabase.auth.mfa.verify({
        factorId: mfa.factorId,
        challengeId: ch.id,
        code: mfaCode,
      });
      if (vErr) throw vErr;
      messagePopup.getState().success('Autenticazione a due fattori attivata');
      setMfa({ status: 'verified', factorId: mfa.factorId });
      setMfaCode('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Codice non valido';
      messagePopup.getState().error(msg);
    } finally {
      setMfaBusy(false);
    }
  };

  const onDisableMfa = async () => {
    if (mfa.status !== 'verified') return;
    if (!confirm('Disattivare l\'autenticazione a due fattori?')) return;
    setMfaBusy(true);
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId: mfa.factorId });
      if (error) throw error;
      messagePopup.getState().success('2FA disattivata');
      setMfa({ status: 'none' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Errore durante la disattivazione';
      messagePopup.getState().error(msg);
    } finally {
      setMfaBusy(false);
    }
  };

  const onCancelEnroll = async () => {
    if (mfa.status !== 'enrolling') return;
    await supabase.auth.mfa.unenroll({ factorId: mfa.factorId }).catch(() => {});
    setMfa({ status: 'none' });
    setMfaCode('');
  };

  // ── Sessions ──────────────────────────────────────────────────────────────
  const [signoutBusy, setSignoutBusy] = useState(false);

  const onSignOutEverywhere = async () => {
    if (!confirm('Esci da tutti i dispositivi? Sarai disconnesso anche da questo.')) return;
    setSignoutBusy(true);
    try {
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) throw error;
      window.location.href = '/login';
    } catch {
      messagePopup.getState().error('Errore durante la disconnessione');
      setSignoutBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <SettingsCard
        icon={Mail}
        title="Email"
        description="Cambia l'indirizzo email associato al tuo account."
      >
        <p className="text-xs text-zinc-500 mb-3">
          Email attuale: <span className="font-mono text-zinc-700 dark:text-zinc-300">{email || '—'}</span>
        </p>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <input
            type="email"
            placeholder="nuova@email.it"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="flex-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
          />
          <button
            type="button"
            onClick={onChangeEmail}
            disabled={emailSaving || !newEmail.trim()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary-hover hover:bg-primary-active text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="size-4" />
            {emailSaving ? 'Invio…' : 'Cambia email'}
          </button>
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          {"Riceverai un'email di conferma al nuovo indirizzo."}
        </p>
      </SettingsCard>

      <SettingsCard
        icon={Key}
        title="Password"
        description="Aggiorna la password del tuo account."
      >
        <div className="grid gap-3">
          <div className="relative">
            <input
              type={showPwd ? 'text' : 'password'}
              placeholder="Password attuale"
              autoComplete="current-password"
              value={currentPwd}
              onChange={(e) => setCurrentPwd(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 pr-10 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              aria-label={showPwd ? 'Nascondi' : 'Mostra'}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
            >
              {showPwd ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          <input
            type={showPwd ? 'text' : 'password'}
            placeholder="Nuova password (almeno 8 caratteri)"
            autoComplete="new-password"
            value={newPwd}
            onChange={(e) => setNewPwd(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
          />
          <input
            type={showPwd ? 'text' : 'password'}
            placeholder="Conferma nuova password"
            autoComplete="new-password"
            value={confirmPwd}
            onChange={(e) => setConfirmPwd(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
          />
        </div>
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={onChangePassword}
            disabled={pwdSaving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary-hover hover:bg-primary-active text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="size-4" />
            {pwdSaving ? 'Salvataggio…' : 'Aggiorna password'}
          </button>
        </div>
      </SettingsCard>

      <SettingsCard
        icon={mfa.status === 'verified' ? ShieldCheck : Shield}
        title="Autenticazione a due fattori"
        description="Aggiungi un secondo livello di sicurezza con un'app authenticator."
      >
        {mfa.status === 'unknown' && (
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <Loader2 className="size-4 animate-spin" />
            Caricamento…
          </div>
        )}

        {mfa.status === 'none' && (
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              Stato: <span className="font-medium text-zinc-900 dark:text-zinc-100">non attiva</span>
            </p>
            <button
              type="button"
              onClick={onEnrollMfa}
              disabled={mfaBusy}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary-hover hover:bg-primary-active text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Shield className="size-4" />
              {mfaBusy ? 'Attivazione…' : 'Attiva 2FA'}
            </button>
          </div>
        )}

        {mfa.status === 'enrolling' && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              Scansiona il QR code con la tua app authenticator (Google Authenticator, 1Password, Authy…)
              e inserisci il codice a 6 cifre per confermare.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
              <div className="bg-white p-3 rounded-lg border border-zinc-200">
                <Image src={mfa.qr} alt="QR code 2FA" width={180} height={180} unoptimized />
              </div>
              <div className="flex flex-col gap-2 flex-1 min-w-0">
                <label htmlFor="mfa-code" className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Codice a 6 cifre
                </label>
                <input
                  id="mfa-code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-40 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-sm font-mono tracking-widest text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
                />
                <details className="text-xs text-zinc-500">
                  <summary className="cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-300">
                    Inserimento manuale della chiave
                  </summary>
                  <code className="mt-2 block break-all bg-zinc-50 dark:bg-zinc-800 p-2 rounded text-zinc-700 dark:text-zinc-300">
                    {mfa.uri}
                  </code>
                </details>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={onVerifyMfa}
                    disabled={mfaBusy || mfaCode.length !== 6}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary-hover hover:bg-primary-active text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ShieldCheck className="size-4" />
                    Verifica e attiva
                  </button>
                  <button
                    type="button"
                    onClick={onCancelEnroll}
                    disabled={mfaBusy}
                    className="px-3 py-2 rounded-lg text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors"
                  >
                    Annulla
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {mfa.status === 'verified' && (
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-2">
              <ShieldCheck className="size-4" />
              Attiva
            </p>
            <button
              type="button"
              onClick={onDisableMfa}
              disabled={mfaBusy}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors disabled:opacity-50"
            >
              {mfaBusy ? 'Disattivazione…' : 'Disattiva'}
            </button>
          </div>
        )}
      </SettingsCard>

      <SettingsCard
        icon={LogOut}
        title="Sessioni"
        description="Disconnetti il tuo account da tutti i dispositivi."
      >
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            Termina tutte le sessioni attive, incluso questo dispositivo.
          </p>
          <button
            type="button"
            onClick={onSignOutEverywhere}
            disabled={signoutBusy}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors disabled:opacity-50"
          >
            <LogOut className="size-4" />
            {signoutBusy ? 'Disconnessione…' : 'Esci ovunque'}
          </button>
        </div>
      </SettingsCard>
    </div>
  );
}
