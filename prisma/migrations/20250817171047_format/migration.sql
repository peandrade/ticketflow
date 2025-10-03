-- DropIndex
DROP INDEX "public"."Performance_startsAt_venueId_idx";

-- CreateIndex
CREATE INDEX "Performance_eventId_startsAt_venueId_idx" ON "public"."Performance"("eventId", "startsAt", "venueId");
