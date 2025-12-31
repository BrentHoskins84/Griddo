'use client';

import { useRef, useState, useTransition } from 'react';
import Image from 'next/image';
import { ArrowDown, ArrowUp, ImagePlus, Loader2, Plus, Trash2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { updatePaymentOptions } from '@/features/contests/actions/update-payment-options';
import { deletePaymentQr, uploadPaymentQr } from '@/features/contests/actions/upload-payment-qr';
import { Database } from '@/libs/supabase/types';

type PaymentOption = Database['public']['Tables']['payment_options']['Row'];
type PaymentOptionType = Database['public']['Enums']['payment_option_type'];

const PAYMENT_TYPES: { value: PaymentOptionType; label: string }[] = [
  { value: 'venmo', label: 'Venmo' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'cashapp', label: 'Cash App' },
  { value: 'zelle', label: 'Zelle' },
];

const PAYMENT_FIELD_CONFIG: Record<
  PaymentOptionType,
  {
    label: string;
    placeholder: string;
    helpText: string;
    hasLast4: boolean;
  }
> = {
  venmo: {
    label: 'Username',
    placeholder: '@username',
    helpText: 'Participants will verify the last 4 digits when paying',
    hasLast4: true,
  },
  paypal: {
    label: 'Username',
    placeholder: 'yourname',
    helpText: 'Your PayPal.Me username',
    hasLast4: false,
  },
  cashapp: {
    label: '$Cashtag',
    placeholder: '$YourName',
    helpText: 'Make sure it starts with $',
    hasLast4: false,
  },
  zelle: {
    label: 'Email or Phone',
    placeholder: 'email@example.com or 555-555-5555',
    helpText: 'Use the email/phone enrolled with your bank',
    hasLast4: false,
  },
};

interface LocalPaymentOption {
  id: string;
  type: PaymentOptionType;
  handle_or_link: string;
  display_name: string;
  instructions: string;
  account_last_4_digits: string;
  qr_code_url: string;
}

interface PaymentOptionsSectionProps {
  contest: { id: string };
  paymentOptions: PaymentOption[];
}

export function PaymentOptionsSection({ contest, paymentOptions }: PaymentOptionsSectionProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const [options, setOptions] = useState<LocalPaymentOption[]>(() =>
    paymentOptions.map((opt) => ({
      id: opt.id,
      type: opt.type,
      handle_or_link: opt.handle_or_link,
      display_name: opt.display_name ?? '',
      instructions: opt.instructions ?? '',
      account_last_4_digits: opt.account_last_4_digits ?? '',
      qr_code_url: opt.qr_code_url ?? '',
    }))
  );

  const [uploadingQrId, setUploadingQrId] = useState<string | null>(null);
  const [isSavingQr, setIsSavingQr] = useState(false);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const [hasChanges, setHasChanges] = useState(false);

  const handleAdd = () => {
    const newOption: LocalPaymentOption = {
      id: `new-${Date.now()}`,
      type: 'venmo',
      handle_or_link: '',
      display_name: '',
      instructions: '',
      account_last_4_digits: '',
      qr_code_url: '',
    };
    setOptions([...options, newOption]);
    setHasChanges(true);
  };

  const handleTypeChange = async (id: string, newType: PaymentOptionType) => {
    const option = options.find((opt) => opt.id === id);

    // If there's an existing QR code on a saved option, delete it first
    if (option?.qr_code_url && !option.id.startsWith('new-')) {
      // Call handleQrDelete which updates DB and deletes file
      await handleQrDelete(id, option.qr_code_url);
    }

    // Update state with new type and cleared fields
    setOptions(
      options.map((opt) =>
        opt.id === id
          ? { ...opt, type: newType, handle_or_link: '', account_last_4_digits: '', qr_code_url: '' }
          : opt
      )
    );
    setHasChanges(true);
  };

  const handleQrUpload = async (optionId: string, file: File) => {
    if (isSavingQr) return;

    if (optionId.startsWith('new-')) {
      toast({
        variant: 'destructive',
        title: 'Save required',
        description: 'Please save the payment option before uploading a QR code.',
      });
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Please use PNG, JPEG, or WebP.',
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: 'Maximum size is 2MB.',
      });
      return;
    }

    setUploadingQrId(optionId);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const result = await uploadPaymentQr(contest.id, optionId, formData);

      if (result?.error) {
        toast({
          variant: 'destructive',
          title: 'Upload failed',
          description: result.error.message,
        });
        return;
      }

      if (result?.data?.url) {
        const updatedOptions = options.map((opt) =>
          opt.id === optionId ? { ...opt, qr_code_url: result.data!.url } : opt
        );
        setOptions(updatedOptions);

        // Immediately persist to database
        setIsSavingQr(true);
        const saveResult = await updatePaymentOptions(
          contest.id,
          updatedOptions.map((opt, index) => ({
            type: opt.type,
            handle_or_link: opt.handle_or_link,
            display_name: opt.display_name || null,
            instructions: opt.instructions || null,
            sort_order: index,
            account_last_4_digits: opt.account_last_4_digits || null,
            qr_code_url: opt.qr_code_url || null,
          }))
        );
        setIsSavingQr(false);

        if (saveResult?.error) {
          // Rollback UI change
          setOptions(options);
          // Attempt to delete the uploaded file since save failed
          try {
            await deletePaymentQr(result.data!.url);
          } catch (cleanupError) {
            console.error('Failed to cleanup orphaned QR code:', cleanupError);
          }
          toast({
            variant: 'destructive',
            title: 'Save failed',
            description: saveResult.error.message,
          });
          return;
        }

        setHasChanges(false);
        toast({
          title: 'QR code uploaded',
          description: 'Payment options saved.',
        });
      }
    } catch {
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: 'An unexpected error occurred.',
      });
    } finally {
      setUploadingQrId(null);
    }
  };

  const handleQrDelete = async (optionId: string, qrUrl: string) => {
    if (!qrUrl || isSavingQr) return;

    try {
      // First, update the database to clear qr_code_url
      const updatedOptions = options.map((opt) =>
        opt.id === optionId ? { ...opt, qr_code_url: '' } : opt
      );

      setIsSavingQr(true);
      const saveResult = await updatePaymentOptions(
        contest.id,
        updatedOptions.map((opt, index) => ({
          type: opt.type,
          handle_or_link: opt.handle_or_link,
          display_name: opt.display_name || null,
          instructions: opt.instructions || null,
          sort_order: index,
          account_last_4_digits: opt.account_last_4_digits || null,
          qr_code_url: opt.qr_code_url || null,
        }))
      );
      setIsSavingQr(false);

      if (saveResult?.error) {
        // DB save failed - don't delete file, don't update UI
        toast({
          variant: 'destructive',
          title: 'Delete failed',
          description: saveResult.error.message,
        });
        return;
      }

      // DB update succeeded - update UI
      setOptions(updatedOptions);
      setHasChanges(false);

      // Now attempt to delete file from storage
      try {
        const deleteResult = await deletePaymentQr(qrUrl);
        if (deleteResult?.error) {
          console.error('Failed to delete QR file from storage:', deleteResult.error.message);
        }
      } catch (storageError) {
        console.error('Failed to delete QR file from storage:', storageError);
      }

      toast({
        title: 'QR code removed',
        description: 'Payment options saved.',
      });
    } catch {
      toast({
        variant: 'destructive',
        title: 'Delete failed',
        description: 'An unexpected error occurred.',
      });
    }
  };

  const handleRemove = (id: string) => {
    setOptions(options.filter((opt) => opt.id !== id));
    setHasChanges(true);
  };

  const handleChange = (id: string, field: keyof LocalPaymentOption, value: string) => {
    setOptions(
      options.map((opt) => (opt.id === id ? { ...opt, [field]: value } : opt))
    );
    setHasChanges(true);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newOptions = [...options];
    [newOptions[index - 1], newOptions[index]] = [newOptions[index], newOptions[index - 1]];
    setOptions(newOptions);
    setHasChanges(true);
  };

  const handleMoveDown = (index: number) => {
    if (index === options.length - 1) return;
    const newOptions = [...options];
    [newOptions[index], newOptions[index + 1]] = [newOptions[index + 1], newOptions[index]];
    setOptions(newOptions);
    setHasChanges(true);
  };

  const handleSave = () => {
    // Validate that all options have handle_or_link
    const invalid = options.find((opt) => !opt.handle_or_link.trim());
    if (invalid) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'All payment options must have a handle or link.',
      });
      return;
    }

    startTransition(async () => {
      const result = await updatePaymentOptions(
        contest.id,
        options.map((opt, index) => ({
          type: opt.type,
          handle_or_link: opt.handle_or_link,
          display_name: opt.display_name || null,
          instructions: opt.instructions || null,
          sort_order: index,
          account_last_4_digits: opt.account_last_4_digits || null,
          qr_code_url: opt.qr_code_url || null,
        }))
      );

      if (result?.error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error.message,
        });
        return;
      }

      setHasChanges(false);
      toast({
        title: 'Payment options saved',
        description: 'Your payment options have been updated.',
      });
    });
  };

  const getFieldConfig = (type: PaymentOptionType) => PAYMENT_FIELD_CONFIG[type];

  return (
    <Card className="border-zinc-800 bg-zinc-900">
      <CardHeader>
        <CardTitle className="text-white">Payment Options</CardTitle>
        <CardDescription>
          Add payment methods for participants to pay for their squares.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {options.length === 0 && (
          <p className="text-sm text-zinc-500">
            No payment options added yet. Add one below.
          </p>
        )}

        {options.map((option, index) => (
          <div
            key={option.id}
            className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4 space-y-4"
          >
            <div className="flex items-center justify-between">
              <Label className="text-base">Payment Option {index + 1}</Label>
              <div className="flex gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0}
                  className="h-8 w-8 p-0 text-zinc-400 hover:text-white"
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleMoveDown(index)}
                  disabled={index === options.length - 1}
                  className="h-8 w-8 p-0 text-zinc-400 hover:text-white"
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(option.id)}
                  className="h-8 w-8 p-0 text-red-400 hover:bg-red-950 hover:text-red-300"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Type */}
              <div className="space-y-2">
                <Label htmlFor={`type-${option.id}`}>Type</Label>
                <select
                  id={`type-${option.id}`}
                  value={option.type}
                  onChange={(e) =>
                    handleTypeChange(option.id, e.target.value as PaymentOptionType)
                  }
                  className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
                >
                  {PAYMENT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dynamic Handle Field */}
              <div className="space-y-2">
                <Label htmlFor={`handle-${option.id}`}>
                  {getFieldConfig(option.type).label} *
                </Label>
                <Input
                  id={`handle-${option.id}`}
                  value={option.handle_or_link}
                  onChange={(e) => handleChange(option.id, 'handle_or_link', e.target.value)}
                  className="border-zinc-700 bg-zinc-800"
                  placeholder={getFieldConfig(option.type).placeholder}
                />
                <p className="text-xs text-zinc-500">
                  {getFieldConfig(option.type).helpText}
                </p>
              </div>

              {/* Last 4 Digits (Venmo only) */}
              {getFieldConfig(option.type).hasLast4 && (
                <div className="space-y-2">
                  <Label htmlFor={`last4-${option.id}`}>Last 4 Digits of Phone</Label>
                  <Input
                    id={`last4-${option.id}`}
                    value={option.account_last_4_digits}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                      handleChange(option.id, 'account_last_4_digits', val);
                    }}
                    className="border-zinc-700 bg-zinc-800"
                    placeholder="1234"
                    maxLength={4}
                  />
                </div>
              )}

              {/* Display Name */}
              <div className="space-y-2">
                <Label htmlFor={`display-${option.id}`}>Display Name</Label>
                <Input
                  id={`display-${option.id}`}
                  value={option.display_name}
                  onChange={(e) => handleChange(option.id, 'display_name', e.target.value)}
                  className="border-zinc-700 bg-zinc-800"
                  placeholder="Optional label shown to participants"
                />
              </div>

              {/* Instructions */}
              <div className="space-y-2">
                <Label htmlFor={`instructions-${option.id}`}>Instructions</Label>
                <Input
                  id={`instructions-${option.id}`}
                  value={option.instructions}
                  onChange={(e) => handleChange(option.id, 'instructions', e.target.value)}
                  className="border-zinc-700 bg-zinc-800"
                  placeholder="Include your name in the note"
                />
              </div>
            </div>

            {/* QR Code Upload */}
            <div className="space-y-2">
              <Label>QR Code (Optional)</Label>
              <div className="flex items-center gap-4">
                {option.qr_code_url ? (
                  <div className="relative">
                    <Image
                      src={option.qr_code_url}
                      alt="Payment QR Code"
                      width={80}
                      height={80}
                      className="rounded-md border border-zinc-700"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleQrDelete(option.id, option.qr_code_url)}
                      className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-red-600 p-0 text-white hover:bg-red-700"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-md border border-dashed border-zinc-700 bg-zinc-800/50">
                    <ImagePlus className="h-6 w-6 text-zinc-500" />
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  <input
                    ref={(el) => {
                      fileInputRefs.current[option.id] = el;
                    }}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleQrUpload(option.id, file);
                      e.target.value = '';
                    }}
                    className="hidden"
                    disabled={option.id.startsWith('new-')}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRefs.current[option.id]?.click()}
                    disabled={uploadingQrId === option.id || option.id.startsWith('new-')}
                    className="border-zinc-700"
                  >
                    {uploadingQrId === option.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : option.qr_code_url ? (
                      'Replace'
                    ) : (
                      'Upload QR Code'
                    )}
                  </Button>
                  {option.id.startsWith('new-') ? (
                    <p className="text-xs text-amber-500">Save the payment option first</p>
                  ) : (
                    <p className="text-xs text-zinc-500">PNG, JPG, or WebP. Max 2MB.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Add Button */}
        <Button
          type="button"
          variant="outline"
          onClick={handleAdd}
          className="w-full border-dashed border-zinc-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Payment Option
        </Button>

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} disabled={isPending || !hasChanges}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

