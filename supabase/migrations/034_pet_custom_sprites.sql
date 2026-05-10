-- Add custom_sprites JSONB column to virtual_pets for spritesheet animation
ALTER TABLE virtual_pets ADD COLUMN IF NOT EXISTS custom_sprites JSONB DEFAULT NULL;

-- Note: Also create a 'pets' Storage bucket in Supabase Dashboard
-- (Storage > New Bucket > name: "pets", Public: true)
