'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { AUTH_REDIRECT_PARAM } from '@/lib/constants';

type UnlockFormProps = {
  action: (state: UnlockFormState, formData: FormData) => Promise<UnlockFormState>;
  defaultRedirect?: string;
  initialState?: UnlockFormState;
};

export type UnlockFormState = {
  error?: string;
};

const SubmitButton = () => {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="inline-flex w-full items-center justify-center rounded-full bg-brand px-5 py-3 text-base font-medium text-white shadow hover:bg-brand-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-70"
      disabled={pending}
    >
      {pending ? 'Unlocking…' : 'Unlock Workspace'}
    </button>
  );
};

export const UnlockForm = ({ action, defaultRedirect = '/dashboard', initialState = {} }: UnlockFormProps) => {
  const [state, formAction] = useFormState(action, initialState);

  return (
    <form className="space-y-6" action={formAction}>
      <input type="hidden" name={AUTH_REDIRECT_PARAM} value={defaultRedirect} />
      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium text-slate-700">
          Workspace Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 shadow focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
          placeholder="Enter password"
        />
      </div>
      {state.error ? (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{state.error}</p>
      ) : null}
      <SubmitButton />
      <p className="text-xs text-slate-500">
        Don’t have the password? Contact the Water Reporter engineering team.
      </p>
    </form>
  );
};
