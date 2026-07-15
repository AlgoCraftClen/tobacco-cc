-- Rename the original "sales" funding classification to the broader and
-- accurate "shared" business-funds classification. Shared funds include
-- collected sales and rolled-forward reinvestment capital owned by both
-- partners. They reduce profit and business cash but are never reimbursed.
-- Idempotent: safe to re-run.

alter table public.expenses
  drop constraint if exists expenses_funding_source_check;

update public.expenses
set funding_source = 'shared'
where funding_source = 'sales';

-- Business decision confirmed for the existing records: Clanny could fund
-- these approved operations only after receiving combined business proceeds,
-- so they are not personal advances and must not be reimbursed.
update public.expenses
set funding_source = 'shared'
where partner = 'Clanny'
  and kind = 'expense'
  and approved = true;

update public.expenses
set description = regexp_replace(description, '\[\[funding:sales\]\]', '[[funding:shared]]', 'gi')
where description ~* '\[\[funding:sales\]\]';

alter table public.expenses
  alter column funding_source set default 'shared';

alter table public.expenses
  add constraint expenses_funding_source_check
  check (funding_source in ('personal', 'shared'));
