-- Shared authentication, realtime synchronization, and auditable capital adjustments.
-- Preserves every existing Tracker row. Safe to re-run.

create table if not exists public.capital_adjustments (
  id uuid primary key default gen_random_uuid(),
  from_shipment_id text not null references public.shipments_v2(id) on delete restrict,
  to_shipment_id text not null references public.shipments_v2(id) on delete restrict,
  amount numeric(12,2) not null check (amount > 0),
  allocation_target text not null check (allocation_target in ('Business', 'Clenny', 'Clanny')),
  status text not null default 'pending_partner_decision'
    check (status in ('pending_partner_decision', 'final')),
  affects_ownership boolean not null default false,
  affects_cash boolean not null default false,
  note text not null default '',
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  unique (from_shipment_id, to_shipment_id, amount)
);

create index if not exists capital_adjustments_from_shipment_idx
  on public.capital_adjustments(from_shipment_id);
create index if not exists capital_adjustments_to_shipment_idx
  on public.capital_adjustments(to_shipment_id);

alter table public.shipments_v2 enable row level security;
alter table public.expenses enable row level security;
alter table public.sales enable row level security;
alter table public.capital_adjustments enable row level security;

revoke all on public.shipments_v2 from anon;
revoke all on public.expenses from anon;
revoke all on public.sales from anon;
revoke all on public.capital_adjustments from anon;
revoke all on public.shipments_v2 from public;
revoke all on public.expenses from public;
revoke all on public.sales from public;
revoke all on public.capital_adjustments from public;

grant select, insert, update, delete on public.shipments_v2 to authenticated;
grant select, insert, update, delete on public.expenses to authenticated;
grant select, insert, update, delete on public.sales to authenticated;
grant select, insert, update, delete on public.capital_adjustments to authenticated;

drop policy if exists "cc all shipments_v2" on public.shipments_v2;
drop policy if exists "cc all expenses" on public.expenses;
drop policy if exists "Allow all operations on sales" on public.sales;

drop policy if exists "cc shipments read" on public.shipments_v2;
drop policy if exists "cc shipments read clenny" on public.shipments_v2;
create policy "cc shipments read clenny" on public.shipments_v2
  for select to authenticated
  using (((select auth.jwt())->>'email') = 'clennyminor@gmail.com');
drop policy if exists "cc shipments insert clenny" on public.shipments_v2;
drop policy if exists "cc shipments update clenny" on public.shipments_v2;
drop policy if exists "cc shipments delete clenny" on public.shipments_v2;
create policy "cc shipments insert clenny" on public.shipments_v2
  for insert to authenticated
  with check (((select auth.jwt())->>'email') = 'clennyminor@gmail.com');
create policy "cc shipments update clenny" on public.shipments_v2
  for update to authenticated
  using (((select auth.jwt())->>'email') = 'clennyminor@gmail.com')
  with check (((select auth.jwt())->>'email') = 'clennyminor@gmail.com');
create policy "cc shipments delete clenny" on public.shipments_v2
  for delete to authenticated
  using (((select auth.jwt())->>'email') = 'clennyminor@gmail.com');

drop policy if exists "cc expenses read" on public.expenses;
drop policy if exists "cc expenses read clenny" on public.expenses;
create policy "cc expenses read clenny" on public.expenses
  for select to authenticated
  using (((select auth.jwt())->>'email') = 'clennyminor@gmail.com');
drop policy if exists "cc expenses insert clenny" on public.expenses;
drop policy if exists "cc expenses update clenny" on public.expenses;
drop policy if exists "cc expenses delete clenny" on public.expenses;
create policy "cc expenses insert clenny" on public.expenses
  for insert to authenticated
  with check (((select auth.jwt())->>'email') = 'clennyminor@gmail.com');
create policy "cc expenses update clenny" on public.expenses
  for update to authenticated
  using (((select auth.jwt())->>'email') = 'clennyminor@gmail.com')
  with check (((select auth.jwt())->>'email') = 'clennyminor@gmail.com');
create policy "cc expenses delete clenny" on public.expenses
  for delete to authenticated
  using (((select auth.jwt())->>'email') = 'clennyminor@gmail.com');

drop policy if exists "cc sales read" on public.sales;
drop policy if exists "cc sales read clenny" on public.sales;
create policy "cc sales read clenny" on public.sales
  for select to authenticated
  using (((select auth.jwt())->>'email') = 'clennyminor@gmail.com');
drop policy if exists "cc sales insert clenny" on public.sales;
drop policy if exists "cc sales update clenny" on public.sales;
drop policy if exists "cc sales delete clenny" on public.sales;
create policy "cc sales insert clenny" on public.sales
  for insert to authenticated
  with check (((select auth.jwt())->>'email') = 'clennyminor@gmail.com');
create policy "cc sales update clenny" on public.sales
  for update to authenticated
  using (((select auth.jwt())->>'email') = 'clennyminor@gmail.com')
  with check (((select auth.jwt())->>'email') = 'clennyminor@gmail.com');
create policy "cc sales delete clenny" on public.sales
  for delete to authenticated
  using (((select auth.jwt())->>'email') = 'clennyminor@gmail.com');

drop policy if exists "cc capital adjustments read clenny" on public.capital_adjustments;
drop policy if exists "cc capital adjustments insert clenny" on public.capital_adjustments;
drop policy if exists "cc capital adjustments update clenny" on public.capital_adjustments;
drop policy if exists "cc capital adjustments delete clenny" on public.capital_adjustments;

create policy "cc capital adjustments read clenny" on public.capital_adjustments
  for select to authenticated
  using (((select auth.jwt())->>'email') = 'clennyminor@gmail.com');
create policy "cc capital adjustments insert clenny" on public.capital_adjustments
  for insert to authenticated
  with check (((select auth.jwt())->>'email') = 'clennyminor@gmail.com');
create policy "cc capital adjustments update clenny" on public.capital_adjustments
  for update to authenticated
  using (((select auth.jwt())->>'email') = 'clennyminor@gmail.com')
  with check (((select auth.jwt())->>'email') = 'clennyminor@gmail.com');
create policy "cc capital adjustments delete clenny" on public.capital_adjustments
  for delete to authenticated
  using (((select auth.jwt())->>'email') = 'clennyminor@gmail.com');

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'capital_adjustments'
  ) then
    alter publication supabase_realtime add table public.capital_adjustments;
  end if;
end $$;

-- Temporary, non-owning classification approved by Clenny. This reconciles
-- the SHP #4 -> SHP #5 transition without rewriting either shipment.
insert into public.capital_adjustments (
  from_shipment_id,
  to_shipment_id,
  amount,
  allocation_target,
  status,
  affects_ownership,
  affects_cash,
  note
)
select
  prior.id,
  next.id,
  50.63,
  'Business',
  'pending_partner_decision',
  false,
  false,
  'Temporary business reserve pending a partner decision. Classification only; no cash or ownership change.'
from public.shipments_v2 prior
join public.shipments_v2 next on next.short_seq = 5
where prior.short_seq = 4
  and not exists (
    select 1
    from public.capital_adjustments existing
    where existing.from_shipment_id = prior.id
      and existing.to_shipment_id = next.id
      and existing.amount = 50.63
  );
