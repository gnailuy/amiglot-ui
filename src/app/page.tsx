import { getTranslations } from "next-intl/server";

import HomeSession from "./home-session";

export default async function Home() {
  const t = await getTranslations("home");

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-10 text-foreground">
      <main className="flex w-full max-w-xl flex-col items-center gap-4 text-center">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {t("title")}
        </h1>
        <p className="text-base text-muted-foreground">{t("subtitle")}</p>
        <HomeSession />
      </main>
    </div>
  );
}
