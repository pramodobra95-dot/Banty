-- BANTConfirm / Supabase Security Advisor remediation
-- Run in Supabase SQL Editor against the affected project.

begin;

-- Harden every overload of public.handle_admin_role_assignment.
-- Removes implicit PUBLIC execution and pins SECURITY DEFINER search_path.
do $$
declare fn record;
begin
  for fn in
    select p.oid::regprocedure as signature
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'handle_admin_role_assignment'
  loop
    execute format('revoke execute on function %s from public', fn.signature);
    execute format(
      'alter function %s set search_path = pg_catalog, public',
      fn.signature
    );
  end loop;
end $$;

-- Categories are public catalogue data. Allow read-only access only.
alter table if exists public.categories enable row level security;

do $$
declare pol record;
begin
  if to_regclass('public.categories') is not null then
    for pol in
      select policyname
      from pg_policies
      where schemaname = 'public' and tablename = 'categories'
    loop
      execute format('drop policy if exists %I on public.categories', pol.policyname);
    end loop;

    create policy "public_read_categories"
      on public.categories
      for select
      to anon, authenticated
      using (id is not null);
  end if;
end $$;

commit;

-- Verification
select p.oid::regprocedure as function_signature,
       p.proconfig,
       has_function_privilege('anon', p.oid, 'EXECUTE') as anon_can_execute
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'handle_admin_role_assignment';

select policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public' and tablename = 'categories';
