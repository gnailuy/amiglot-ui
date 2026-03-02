import Link from "next/link";

type StatusState = "loading" | "success" | "error";

type VerifyCardProps = {
  title: string;
  description: string;
  status: StatusState;
  message: string;
  homeLabel: string;
};

export default function VerifyCard({
  title,
  description,
  status,
  message,
  homeLabel,
}: VerifyCardProps) {
  const statusStyles =
    status === "error"
      ? "bg-destructive/10 text-destructive"
      : status === "success"
        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
        : "bg-muted text-muted-foreground";

  return (
    <div className="min-h-screen bg-background px-4 py-12 text-foreground">
      <div className="mx-auto flex w-full max-w-lg flex-col justify-center">
        <div className="rounded-lg border border-muted/60 bg-card text-card-foreground shadow-sm">
          <div className="space-y-2 border-b border-muted/60 px-6 py-4">
            <h1 className="text-2xl font-semibold leading-none tracking-tight">{title}</h1>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          <div className="px-6 py-5">
            <div className={`rounded-md px-4 py-3 text-sm ${statusStyles}`} data-state={status}>
              {message}
            </div>
          </div>
          <div className="border-t border-muted/60 px-6 py-4">
            <Link className="text-sm text-muted-foreground hover:text-foreground" href="/">
              {homeLabel}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
