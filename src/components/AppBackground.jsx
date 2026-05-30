export default function AppBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <div className="orb orb-gold animate-float-slow absolute -left-24 -top-24 h-72 w-72 rounded-full blur-3xl sm:h-96 sm:w-96" />
      <div className="orb orb-blue animate-float-medium absolute -right-20 top-1/4 h-64 w-64 rounded-full blur-3xl sm:h-80 sm:w-80" />
      <div className="orb orb-green animate-float-fast absolute bottom-0 left-1/3 h-56 w-56 rounded-full blur-3xl sm:h-72 sm:w-72" />
      <div className="orb orb-purple animate-float-slow absolute bottom-1/4 right-1/4 h-48 w-48 rounded-full blur-3xl sm:h-64 sm:w-64" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(247,201,72,0.06),transparent_55%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(10,13,20,0.85))]" />
    </div>
  );
}
