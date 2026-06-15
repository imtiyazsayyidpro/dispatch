import { formatDateTimeLocal, formatDateTimeUtc } from "@/lib/format";

/**
 * A timestamp shown in the viewer's local timezone (tagged with its zone),
 * with the UTC equivalent on hover. The API always schedules on absolute UTC
 * instants — this just makes the dashboard read in the user's own clock so
 * "fires at" is never mistaken for a different timezone.
 */
export function LocalTime({
  iso,
  className,
}: {
  iso: string;
  className?: string;
}) {
  return (
    <time dateTime={iso} title={formatDateTimeUtc(iso)} className={className}>
      {formatDateTimeLocal(iso)}
    </time>
  );
}
