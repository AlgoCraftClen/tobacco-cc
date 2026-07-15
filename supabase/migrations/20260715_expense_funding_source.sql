-- Records whether an approved operation was paid personally or directly
-- from collected sales cash. Personally paid operations are reimbursed;
-- sales-funded operations are already paid and only reduce cash/profit.
-- Idempotent: safe to re-run.

alter table public.expenses
  add column if not exists funding_source text;

-- Preserve the established workflow for records created before this field:
-- Clanny paid inbound costs personally; Clenny paid local costs from sales.
update public.expenses
set funding_source = case
  when description ~* '\[\[funding:sales\]\]\s*$' then 'sales'
  when description ~* '\[\[funding:personal\]\]\s*$' then 'personal'
  when partner = 'Clenny' then 'sales'
  else 'personal'
end
where funding_source is null;

-- Remove the compatibility marker after it has been normalized into the
-- dedicated column. The app also strips it when reading older rows.
update public.expenses
set description = trim(regexp_replace(description, '\s*\[\[funding:(personal|sales)\]\]\s*$', '', 'i'))
where description ~* '\[\[funding:(personal|sales)\]\]\s*$';

alter table public.expenses
  alter column funding_source set default 'personal',
  alter column funding_source set not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'expenses_funding_source_check'
      and conrelid = 'public.expenses'::regclass
  ) then
    alter table public.expenses
      add constraint expenses_funding_source_check
      check (funding_source in ('personal', 'sales'));
  end if;
end $$;
