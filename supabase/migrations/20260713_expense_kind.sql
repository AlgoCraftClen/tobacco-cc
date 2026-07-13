-- Adds expenses.kind so the app can distinguish business expenses from
-- personal withdrawals. Withdrawals reduce cash on hand and are deducted
-- from the withdrawing partner's payout; they are never contributions.
-- Idempotent: safe to re-run.

alter table public.expenses
  add column if not exists kind text not null default 'expense';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'expenses_kind_check' and conrelid = 'public.expenses'::regclass
  ) then
    alter table public.expenses
      add constraint expenses_kind_check check (kind in ('expense', 'withdrawal'));
  end if;
end $$;
