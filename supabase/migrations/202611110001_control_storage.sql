-- Etapa 1: persistência compatível com a API e os backups atuais.
-- Executar no projeto escolhido após revisar; não apaga ou altera tabelas existentes.
begin;

create table if not exists public.cozinha_control_records (
  key text primary key check (length(key) between 1 and 200),
  data jsonb not null,
  etag uuid not null default gen_random_uuid(),
  updated_at timestamptz not null default now()
);
alter table public.cozinha_control_records enable row level security;
revoke all on public.cozinha_control_records from public, anon, authenticated;
grant select, insert, update, delete on public.cozinha_control_records to service_role;

-- Escrita condicional atômica: duas reservas concorrentes não usam a mesma revisão.
create or replace function public.cozinha_control_write(
  p_key text,
  p_data jsonb,
  p_expected_etag uuid default null,
  p_only_if_new boolean default false
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare result_etag uuid;
begin
  if p_only_if_new and p_expected_etag is not null then
    raise exception 'Condições de escrita incompatíveis' using errcode = '22023';
  end if;
  if p_only_if_new then
    insert into public.cozinha_control_records (key, data)
    values (p_key, p_data)
    on conflict (key) do nothing
    returning etag into result_etag;
  elsif p_expected_etag is not null then
    update public.cozinha_control_records
    set data = p_data, etag = gen_random_uuid(), updated_at = now()
    where key = p_key and etag = p_expected_etag
    returning etag into result_etag;
  else
    insert into public.cozinha_control_records (key, data)
    values (p_key, p_data)
    on conflict (key) do update
      set data = excluded.data, etag = gen_random_uuid(), updated_at = now()
    returning etag into result_etag;
  end if;
  return jsonb_build_object('modified', result_etag is not null, 'etag', result_etag);
end;
$$;
revoke all on function public.cozinha_control_write(text,jsonb,uuid,boolean) from public, anon, authenticated;
grant execute on function public.cozinha_control_write(text,jsonb,uuid,boolean) to service_role;

-- Consultas de relatório; mantêm as permissões da tabela subjacente.
create or replace view public.cozinha_prizes with (security_invoker = true) as
select prize->>'id' as id, prize->>'name' as name,
       (prize->>'qty')::integer as total_stock,
       (prize->>'perDay')::integer as daily_limit,
       (prize->>'weight')::numeric as weight
from public.cozinha_control_records,
     lateral jsonb_array_elements(data #> '{db,prizes}') as prize
where key = 'event';

create or replace view public.cozinha_games with (security_invoker = true) as
select (game->>'id')::bigint as id, (game->>'day')::integer as day,
       game->>'time' as played_at, game->>'recipe' as recipe,
       (game->>'score')::numeric as score,
       (game->>'completed')::boolean as completed,
       game->>'prize' as prize_id, game->>'status' as status,
       game->'recipeDetails' as recipe_details
from public.cozinha_control_records,
     lateral jsonb_array_elements(data #> '{db,games}') as game
where key = 'event';
revoke all on public.cozinha_prizes, public.cozinha_games from public, anon, authenticated;
grant select on public.cozinha_prizes, public.cozinha_games to service_role;

commit;
