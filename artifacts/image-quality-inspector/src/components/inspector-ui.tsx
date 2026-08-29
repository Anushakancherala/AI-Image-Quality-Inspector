import { Link } from 'wouter';
import { Activity, ChevronRight, CircleAlert, FileImage, Gauge, History, ScanLine, ShieldCheck } from 'lucide-react';
import type { Analysis, AnalysisSummary, HealthStatus, Metrics } from '@workspace/api-client-react';

export function BrandMark() {
  return (
    <Link href="/" className="flex items-center gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary" data-testid="link-brand-home">
      <span className="relative grid size-9 shrink-0 place-items-center rounded-[11px] bg-primary text-primary-foreground shadow-[3px_3px_0_hsl(215_28%_17%)]">
        <ScanLine size={19} strokeWidth={2.5} />
        <span className="absolute -right-1 -top-1 size-2 rounded-full border-2 border-sidebar bg-[#54b6a0]" />
      </span>
      <span>
        <span className="block font-[var(--app-font-serif)] text-[15px] font-bold tracking-tight text-sidebar-foreground">Signal / Lens</span>
        <span className="mt-0.5 block font-mono text-[9px] uppercase tracking-[0.16em] text-sidebar-foreground/50">offline inspection</span>
      </span>
    </Link>
  );
}

export function Sidebar({ health, healthCheck }: { health?: HealthStatus; healthCheck?: HealthStatus }) {
  const healthy = health?.status === 'ok' || health?.status === 'healthy' || healthCheck?.status === 'ok' || healthCheck?.status === 'healthy';
  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-sidebar-border bg-sidebar px-5 py-4 text-sidebar-foreground md:min-h-[100dvh] md:w-[246px] md:border-b-0 md:border-r md:px-4 md:py-6">
      <BrandMark />
      <nav className="mt-8 flex gap-1 md:mt-14 md:block" aria-label="Primary navigation">
        <Link href="/" className="group flex items-center gap-3 rounded-lg bg-sidebar-accent px-3 py-2.5 text-sm font-semibold text-sidebar-accent-foreground transition-colors hover:bg-sidebar-accent/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring" data-testid="link-nav-inspect">
          <Activity size={16} className="text-primary" />
          <span>Inspect image</span>
          <span className="ml-auto hidden size-1.5 rounded-full bg-primary md:block" />
        </Link>
        <Link href="/" className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/65 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring" data-testid="link-nav-history">
          <History size={16} />
          <span>Recent analyses</span>
        </Link>
      </nav>
      <div className="mt-auto hidden rounded-xl border border-sidebar-border bg-sidebar-accent/50 p-3 md:block">
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-sidebar-foreground/50">
          <span className={`size-1.5 rounded-full ${healthy ? 'bg-[#54b6a0]' : 'bg-primary'}`} />
          Engine status
        </div>
        <p className="mt-2 text-xs font-semibold text-sidebar-foreground">{healthy ? 'Ready for inspection' : 'Connecting to engine'}</p>
        <p className="mt-1 text-[11px] leading-4 text-sidebar-foreground/45">Runs locally. Your image stays on this machine.</p>
      </div>
      <div className="mt-4 hidden items-center justify-between border-t border-sidebar-border pt-4 md:flex">
        <span className="font-mono text-[10px] text-sidebar-foreground/40">SL / 0.4.2</span>
        <span className="flex items-center gap-1 text-[10px] text-sidebar-foreground/45"><ShieldCheck size={12} /> private</span>
      </div>
    </aside>
  );
}

export function PageHeader({ eyebrow, title, note }: { eyebrow: string; title: string; note?: string }) {
  return (
    <header className="mb-8 animate-rise-in">
      <div className="flex items-center gap-2 font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        <span className="size-1.5 rounded-sm bg-primary" />
        {eyebrow}
      </div>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <h1 className="max-w-2xl font-[var(--app-font-serif)] text-3xl font-bold tracking-[-0.045em] text-foreground sm:text-[40px] sm:leading-[1.05]">{title}</h1>
        {note && <p className="max-w-[250px] text-right text-xs leading-5 text-muted-foreground">{note}</p>}
      </div>
    </header>
  );
}

export function SummaryStrip({ summary, loading }: { summary?: AnalysisSummary; loading?: boolean }) {
  const items = [
    { label: 'Inspections', value: summary?.total ?? 0, tone: 'text-foreground' },
    { label: 'Acceptable', value: summary?.acceptable ?? 0, tone: 'text-[#318d79]' },
    { label: 'Needs attention', value: (summary?.degraded ?? 0) + (summary?.potentially_defective ?? 0), tone: 'text-[#c46b42]' },
    { label: 'Mean score', value: summary ? `${Math.round(summary.average_score)}` : '—', tone: 'text-foreground', suffix: summary ? '/100' : '' },
  ];
  return (
    <section className="mb-8 grid grid-cols-2 overflow-hidden rounded-xl border border-border bg-card sm:grid-cols-4" data-testid="section-summary">
      {items.map((item, index) => (
        <div key={item.label} className={`relative px-4 py-4 sm:px-5 ${index > 0 ? 'border-l border-border' : ''} ${index > 1 ? 'border-t sm:border-t-0' : ''}`}>
          {loading ? <div className="h-7 w-14 animate-pulse rounded bg-muted" /> : <p className={`font-[var(--app-font-serif)] text-2xl font-bold tracking-tight ${item.tone}`} data-testid={`text-summary-${item.label.toLowerCase().replaceAll(' ', '-')}`}>{item.value}<span className="ml-1 text-xs font-medium text-muted-foreground">{item.suffix}</span></p>}
          <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">{item.label}</p>
        </div>
      ))}
    </section>
  );
}

