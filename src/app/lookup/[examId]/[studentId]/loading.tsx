export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-100 py-6">
      <div className="mx-auto max-w-[720px] animate-pulse space-y-3 px-2">
        <div className="h-8 w-32 rounded bg-gray-200" />
        <div className="h-[600px] rounded-lg bg-white shadow-sm" />
      </div>
    </div>
  );
}
