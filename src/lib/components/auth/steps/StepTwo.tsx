'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { User, Store, Upload, ArrowLeft, ArrowRight } from 'lucide-react';
import { useOnboardingStore } from '@/lib/stores/onboarding';
import { FormInput } from '@/lib/components/shared/ui/forms/FormInput';
import { Button } from '@/lib/components/shared/ui/Button';
import { Field } from '@/lib/components/shared/ui/forms/Field';
import { FileDropZone } from '@/lib/components/onboarding/FileDropZone';
import { DURATION } from '@/lib/const/motion';

const ease = [0.2, 0, 0, 1] as const;

const fieldVariants = {
  hidden: { opacity: 0, y: 6 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.enter, delay: i * 0.1, ease },
  }),
};

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];
const MAX_SIZE_BYTES = 2 * 1024 * 1024;

export function StepTwo() {
  const { firstName, lastName, salonName, logoFile, logoPreview, setField, nextStep, prevStep } = useOnboardingStore();
  const [errors, setErrors] = useState({ firstName: '', lastName: '', salonName: '' });
  const [logoError, setLogoError] = useState('');

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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormInput
            size="lg"
            label="Nome"
            type="text"
            placeholder="Marco"
            value={firstName}
            onChange={(e) => setField('firstName', e.target.value)}
            error={errors.firstName}
            icon={<User className="size-4 text-[var(--lume-text-muted)]" />}
            required
            autoComplete="given-name"
          />
          <FormInput
            size="lg"
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
          size="lg"
          label="Nome del salone"
          type="text"
          placeholder="Salone Rossi"
          value={salonName}
          onChange={(e) => setField('salonName', e.target.value)}
          error={errors.salonName}
          icon={<Store className="size-4 text-[var(--lume-text-muted)]" />}
          required
        />
      </motion.div>

      <motion.div custom={2} variants={fieldVariants} initial="hidden" animate="visible">
        <Field
          label={<>Logo del salone <span className="text-[var(--lume-text-muted)]">(opzionale)</span></>}
          error={logoError || undefined}
        >
          {({ id, describedBy }) =>
            logoPreview ? (
              <div className="surface-card flex items-center gap-4 p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logoPreview}
                  alt="Anteprima logo"
                  className="surface-card size-16 rounded-lg object-cover shrink-0"
                />
                <div className="flex flex-col gap-1 min-w-0">
                  <p className="text-sm text-[var(--lume-text)] truncate">{logoFile?.name}</p>
                  <Button
                    variant="ghost-destructive"
                    size="sm"
                    onClick={() => handleLogoChange(null)}
                    className="self-start max-sm:h-11"
                  >
                    Rimuovi
                  </Button>
                </div>
              </div>
            ) : (
              <FileDropZone
                id={id}
                aria-describedby={describedBy}
                accept={ACCEPTED_TYPES.join(',')}
                onFiles={([file]) => handleLogoChange(file)}
                icon={Upload}
                prompt="Trascina qui o"
                action="scegli un file"
                hint="PNG, JPG, WebP, SVG · max 2 MB"
              />
            )
          }
        </Field>
      </motion.div>

      <motion.div custom={3} variants={fieldVariants} initial="hidden" animate="visible">
        <div className="flex gap-3 mt-2">
          <Button type="button" variant="ghost" size="lg" onClick={prevStep} className="flex-1" leadingIcon={ArrowLeft}>
            Indietro
          </Button>
          <Button type="submit" variant="primary" size="lg" className="flex-2" trailingIcon={ArrowRight}>
            Avanti
          </Button>
        </div>
      </motion.div>
    </form>
  );
}