export function StatusBadge({ label }: { label: string }) {
  const acceptable = label === 'ACCEPTABLE';
  const defective = label === 'POTENTIALLY_DEFECTIVE';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.08em] ${acceptable ? 'bg-[#d9efe9] text-[#267966]' : defective ? 'bg-[#f6dfd3] text-[#a85131]' : 'bg-[#f4ebc9] text-[#936d14]'}`}>
      <span className={`size-1.5 rounded-full ${acceptable ? 'bg-[#318d79]' : defective ? 'bg-[#c46b42]' : 'bg-[#c99b24]'}`} />
      {label.replaceAll('_', ' ')}
    </span>
  );
}

export function ScoreMark({ score, size = 'large' }: { score: number; size?: 'large' | 'small' }) {
  const value = Math.round(score);
  const color = value >= 75 ? '#318d79' : value >= 50 ? '#c99b24' : '#c46b42';
  return (
    <div className={`relative grid shrink-0 place-items-center rounded-full ${size === 'large' ? 'size-[128px]' : 'size-12'}`} style={{ background: `conic-gradient(${color} ${Math.max(value, 2)}%, hsl(var(--muted)) 0)` }} data-testid={`score-mark-${value}`}>
      <div className={`grid place-items-center rounded-full bg-card ${size === 'large' ? 'size-[106px]' : 'size-10'}`}>
        <span className={`font-[var(--app-font-serif)] font-bold tracking-[-0.06em] ${size === 'large' ? 'text-4xl' : 'text-sm'}`} style={{ color }}>{value}</span>
        {size === 'large' && <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">/ 100</span>}
      </div>
    </div>
  );
}

export function MetricBar({ label, value, suffix = '', tone = 'primary' }: { label: string; value: number; suffix?: string; tone?: 'primary' | 'teal' | 'coral' }) {
  const toneColor = tone === 'teal' ? '#318d79' : tone === 'coral' ? '#c46b42' : '#c99b24';
  return (
    <div className="group" data-testid={`metric-${label}`}>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="text-xs font-medium text-foreground/75">{label}</span>
        <span className="font-mono text-[10px] text-muted-foreground">{typeof value === 'number' ? value.toFixed(value < 1 ? 2 : 1) : value}{suffix}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full origin-left rounded-full transition-transform duration-700 ease-out" style={{ width: `${Math.min(Math.max(value * (value < 1 ? 100 : 1), 4), 100)}%`, backgroundColor: toneColor }} />
      </div>
    </div>
  );
}

export function AnalysisRow({ analysis }: { analysis: Analysis }) {
  const date = new Date(analysis.timestamp);
  return (
    <Link href={`/history/${analysis.id}`} className="group grid grid-cols-[1fr_auto] items-center gap-3 border-b border-border px-4 py-3.5 transition-colors last:border-0 hover:bg-muted/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary sm:grid-cols-[minmax(0,1fr)_130px_100px_34px]" data-testid={`link-analysis-${analysis.id}`}>
      <div className="flex min-w-0 items-center gap-3">
        <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground"><FileImage size={15} /></div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{analysis.filename}</p>
          <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">{date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} · {date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</p>
        </div>
      </div>
      <div className="hidden sm:block"><StatusBadge label={analysis.quality_label} /></div>
      <div className="text-right"><span className="font-mono text-xs font-medium text-foreground">{Math.round(analysis.quality_score)}<span className="text-muted-foreground">/100</span></span></div>
      <ChevronRight size={15} className="text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
    </Link>
  );
}

export function MetricGrid({ metrics }: { metrics: Metrics }) {
  const data = [
    ['Sharpness', metrics.sharpness, 'primary'],
    ['Brightness', metrics.brightness, 'teal'],
    ['Contrast', metrics.contrast, 'primary'],
    ['Noise', metrics.noise, 'coral'],
    ['Saturation', metrics.saturation, 'teal'],
    ['Edge density', metrics.edge_density, 'primary'],
  ] as const;
  return (
    <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
      {data.map(([label, value, tone]) => <MetricBar key={label} label={label} value={value} tone={tone} />)}
    </div>
  );
}

export function LoadingRows() {
  return <div className="space-y-2 p-4" data-testid="loading-history"><div className="h-12 animate-pulse rounded-lg bg-muted" /><div className="h-12 animate-pulse rounded-lg bg-muted" /><div className="h-12 animate-pulse rounded-lg bg-muted" /></div>;
}

export function ErrorMessage({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-[#e8c8ba] bg-[#fbede7] p-4 text-[#8f4228]" role="alert" data-testid="status-error">
      <CircleAlert size={17} className="mt-0.5 shrink-0" />
      <div className="flex-1"><p className="text-sm font-semibold">Something interrupted the inspection</p><p className="mt-1 text-xs leading-5 opacity-80">{message}</p></div>
      <button type="button" onClick={onRetry} className="rounded-md px-2 py-1 text-xs font-semibold underline underline-offset-2 outline-none hover:no-underline focus-visible:ring-2 focus-visible:ring-[#c46b42]" data-testid="button-retry">Retry</button>
    </div>
  );
}

export function EmptyHistory() {
  return (
    <div className="grid place-items-center px-5 py-12 text-center" data-testid="empty-history">
      <div className="grid size-11 place-items-center rounded-xl border border-dashed border-border bg-muted/40 text-muted-foreground"><Gauge size={18} /></div>
      <p className="mt-4 text-sm font-semibold text-foreground">No inspections yet</p>
      <p className="mt-1 max-w-xs text-xs leading-5 text-muted-foreground">Upload a clear image above to create your first evidence-backed quality report.</p>
    </div>
  );
}