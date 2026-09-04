-- BANTConfirm / Supabase Security Advisor remediation
-- Run in Supabase SQL Editor against the affected project.
-- Review first: this script does not touch application data.

begin;

-- 1) Harden every overload of the flagged SECURITY DEFINER function.
-- Remove implicit PUBLIC execution and pin its search_path.
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

-- 2) Remove only categories policies that are literally unconditional
-- ("USING (true)" and/or "WITH CHECK (true)"). Do not drop other policies.
do $$
declare pol record;
begin
  if to_regclass('public.categories') is not null then
    for pol in
      select policyname
      from pg_policies
      where schemaname = 'public'
        and tablename = 'categories'
        and (
          coalesce(qual, '') in ('true', '(true)')
          or coalesce(with_check, '') in ('true', '(true)')
        )
    loop
      execute format('drop policy if exists %I on public.categories', pol.policyname);
    end loop;
  end if;
end $$;

-- Keep public catalogue reads working. This policy is created only if no
-- anonymous/authenticated SELECT policy remains.
do $$
declare has_read_policy boolean;
begin
  if to_regclass('public.categories') is not null then
    select exists(
      select 1
      from pg_policies
      where schemaname = 'public'
        and tablename = 'categories'
        and cmd in ('SELECT', 'ALL')
    ) into has_read_policy;

    if not has_read_policy then
      execute 'create policy "public_read_categories" on public.categories for select to anon, authenticated using (id is not null)';
    end if;
  end if;
end $$;

commit;

-- Verification queries
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
