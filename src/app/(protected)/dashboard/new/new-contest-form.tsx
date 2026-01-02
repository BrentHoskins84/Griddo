'use client';

import { useState } from 'react';
import { isRedirectError } from 'next/dist/client/components/redirect-error';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { FormProvider, useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { createContest } from '@/features/contests/actions/create-contest';
import type { CreateContestInput } from '@/features/contests/models/contest';
import {
  createContestSchema,
  defaultContestValues,
} from '@/features/contests/models/contest';
import { cn } from '@/utils/cn';
import { zodResolver } from '@hookform/resolvers/zod';

import { BasicInfoStep } from './steps/basic-info-step';
import { BrandingStep } from './steps/branding-step';
import { SettingsStep } from './steps/settings-step';

const STEPS = [
  { id: 1, name: 'Basic Info', description: 'Contest name and teams' },
  { id: 2, name: 'Settings', description: 'Pricing and payouts' },
  { id: 3, name: 'Branding', description: 'Choose your colors' },
] as const;

// Fields to validate per step
const STEP_FIELDS: Record<number, string[]> = {
  1: ['sportType', 'name', 'description', 'rowTeamName', 'colTeamName'],
  2: [
    'squarePrice',
    'maxSquaresPerPerson',
    // Football payouts
    'payoutQ1Percent',
    'payoutQ2Percent',
    'payoutQ3Percent',
    'payoutFinalPercent',
    // Baseball payouts
    'payoutGame1Percent',
    'payoutGame2Percent',
    'payoutGame3Percent',
    'payoutGame4Percent',
    'payoutGame5Percent',
    'payoutGame6Percent',
    'payoutGame7Percent',
  ],
  3: ['primaryColor', 'secondaryColor'],
};

export function NewContestForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const methods = useForm({
    resolver: zodResolver(createContestSchema),
    defaultValues: defaultContestValues,
    mode: 'onTouched',
  });

  const { handleSubmit, trigger } = methods;

  async function validateCurrentStep(): Promise<boolean> {
    const fields = STEP_FIELDS[currentStep] as (keyof CreateContestInput)[];
    const isValid = await trigger(fields);
    return isValid;
  }

  async function handleNext(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const isValid = await validateCurrentStep();
    if (isValid && currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  }

  function handleBack() {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  }

  async function onSubmit(data: CreateContestInput) {
    setIsSubmitting(true);
    try {
      const response = await createContest(data);
      if (response?.error) {
        toast({
          variant: 'destructive',
          title: 'Error creating contest',
          description: response.error.message || 'Something went wrong. Please try again.',
        });
      }
      // If successful, the server action redirects to the contest page
    } catch (error) {
      // Check if this is a Next.js redirect - if so, let it propagate
      if (isRedirectError(error)) {
        throw error;
      }

      // Only show toast for actual errors
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="mb-4 inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-white lg:text-3xl">Create New Contest</h1>
        <p className="mt-2 text-zinc-400">Set up your game day squares fundraiser in a few easy steps.</p>
      </div>

      {/* Step Indicator */}
      <nav aria-label="Progress" className="mb-8">
        <ol className="flex items-center">
          {STEPS.map((step, index) => (
            <li key={step.id} className={cn('relative', index !== STEPS.length - 1 && 'flex-1')}>
              <div className="flex items-center">
                {/* Step Circle */}
                <button
                  type="button"
                  onClick={() => step.id < currentStep && setCurrentStep(step.id)}
                  disabled={step.id > currentStep}
                  className={cn(
                    'relative flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-all',
                    step.id === currentStep &&
                      'bg-orange-500 text-white ring-4 ring-orange-500/20',
                    step.id < currentStep &&
                      'bg-orange-500 text-white hover:bg-orange-400',
                    step.id > currentStep &&
                      'border-2 border-zinc-700 bg-zinc-900 text-zinc-500'
                  )}
                >
                  {step.id < currentStep ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    step.id
                  )}
                </button>

                {/* Connector Line */}
                {index !== STEPS.length - 1 && (
                  <div
                    className={cn(
                      'ml-4 h-0.5 flex-1',
                      step.id < currentStep ? 'bg-orange-500' : 'bg-zinc-700'
                    )}
                  />
                )}
              </div>

              {/* Step Label (visible on md+) */}
              <div className="mt-2 hidden md:block">
                <span
                  className={cn(
                    'text-sm font-medium',
                    step.id === currentStep ? 'text-orange-500' : 'text-zinc-400'
                  )}
                >
                  {step.name}
                </span>
                <p className="text-xs text-zinc-500">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </nav>

      {/* Form Card */}
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Card className="border-zinc-800 bg-zinc-900">
            <CardHeader>
              <CardTitle className="text-white">{STEPS[currentStep - 1].name}</CardTitle>
              <CardDescription>{STEPS[currentStep - 1].description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step Content */}
              {currentStep === 1 && <BasicInfoStep />}
              {currentStep === 2 && <SettingsStep />}
              {currentStep === 3 && <BrandingStep />}
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          <div className="mt-6 flex items-center justify-between">
            <Button
              type="button"
              variant="default"
              onClick={handleBack}
              disabled={currentStep === 1}
              className={cn(currentStep === 1 && 'invisible')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            {currentStep < STEPS.length ? (
              <Button
                type="button"
                variant="orange"
                onClick={handleNext}
              >
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                variant="orange"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Create Contest
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      </FormProvider>
    </div>
  );
}

