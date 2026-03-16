ALTER TABLE "DailyEntry"
ADD COLUMN     "temperatureMin" DECIMAL(4,1),
ADD COLUMN     "temperatureMax" DECIMAL(4,1);

UPDATE "DailyEntry"
SET
  "temperatureMin" = COALESCE("temperatureMin", "temperature"),
  "temperatureMax" = COALESCE("temperatureMax", "temperature")
WHERE "temperature" IS NOT NULL
  AND "temperature" <> 0
  AND "temperatureMin" IS NULL
  AND "temperatureMax" IS NULL;