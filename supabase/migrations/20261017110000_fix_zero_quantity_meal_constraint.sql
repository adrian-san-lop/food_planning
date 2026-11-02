-- Replace the legacy unnamed CHECK that still required every meal movement
-- to have a strictly negative quantity. Preserve the reversal and other
-- inventory checks; this enables zero-quantity idempotency markers only.
begin;

alter table public.inventory_movements
  drop constraint if exists inventory_movements_check1,
  drop constraint if exists inventory_movements_meal_shortfall_check;

alter table public.inventory_movements
  add constraint inventory_movements_meal_shortfall_check
    check (
      (movement_kind = 'meal' and source_completion_id is not null)
      or (movement_kind <> 'meal' and shortfall_quantity = 0)
    );

commit;
