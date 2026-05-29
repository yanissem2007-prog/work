export default function Loading() {
  return (
    <div className="fixed inset-0 z-[150] grid place-items-center bg-bg">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-grad-accent blur-2xl opacity-60 animate-pulse-glow" />
        <div className="relative size-12 rounded-2xl bg-grad-accent shadow-glow grid place-items-center">
          <span className="block size-4 rounded-md bg-bg/40" />
        </div>
      </div>
    </div>
  );
}
