import type { ReactNode } from "react";

import { Panel } from "@/components/app/panel";
import {
  AuthTag,
  MethodBadge,
  type AuthKind,
  type HttpMethod,
} from "@/components/docs/primitives";

/**
 * One endpoint as an instrument readout: method lamp, mono path, auth
 * legend on the header rail, then schema rows and example transcripts in
 * the well below. Deliberately not a table.
 */
export function Endpoint({
  method,
  path,
  auth,
  description,
  children,
}: {
  method: HttpMethod;
  path: string;
  auth: AuthKind;
  description: ReactNode;
  children?: ReactNode;
}) {
  return (
    <Panel>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-zinc-800/70 px-4 py-3 sm:px-5">
        <MethodBadge method={method} />
        <code className="min-w-0 font-mono text-[13px] break-all text-zinc-100">
          {path}
        </code>
        <span className="ml-auto">
          <AuthTag auth={auth} />
        </span>
      </div>
      <div className="space-y-5 px-4 py-4 sm:px-5">
        <p className="max-w-2xl text-sm leading-relaxed text-zinc-400">
          {description}
        </p>
        {children}
      </div>
    </Panel>
  );
}
