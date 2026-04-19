'use client';

import { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { User, Store, Upload } from 'lucide-react';
import { useOnboardingStore } from '@/lib/stores/onboarding';
import { FormInput } from '@/lib/components/shared/ui/forms/FormInput';
import { FormButton } from '@/lib/components/shared/ui/forms/FormButton';

const ease = [0.25, 0.46, 0.45, 0.94] as const;

const fieldVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, delay: i * 0.1, ease },
  }),
};

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
const MAX_SIZE_BYTES = 2 * 1024 * 1024;

export function StepTwo() {
  const { firstName, lastName, salonName, logoFile, logoPreview, setField, nextStep, prevStep } = useOnboardingStore();
  const [errors, setErrors] = useState({ firstName: '', lastName: '', salonName: '' });
  const [logoError, setLogoError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleLogoChange(file: File | null) {
    if (!file) {
      setField('logoFile', null);
      setField('logoPreview', null);
      setLogoError('');
      return;
    }
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setLogoError('Formato non supportato. Usa PNG, JPG, WebP o SVG.');
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setLogoError('Il file supera i 2 MB.');
      return;
    }
    setField('logoFile', file);
    setField('logoPreview', URL.createObjectURL(file));
    setLogoError('');
  }

  function handleNext() {
    const next = { firstName: '', lastName: '', salonName: '' };
    if (!firstName.trim()) next.firstName = 'Il nome è obbligatorio.';
    if (!lastName.trim())  next.lastName  = 'Il cognome è obbligatorio.';
    if (!salonName.trim()) next.salonName = 'Il nome del salone è obbligatorio.';
    setErrors(next);
    if (next.firstName || next.lastName || next.salonName) return;
    nextStep();
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="space-y-4">
      <motion.div custom={0} variants={fieldVariants} initial="hidden" animate="visible">
        <div className="grid grid-cols-2 gap-3">
          <FormInput
            label="Nome"
            type="text"
            placeholder="Marco"
            value={firstName}
            onChange={(e) => setField('firstName', e.target.value)}
            error={errors.firstName}
            icon={<User className="w-4 h-4 text-zinc-400" />}
            required
            autoComplete="given-name"
          />
          <FormInput
            label="Cognome"
            type="text"
            placeholder="Rossi"
            value={lastName}
            onChange={(e) => setField('lastName', e.target.value)}
            error={errors.lastName}
            required
            autoComplete="family-name"
          />
        </div>
      </motion.div>

      <motion.div custom={1} variants={fieldVariants} initial="hidden" animate="visible">
        <FormInput
          label="Nome del salone"
          type="text"
          placeholder="Salone Rossi"
          value={salonName}
          onChange={(e) => setField('salonName', e.target.value)}
          error={errors.salonName}
          icon={<Store className="w-4 h-4 text-zinc-400" />}
          required
        />
      </motion.div>

      <motion.div custom={2} variants={fieldVariants} initial="hidden" animate="visible">
        <label className="block text-sm font-thin text-zinc-700 dark:text-zinc-200 mb-1">
          Logo del salone{' '}
          <span className="text-zinc-400 dark:text-zinc-500">(opzionale)</span>
        </label>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          onChange={(e) => handleLogoChange(e.target.files?.[0] ?? null)}
        />

        {logoPreview ? (
          <div className="flex items-center gap-4 p-3 border border-zinc-200 dark:border-zinc-700 rounded-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoPreview}
              alt="Anteprima logo"
              className="w-16 h-16 rounded-lg object-cover shrink-0 border border-zinc-200 dark:border-zinc-700"
            />
            <div className="flex flex-col gap-1 min-w-0">
              <p className="text-sm text-zinc-700 dark:text-zinc-300 truncate">{logoFile?.name}</p>
              <button
                type="button"
                onClick={() => {
                  handleLogoChange(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors text-left"
              >
                Rimuovi
              </button>
            </div>
          </div>
        ) : (
          <div
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              if (file) handleLogoChange(file);
            }}
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center gap-2 p-5 border-2 border-dashed border-zinc-500/25 rounded-xl cursor-pointer
                       text-zinc-400 dark:text-zinc-500 text-sm
                       hover:border-primary/70 hover:bg-primary/40 dark:hover:bg-primary/10
                       transition-all duration-200"
          >
            <Upload className="w-5 h-5" />
            <span>
              Trascina qui o{' '}
              <span className="text-primary font-medium">scegli un file</span>
            </span>
            <span className="text-xs text-zinc-400 dark:text-zinc-600">
              PNG, JPG, WebP, SVG · max 2 MB
            </span>
          </div>
        )}

        {logoError && (
          <p className="text-red-500 dark:text-red-400 text-sm mt-1">{logoError}</p>
        )}
      </motion.div>

      <motion.div custom={3} variants={fieldVariants} initial="hidden" animate="visible">
        <div className="flex gap-3 mt-2">
          <FormButton type="button" variant="ghost" onClick={prevStep} className="flex-1">
            ← Indietro
          </FormButton>
          <FormButton type="submit" className="flex-2">
            Avanti →
          </FormButton>
        </div>
      </motion.div>
    </form>
  );
}
