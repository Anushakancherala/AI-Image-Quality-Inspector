import { ArrowLeft, CheckCircle2, CircleAlert, FileImage, Info, Ruler, ShieldCheck } from 'lucide-react';
import { Link, useParams } from 'wouter';
import { getGetAnalysisQueryKey, useGetAnalysis } from '@workspace/api-client-react';
import { ErrorMessage, MetricGrid, ScoreMark, Sidebar, StatusBadge } from '@/components/inspector-ui';

function DetailSkeleton() {
  return <div className="space-y-5" data-testid="loading-analysis-detail"><div className="h-8 w-2/3 animate-pulse rounded-lg bg-muted" /><div className="h-52 animate-pulse rounded-2xl bg-muted" /><div className="h-64 animate-pulse rounded-2xl bg-muted" /></div>;
}

function humanizeFeature(feature: string) {
  return feature.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function AnalysisDetail() {
  const params = useParams<{ id: string }>();
  const id = params.id ?? '';
  const analysis = useGetAnalysis(id, { query: { enabled: Boolean(id), queryKey: getGetAnalysisQueryKey(id), retry: false } });
  const item = analysis.data;

  return (
    <div className="grain min-h-[100dvh] bg-background text-foreground">
      <div className="flex min-h-[100dvh] flex-col md:flex-row">
        <Sidebar />
        <main className="min-w-0 flex-1">
          <div className="mx-auto max-w-[1180px] px-5 py-8 sm:px-8 sm:py-10 lg:px-12">
            <Link href="/" className="mb-8 inline-flex items-center gap-2 rounded-md text-xs font-bold text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary" data-testid="link-back-home"><ArrowLeft size={15} /> Back to workspace</Link>
            {analysis.isLoading ? <DetailSkeleton /> : analysis.isError || !item ? (
              <div className="mx-auto mt-16 max-w-lg text-center" data-testid="status-analysis-not-found">
                <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#fbede7] text-[#c46b42]"><CircleAlert size={24} /></div>
                <h1 className="mt-5 font-[var(--app-font-serif)] text-3xl font-bold tracking-tight">Analysis not found</h1>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">This inspection may have been removed or is not available in the local history.</p>
                <Link href="/" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-[2px_2px_0_hsl(215_28%_17%)] outline-none transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-primary" data-testid="link-return-workspace">Return to workspace</Link>
                {analysis.isError && <div className="mx-auto mt-8 max-w-md text-left"><ErrorMessage message="The local history service returned an error." onRetry={() => void analysis.refetch()} /></div>}
              </div>
            ) : (
              <div className="animate-rise-in">
                <header className="mb-8 flex flex-wrap items-start justify-between gap-5">
                  <div>
                    <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground"><span className="size-1.5 rounded-sm bg-primary" /> Inspection record</div>
                    <h1 className="mt-3 flex items-center gap-3 font-[var(--app-font-serif)] text-3xl font-bold tracking-[-0.045em] sm:text-[40px]"><FileImage className="hidden text-muted-foreground sm:block" size={30} strokeWidth={1.7} /><span className="max-w-[680px] break-words">{item.filename}</span></h1>
                    <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.11em] text-muted-foreground">{new Date(item.timestamp).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })} · record {item.id.slice(0, 8)}</p>
                  </div>
                  <StatusBadge label={item.quality_label} />
                </header>

                <section className="grid gap-8 overflow-hidden rounded-2xl border border-border bg-card p-5 sm:grid-cols-[180px_1fr] sm:p-8" data-testid="section-analysis-summary">
                  <div className="flex items-center gap-4 sm:block">
                    <ScoreMark score={item.quality_score} />
                    <div className="sm:mt-4"><p className="text-sm font-bold text-foreground">Trust score</p><p className="mt-1 text-xs leading-5 text-muted-foreground">A composite read of visual clarity and signal stability.</p></div>
                  </div>
                  <div className="border-t border-border pt-6 sm:border-l sm:border-t-0 sm:pl-8 sm:pt-0">
                    <div className="flex items-center gap-2"><span className="grid size-6 place-items-center rounded-md bg-[#d9efe9] text-[#318d79]"><ShieldCheck size={14} /></span><h2 className="text-sm font-bold">What the engine found</h2></div>
                    {item.issues.length ? <div className="mt-5 space-y-3">{item.issues.map((issue, index) => <div key={`${issue.type}-${index}`} className="rounded-xl border border-border bg-muted/25 p-3.5" data-testid={`issue-${index}`}><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-bold text-foreground">{humanizeFeature(issue.type)}</p><span className={`font-mono text-[9px] uppercase tracking-[0.1em] ${issue.severity === 'critical' || issue.severity === 'high' ? 'text-[#a85131]' : 'text-[#936d14]'}`}>{issue.severity} · {Math.round(issue.confidence * 100)}% confidence</span></div><p className="mt-1.5 text-xs leading-5 text-muted-foreground">{issue.description || 'The engine detected a condition worth reviewing.'}</p></div>)}</div> : <div className="mt-5 flex items-center gap-2 rounded-xl bg-[#e5f0eb] px-3.5 py-3 text-xs font-medium text-[#318d79]"><CheckCircle2 size={16} /> No quality issues were detected.</div>}
                  </div>
                </section>

                <div className="mt-8 grid gap-8 lg:grid-cols-[1.05fr_.95fr]">
                  <section className="rounded-2xl border border-border bg-card p-5 sm:p-7" data-testid="section-metrics">
                    <div className="mb-7 flex items-start justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[0.17em] text-muted-foreground">Signal map</p><h2 className="mt-1 text-lg font-bold tracking-tight">Image metrics</h2></div><div className="flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 font-mono text-[10px] text-muted-foreground"><Ruler size={12} /> {item.metrics.width} × {item.metrics.height}</div></div>
                    <MetricGrid metrics={item.metrics} />
                    <div className="mt-7 grid grid-cols-2 gap-3 border-t border-border pt-5"><div><p className="font-mono text-[9px] uppercase tracking-[0.13em] text-muted-foreground">Width</p><p className="mt-1 text-sm font-bold">{item.metrics.width}<span className="ml-1 text-xs font-normal text-muted-foreground">px</span></p></div><div><p className="font-mono text-[9px] uppercase tracking-[0.13em] text-muted-foreground">Height</p><p className="mt-1 text-sm font-bold">{item.metrics.height}<span className="ml-1 text-xs font-normal text-muted-foreground">px</span></p></div></div>
                  </section>
                  <section className="rounded-2xl border border-border bg-[#f7f2de] p-5 sm:p-7" data-testid="section-explainability">
                    <div className="flex items-start justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[0.17em] text-[#927d3b]">Why this score</p><h2 className="mt-1 text-lg font-bold tracking-tight text-[#40391f]">Top factors</h2></div><Info size={17} className="text-[#927d3b]" /></div>
                    <div className="mt-6 space-y-5">{item.explainability.top_factors.map((factor, index) => <div key={`${factor.feature}-${index}`} data-testid={`factor-${index}`}><div className="flex items-center justify-between gap-3"><p className="text-xs font-bold text-[#40391f]">{humanizeFeature(factor.feature)}</p><span className="font-mono text-[10px] text-[#927d3b]">{Math.round(factor.importance * 100)}% impact</span></div><div className="mt-2 h-1.5 rounded-full bg-[#e9dfbb]"><div className="h-full rounded-full bg-[#c99b24]" style={{ width: `${Math.min(Math.max(factor.importance * 100, 4), 100)}%` }} /></div><p className="mt-2 text-xs leading-5 text-[#756a43]">{factor.interpretation} <span className="font-mono text-[10px] text-[#927d3b]">value {factor.value.toFixed(2)}</span></p></div>)}</div>
                    <div className="mt-7 border-t border-[#e7dcba] pt-3 font-mono text-[9px] uppercase tracking-[0.12em] text-[#927d3b]">Model version · {item.explainability.model_version}</div>
                  </section>
                </div>
                <footer className="mt-10 flex items-center justify-between border-t border-border pt-5 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground"><Link href="/" className="inline-flex items-center gap-2 font-bold hover:text-foreground" data-testid="link-footer-back"><ArrowLeft size={13} /> Workspace</Link><span>Evidence preserved locally</span></footer>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}