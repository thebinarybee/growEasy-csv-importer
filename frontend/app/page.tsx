import CsvUploader from "@/components/CsvUploader";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-50 dark:bg-black">
      <div className="text-center">
        <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
          GrowEasy CSV Importer
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Upload a CSV and let AI map it to your CRM format.
        </p>
      </div>
      <CsvUploader />
    </main>
  );
}