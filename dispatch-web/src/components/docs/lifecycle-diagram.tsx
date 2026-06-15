import { cn } from "@/lib/utils";

/**
 * The job state machine drawn as a wiring diagram: status lamps connected
 * by signal paths. Chip colours mirror JobStatusBadge exactly; the retry
 * loop is dashed amber (re-armed), the path to DEAD is dashed red.
 */

type ChipStyle = { box: string; dot: string; text: string };

const CHIPS: Record<string, ChipStyle> = {
  SCHEDULED: {
    box: "fill-sky-500/10 stroke-sky-500/30",
    dot: "fill-sky-400",
    text: "fill-sky-400",
  },
  FIRING: {
    box: "fill-amber-400/10 stroke-amber-400/30",
    dot: "fill-amber-400 animate-pulse",
    text: "fill-amber-400",
  },
  SUCCESS: {
    box: "fill-emerald-500/10 stroke-emerald-500/30",
    dot: "fill-emerald-400",
    text: "fill-emerald-400",
  },
  FAILED: {
    box: "fill-red-500/10 stroke-red-500/30",
    dot: "fill-red-400",
    text: "fill-red-400",
  },
  DEAD: {
    box: "fill-red-950/40 stroke-red-900/50",
    dot: "fill-red-400/50",
    text: "fill-red-400/70",
  },
  CANCELLED: {
    box: "fill-zinc-800/40 stroke-zinc-700/60",
    dot: "fill-zinc-500",
    text: "fill-zinc-500",
  },
};

function Chip({
  x,
  y,
  w,
  status,
}: {
  x: number;
  y: number;
  w: number;
  status: keyof typeof CHIPS;
}) {
  const style = CHIPS[status];
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={28}
        rx={2}
        strokeWidth={1}
        className={style.box}
      />
      <circle cx={x + 14} cy={y + 14} r={2.5} className={style.dot} />
      <text
        x={x + 24}
        y={y + 18}
        fontSize={11}
        letterSpacing={1.5}
        className={cn("font-mono", style.text)}
      >
        {status}
      </text>
    </g>
  );
}

function EdgeLabel({
  x,
  y,
  anchor = "middle",
  tone = "zinc",
  children,
}: {
  x: number;
  y: number;
  anchor?: "start" | "middle";
  tone?: "zinc" | "amber" | "red";
  children: string;
}) {
  const fill =
    tone === "amber"
      ? "fill-amber-400/80"
      : tone === "red"
        ? "fill-red-400/80"
        : "fill-zinc-500";
  return (
    <text
      x={x}
      y={y}
      fontSize={9.5}
      textAnchor={anchor}
      className={cn("font-mono", fill)}
    >
      {children}
    </text>
  );
}

export function LifecycleDiagram({ className }: { className?: string }) {
  return (
    <figure className={className}>
      <div className="overflow-x-auto border border-zinc-800 bg-zinc-950/90 px-4 py-6 sm:px-6">
        <svg
          viewBox="0 0 720 280"
          role="img"
          aria-label="Job lifecycle: SCHEDULED becomes FIRING when fireAt is reached. A 2xx response means SUCCESS. Anything else means FAILED, which re-enters SCHEDULED with backoff of 30 seconds, 1 minute, then 5 minutes, until the third failed attempt marks the job DEAD. A SCHEDULED job can also be CANCELLED via the API."
          className="h-auto w-full min-w-[640px]"
        >
          <defs>
            <marker
              id="lc-zinc"
              viewBox="0 0 8 8"
              refX="7"
              refY="4"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path
                d="M0,0 L8,4 L0,8"
                strokeWidth="1.2"
                className="fill-none stroke-zinc-600"
              />
            </marker>
            <marker
              id="lc-amber"
              viewBox="0 0 8 8"
              refX="7"
              refY="4"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path
                d="M0,0 L8,4 L0,8"
                strokeWidth="1.2"
                className="fill-none stroke-amber-400/80"
              />
            </marker>
            <marker
              id="lc-red"
              viewBox="0 0 8 8"
              refX="7"
              refY="4"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path
                d="M0,0 L8,4 L0,8"
                strokeWidth="1.2"
                className="fill-none stroke-red-400/70"
              />
            </marker>
          </defs>

          {/* SCHEDULED → FIRING */}
          <line
            x1={140}
            y1={50}
            x2={243}
            y2={50}
            strokeWidth={1}
            markerEnd="url(#lc-zinc)"
            className="stroke-zinc-700"
          />
          <EdgeLabel x={192} y={42}>
            fireAt reached
          </EdgeLabel>

          {/* FIRING → SUCCESS */}
          <line
            x1={336}
            y1={50}
            x2={463}
            y2={50}
            strokeWidth={1}
            markerEnd="url(#lc-zinc)"
            className="stroke-zinc-700"
          />
          <EdgeLabel x={400} y={42}>
            2xx response
          </EdgeLabel>

          {/* FIRING → FAILED */}
          <line
            x1={293}
            y1={64}
            x2={293}
            y2={143}
            strokeWidth={1}
            markerEnd="url(#lc-zinc)"
            className="stroke-zinc-700"
          />
          <EdgeLabel x={301} y={108} anchor="start">
            non-2xx · network error
          </EdgeLabel>

          {/* FAILED → DEAD */}
          <line
            x1={336}
            y1={164}
            x2={463}
            y2={164}
            strokeWidth={1}
            strokeDasharray="4 4"
            markerEnd="url(#lc-red)"
            className="stroke-red-400/60"
          />
          <EdgeLabel x={400} y={156} tone="red">
            attempt 3 of 3
          </EdgeLabel>

          {/* FAILED → SCHEDULED (retry loop) */}
          <path
            d="M 250,164 H 112 V 71"
            fill="none"
            strokeWidth={1}
            strokeDasharray="4 4"
            markerEnd="url(#lc-amber)"
            className="stroke-amber-400/70"
          />
          <EdgeLabel x={118} y={178} anchor="start" tone="amber">
            retry · backoff 30s → 1m → 5m
          </EdgeLabel>

          {/* SCHEDULED → CANCELLED */}
          <line
            x1={58}
            y1={64}
            x2={58}
            y2={227}
            strokeWidth={1}
            markerEnd="url(#lc-zinc)"
            className="stroke-zinc-700"
          />
          <EdgeLabel x={66} y={120} anchor="start">
            DELETE /jobs/:id
          </EdgeLabel>

          <Chip x={30} y={36} w={110} status="SCHEDULED" />
          <Chip x={250} y={36} w={86} status="FIRING" />
          <Chip x={470} y={36} w={92} status="SUCCESS" />
          <Chip x={250} y={150} w={86} status="FAILED" />
          <Chip x={470} y={150} w={70} status="DEAD" />
          <Chip x={30} y={234} w={110} status="CANCELLED" />
        </svg>
      </div>
      <figcaption className="mt-3 max-w-2xl font-mono text-[11px] leading-relaxed text-zinc-600">
        A FAILED job is re-armed with backoff until its third attempt fails,
        then it goes DEAD. Only SCHEDULED jobs can be cancelled.
      </figcaption>
    </figure>
  );
}
