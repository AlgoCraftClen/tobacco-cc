-- Remove public write access from legacy/demo tables that remain in this project.
-- Preserves every row and restricts access to the authorized Clenny account.

do $$
declare
  table_name text;
  policy_name text;
begin
  foreach table_name in array array[
    'contributions',
    'customers',
    'invoices',
    'products',
    'purchases',
    'shipments'
  ]
  loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on public.%I from anon', table_name);
    execute format('revoke all on public.%I from public', table_name);
    execute format(
      'grant select, insert, update, delete on public.%I to authenticated',
      table_name
    );

    for policy_name in
      select policyname
      from pg_policies
      where schemaname = 'public'
        and tablename = table_name
    loop
      execute format('drop policy %I on public.%I', policy_name, table_name);
    end loop;

    execute format(
      'create policy %I on public.%I for all to authenticated using (((select auth.jwt())->>''email'') = ''clennyminor@gmail.com'') with check (((select auth.jwt())->>''email'') = ''clennyminor@gmail.com'')',
      'cc legacy clenny access',
      table_name
    );
  end loop;
end $$;
