'use client';

import { useState, useTransition } from 'react';
import { ArrowDown, ArrowUp, Loader2, Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { updatePaymentOptions } from '@/features/contests/actions/update-payment-options';
import { Database } from '@/libs/supabase/types';

type PaymentOption = Database['public']['Tables']['payment_options']['Row'];
type PaymentOptionType = Database['public']['Enums']['payment_option_type'];

const PAYMENT_TYPES: { value: PaymentOptionType; label: string; placeholder: string }[] = [
  { value: 'venmo', label: 'Venmo', placeholder: '@username' },
  { value: 'paypal', label: 'PayPal', placeholder: 'email@example.com or PayPal.me link' },
  { value: 'cashapp', label: 'Cash App', placeholder: '$cashtag' },
  { value: 'zelle', label: 'Zelle', placeholder: 'email or phone number' },
  { value: 'other', label: 'Other', placeholder: 'Payment link or instructions' },
];

interface LocalPaymentOption {
  id: string;
  type: PaymentOptionType;
  handle_or_link: string;
  display_name: string;
  instructions: string;
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
    }))
  );

  const [hasChanges, setHasChanges] = useState(false);

  const handleAdd = () => {
    const newOption: LocalPaymentOption = {
      id: `new-${Date.now()}`,
      type: 'venmo',
      handle_or_link: '',
      display_name: '',
      instructions: '',
    };
    setOptions([...options, newOption]);
    setHasChanges(true);
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

  const getPlaceholder = (type: PaymentOptionType) => {
    return PAYMENT_TYPES.find((t) => t.value === type)?.placeholder ?? '';
  };

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
                  onChange={(e) => handleChange(option.id, 'type', e.target.value)}
                  className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
                >
                  {PAYMENT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Handle/Link */}
              <div className="space-y-2">
                <Label htmlFor={`handle-${option.id}`}>Handle / Link *</Label>
                <Input
                  id={`handle-${option.id}`}
                  value={option.handle_or_link}
                  onChange={(e) => handleChange(option.id, 'handle_or_link', e.target.value)}
                  className="border-zinc-700 bg-zinc-800"
                  placeholder={getPlaceholder(option.type)}
                />
              </div>

              {/* Display Name */}
              <div className="space-y-2">
                <Label htmlFor={`display-${option.id}`}>Display Name</Label>
                <Input
                  id={`display-${option.id}`}
                  value={option.display_name}
                  onChange={(e) => handleChange(option.id, 'display_name', e.target.value)}
                  className="border-zinc-700 bg-zinc-800"
                  placeholder={getPlaceholder(option.type)}
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

