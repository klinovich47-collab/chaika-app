-- Legacy imports stored one row per KudaGo event and overwrote repeated dates.
-- New importers use event:occurrence IDs, so these reproducible rows are replaced.
delete from public.events
where source = 'kudago'
  and source_event_id ~ '^[0-9]+$';
