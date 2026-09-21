-- Global Tailor — standard taxonomy seed (Phase 1)
-- The three launch garment types and their standard measurement fields.
-- Idempotent: safe to re-run.

insert into public.garment_types (key, name, is_standard)
values
  ('suit',  'Suit',  true),
  ('shirt', 'Shirt', true),
  ('pants', 'Pants', true)
on conflict (key) do nothing;

-- Standard measurement fields (owner_tailor_id null = standard for everyone).
-- unit inches; required unless noted. sort orders the wizard.
insert into public.measurement_fields (garment_type_id, key, label, unit, required, sort)
select gt.id, f.key, f.label, 'in', f.required, f.sort
from public.garment_types gt
join (values
  -- Suit (jacket + trouser)
  ('suit',  'chest',         'Chest',          true,  10),
  ('suit',  'waist',         'Waist',          true,  20),
  ('suit',  'hip',           'Hip / seat',     true,  30),
  ('suit',  'shoulder',      'Shoulder width', true,  40),
  ('suit',  'sleeve_length', 'Sleeve length',  true,  50),
  ('suit',  'jacket_length', 'Jacket length',  true,  60),
  ('suit',  'neck',          'Neck',           false, 70),
  ('suit',  'inseam',        'Inseam',         true,  80),
  ('suit',  'outseam',       'Outseam',        true,  90),
  ('suit',  'thigh',         'Thigh',          false, 100),
  ('suit',  'height',        'Height',         true,  110),
  ('suit',  'weight',        'Weight (lb)',    false, 120),
  -- Shirt
  ('shirt', 'neck',          'Neck',           true,  10),
  ('shirt', 'chest',         'Chest',          true,  20),
  ('shirt', 'waist',         'Waist',          true,  30),
  ('shirt', 'shoulder',      'Shoulder width', true,  40),
  ('shirt', 'sleeve_length', 'Sleeve length',  true,  50),
  ('shirt', 'shirt_length',  'Shirt length',   true,  60),
  ('shirt', 'cuff',          'Cuff',           false, 70),
  -- Pants
  ('pants', 'waist',         'Waist',          true,  10),
  ('pants', 'hip',           'Hip / seat',     true,  20),
  ('pants', 'inseam',        'Inseam',         true,  30),
  ('pants', 'outseam',       'Outseam',        true,  40),
  ('pants', 'thigh',         'Thigh',          false, 50),
  ('pants', 'rise',          'Rise',           false, 60),
  ('pants', 'knee',          'Knee',           false, 70)
) as f(type_key, key, label, required, sort) on f.type_key = gt.key
where gt.is_standard
on conflict (garment_type_id, key, owner_tailor_id) do nothing;
