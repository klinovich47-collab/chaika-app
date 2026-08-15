revoke execute on function public.create_event(text,text,text,timestamptz,timestamptz,integer,text,double precision,double precision,smallint,text,text,text,text) from public, anon, authenticated;
grant execute on function public.create_event(text,text,text,timestamptz,timestamptz,integer,text,double precision,double precision,smallint,text,text,text,text) to service_role;

revoke execute on function public.toggle_event_attendance(uuid,uuid) from public, anon, authenticated;
grant execute on function public.toggle_event_attendance(uuid,uuid) to service_role;
