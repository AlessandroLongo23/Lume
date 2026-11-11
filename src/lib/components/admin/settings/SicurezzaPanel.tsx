'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Shield, ShieldCheck, ShieldOff, LogOut, Loader2, Save, type LucideIcon } from 'lucide-react';
import { FormInput } from '@/lib/components/shared/ui/forms/FormInput';
import { StatusDot } from '@/lib/components/shared/ui/StatusDot';
import { SettingsCard } from './SettingsCard';
import { Button } from '@/lib/components/shared/ui/Button';
import { supabase } from '@/lib/supabase/client';
import { usePreferencesStore } from '@/lib/stores/preferences';
import { messagePopup } from '@/lib/components/shared/ui/messagePopup/messagePopup';
import { ConfirmDialog } from '@/lib/components/shared/ui/modals/ConfirmDialog';

type PendingConfirm = {
  title: string;
  description: string;
  confirmLabel: string;
  tone: 'warning' | 'destructive' | 'default';
  icon?: LucideIcon;
  action: () => void | Promise<void>;
};

type MfaState =
  | { status: 'unknown' }
  | { status: 'none' }
  | { status: 'enrolling'; factorId: string; qr: string; uri: string }
  | { status: 'verified'; factorId: string };

export function SicurezzaPanel() {
  const email = usePreferencesStore((s) => s.email);

  // ── Confirm dialog ────────────────────────────────────────────────────────
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null);

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

  const onDisableMfa = () => {
    if (mfa.status !== 'verified') return;
    setPendingConfirm({
      title: 'Disattivare l\'autenticazione a due fattori?',
      description: 'Il tuo account perderà la protezione aggiuntiva del codice 2FA.',
      confirmLabel: 'Disattiva',
      tone: 'warning',
      icon: ShieldOff,
      action: async () => {
        if (mfa.status !== 'verified') return;
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
      },
    });
  };

  const onCancelEnroll = async () => {
    if (mfa.status !== 'enrolling') return;
    await supabase.auth.mfa.unenroll({ factorId: mfa.factorId }).catch(() => {});
    setMfa({ status: 'none' });
    setMfaCode('');
  };

  // ── Sessions ──────────────────────────────────────────────────────────────
  const [signoutBusy, setSignoutBusy] = useState(false);

  const onSignOutEverywhere = () => {
    setPendingConfirm({
      title: 'Esci da tutti i dispositivi?',
      description: 'Sarai disconnesso anche da questo dispositivo.',
      confirmLabel: 'Esci ovunque',
      tone: 'warning',
      icon: LogOut,
      action: async () => {
        setSignoutBusy(true);
        try {
          const { error } = await supabase.auth.signOut({ scope: 'global' });
          if (error) throw error;
          window.location.href = '/login';
        } catch {
          messagePopup.getState().error('Errore durante la disconnessione');
          setSignoutBusy(false);
        }
      },
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <SettingsCard
        title="Email"
        description="Cambia l'indirizzo email associato al tuo account."
      >
        <p className="text-sm text-[var(--lume-text-secondary)] mb-3">
          Email attuale: <span className="tabular-nums text-[var(--lume-text)]">{email || '—'}</span>
        </p>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <FormInput
            fieldClassName="flex-1"
            type="email"
            aria-label="Nuova email"
            placeholder="nuova@email.it"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
          />
          <Button
            variant="secondary"
            leadingIcon={Save}
            loading={emailSaving}
            disabled={!newEmail.trim()}
            onClick={onChangeEmail}
          >
            {emailSaving ? 'Invio…' : 'Cambia email'}
          </Button>
        </div>
        <p className="mt-2 text-xs text-[var(--lume-text-secondary)]">
          {"Riceverai un'email di conferma al nuovo indirizzo."}
        </p>
      </SettingsCard>

      <SettingsCard
        title="Password"
        description="Aggiorna la password del tuo account."
      >
        <div className="grid gap-3">
          <FormInput
            type="password"
            aria-label="Password attuale"
            placeholder="Password attuale"
            autoComplete="current-password"
            value={currentPwd}
            onChange={(e) => setCurrentPwd(e.target.value)}
          />
          <FormInput
            type="password"
            aria-label="Nuova password"
            placeholder="Nuova password (almeno 8 caratteri)"
            autoComplete="new-password"
            value={newPwd}
            onChange={(e) => setNewPwd(e.target.value)}
          />
          <FormInput
            type="password"
            aria-label="Conferma nuova password"
            placeholder="Conferma nuova password"
            autoComplete="new-password"
            value={confirmPwd}
            onChange={(e) => setConfirmPwd(e.target.value)}
          />
        </div>
        <div className="mt-3 flex justify-end">
          <Button
            variant="primary"
            leadingIcon={Save}
            loading={pwdSaving}
            onClick={onChangePassword}
          >
            {pwdSaving ? 'Salvataggio…' : 'Aggiorna password'}
          </Button>
        </div>
      </SettingsCard>

      <SettingsCard
        title="Autenticazione a due fattori"
        description="Aggiungi un secondo livello di sicurezza con un'app authenticator."
      >
        {mfa.status === 'unknown' && (
          <div className="flex items-center gap-2 text-sm text-[var(--lume-text-secondary)]">
            <Loader2 className="size-4 animate-spin" />
            Caricamento…
          </div>
        )}

        {mfa.status === 'none' && (
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-[var(--lume-text-secondary)]">
              Stato:{' '}
              <StatusDot tone="neutral" className="font-medium">non attiva</StatusDot>
            </p>
            <Button
              variant="secondary"
              leadingIcon={Shield}
              loading={mfaBusy}
              onClick={onEnrollMfa}
            >
              {mfaBusy ? 'Attivazione…' : 'Attiva 2FA'}
            </Button>
          </div>
        )}

        {mfa.status === 'enrolling' && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-[var(--lume-text-secondary)]">
              Scansiona il QR code con la tua app authenticator (Google Authenticator, 1Password, Authy…)
              e inserisci il codice a 6 cifre per confermare.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
              {/* ds-ignore: a QR code needs a white quiet zone to scan, in either theme */}
              <div className="bg-white p-3 rounded-lg shadow-[inset_0_0_0_1px_var(--lume-line)]">
                <Image src={mfa.qr} alt="QR code 2FA" width={180} height={180} unoptimized />
              </div>
              <div className="flex flex-col gap-2 flex-1 min-w-0">
                <FormInput
                  id="mfa-code"
                  label="Codice a 6 cifre"
                  inputMode="numeric"
                  maxLength={6}
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  fieldClassName="w-40"
                  className="tabular-nums tracking-widest"
                />
                <details className="text-xs text-[var(--lume-text-secondary)]">
                  <summary className="cursor-pointer hover:text-[var(--lume-text)]">
                    Inserimento manuale della chiave
                  </summary>
                  <code className="mt-2 block break-all bg-hover p-2 rounded-md font-mono text-[var(--lume-text)]">
                    {mfa.uri}
                  </code>
                </details>
                <div className="flex items-center gap-2 mt-2">
                  <Button
                    variant="primary"
                    leadingIcon={ShieldCheck}
                    loading={mfaBusy}
                    disabled={mfaCode.length !== 6}
                    onClick={onVerifyMfa}
                  >
                    Verifica e attiva
                  </Button>
                  <Button variant="ghost" disabled={mfaBusy} onClick={onCancelEnroll}>
                    Annulla
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {mfa.status === 'verified' && (
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-[var(--lume-text-secondary)] flex items-center gap-1.5">
              Stato:
              <StatusDot tone="success" className="font-medium">attiva</StatusDot>
            </p>
            <Button
              variant="ghost"
              loading={mfaBusy}
              onClick={onDisableMfa}
              className="text-danger-strong"
            >
              {mfaBusy ? 'Disattivazione…' : 'Disattiva'}
            </Button>
          </div>
        )}
      </SettingsCard>

      <SettingsCard
        title="Sessioni"
        description="Disconnetti il tuo account da tutti i dispositivi."
      >
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-[var(--lume-text-secondary)]">
            Termina tutte le sessioni attive, incluso questo dispositivo.
          </p>
          <Button
            variant="secondary"
            leadingIcon={LogOut}
            loading={signoutBusy}
            onClick={onSignOutEverywhere}
          >
            {signoutBusy ? 'Disconnessione…' : 'Esci ovunque'}
          </Button>
        </div>
      </SettingsCard>

      <ConfirmDialog
        isOpen={pendingConfirm !== null}
        onClose={() => setPendingConfirm(null)}
        onConfirm={() => {
          const action = pendingConfirm?.action;
          setPendingConfirm(null);
          void action?.();
        }}
        title={pendingConfirm?.title ?? ''}
        description={pendingConfirm?.description}
        confirmLabel={pendingConfirm?.confirmLabel}
        tone={pendingConfirm?.tone ?? 'warning'}
        icon={pendingConfirm?.icon}
      />
    </div>
  );
}
