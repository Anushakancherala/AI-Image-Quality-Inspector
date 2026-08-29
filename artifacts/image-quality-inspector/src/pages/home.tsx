import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowUpRight, Check, FileImage, LockKeyhole, RotateCcw, Upload, X } from 'lucide-react';
import { Link } from 'wouter';
import {
  getGetAnalysisSummaryQueryKey,
  getGetHealthQueryKey,
  getHealthCheckQueryKey,
  getListAnalysesQueryKey,
  useAnalyzeImage,
  useGetHealth,
  useGetAnalysisSummary,
  useHealthCheck,
  useListAnalyses,
} from '@workspace/api-client-react';
import type { Analysis } from '@workspace/api-client-react';
import { ErrorMessage, EmptyHistory, LoadingRows, MetricGrid, PageHeader, ScoreMark, Sidebar, StatusBadge, SummaryStrip, AnalysisRow } from '@/components/inspector-ui';

function UploadPanel({ onComplete }: { onComplete: (analysis: Analysis) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [dragging, setDragging] = useState(false);
  const [fileError, setFileError] = useState('');
  const queryClient = useQueryClient();
  const analyzeImage = useAnalyzeImage();

  useEffect(() => {
    if (!file) {
      setPreview('');
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const chooseFile = (next: File | undefined) => {
    if (!next) return;
    if (!next.type.startsWith('image/')) {
      setFileError('That file is not an image. Choose a PNG, JPEG, WEBP, TIFF, or another supported image.');
      setFile(null);
      return;
    }
    if (next.size > 15 * 1024 * 1024) {
      setFileError('This image is larger than 15 MB. Choose a smaller file for offline inspection.');
      setFile(null);
      return;
    }
    setFileError('');
    setFile(next);
  };

  const submit = () => {
    if (!file || analyzeImage.isPending) return;
    analyzeImage.mutate({ data: { file } }, {
      onSuccess: (analysis) => {
        onComplete(analysis);
        void queryClient.invalidateQueries({ queryKey: getListAnalysesQueryKey() });
        void queryClient.invalidateQueries({ queryKey: getGetAnalysisSummaryQueryKey() });
        void queryClient.invalidateQueries({ queryKey: getHealthCheckQueryKey() });
        void queryClient.invalidateQueries({ queryKey: getGetHealthQueryKey() });
      },
    });
  };

  return (
    <section className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-[0_14px_35px_hsl(215_28%_17%/0.06)] animate-rise-in delay-1" data-testid="section-upload">
      <div className="absolute right-0 top-0 h-24 w-24 translate-x-8 -translate-y-8 rounded-full border-[14px] border-primary/15" />
      <div className="border-b border-border px-5 py-4 sm:px-7">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.17em] text-muted-foreground">01 / source image</p>
            <h2 className="mt-1 text-base font-bold tracking-tight text-foreground">Drop an image to inspect</h2>
          </div>
          <LockKeyhole size={17} className="text-muted-foreground" aria-label="Private local processing" />
        </div>
      </div>
      <div className="p-5 sm:p-7">
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(event) => chooseFile(event.target.files?.[0])} data-testid="input-image-file" />
        {!file ? (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => { event.preventDefault(); setDragging(false); chooseFile(event.dataTransfer.files?.[0]); }}
            className={`group relative flex min-h-[206px] w-full flex-col items-center justify-center rounded-xl border border-dashed px-4 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${dragging ? 'border-primary bg-[#fff5c9]' : 'border-border bg-muted/25 hover:border-primary/70 hover:bg-[#fff9df]'}`}
            data-testid="button-upload-dropzone"
          >
            <span className="grid size-12 place-items-center rounded-2xl bg-secondary text-secondary-foreground transition-transform group-hover:-translate-y-1"><Upload size={20} /></span>
            <span className="mt-4 text-sm font-bold text-foreground">{dragging ? 'Release to inspect' : 'Choose an image or drop it here'}</span>
            <span className="mt-1.5 text-xs text-muted-foreground">PNG, JPEG, WEBP, TIFF · up to 15 MB</span>
          </button>
        ) : (
          <div className="flex min-h-[206px] items-center gap-4 rounded-xl border border-border bg-muted/25 p-4">
            <div className="relative h-[170px] w-[42%] shrink-0 overflow-hidden rounded-lg bg-muted sm:w-[36%]">
              <img src={preview} alt={`Preview of ${file.name}`} className="h-full w-full object-cover" data-testid="img-upload-preview" />
              <span className="scan-line absolute inset-x-0 top-0 h-0.5 bg-primary shadow-[0_0_14px_hsl(43_92%_59%)]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[#318d79]"><Check size={15} strokeWidth={3} /><span className="font-mono text-[10px] uppercase tracking-[0.12em]">Ready to inspect</span></div>
              <p className="mt-2 truncate text-sm font-bold text-foreground" title={file.name}>{file.name}</p>
              <p className="mt-1 font-mono text-[10px] text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB · {file.type || 'image'}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <button type="button" onClick={submit} disabled={analyzeImage.isPending} className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2.5 text-xs font-bold text-primary-foreground shadow-[2px_2px_0_hsl(215_28%_17%)] transition-transform hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" data-testid="button-analyze">
                  {analyzeImage.isPending ? <RotateCcw size={14} className="animate-spin" /> : <ScanIcon />}
                  {analyzeImage.isPending ? 'Inspecting…' : 'Run inspection'}
                </button>
                <button type="button" onClick={() => { setFile(null); if (inputRef.current) inputRef.current.value = ''; }} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-card hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" data-testid="button-remove-image"><X size={14} /> Change</button>
              </div>
            </div>
          </div>
        )}
        {(fileError || analyzeImage.isError) && <div className="mt-3">{fileError ? <p className="rounded-lg bg-[#fbede7] px-3 py-2 text-xs font-medium text-[#a85131]" role="alert" data-testid="status-upload-error">{fileError}</p> : <ErrorMessage message="The image could not be analyzed. Check the file and try again." onRetry={submit} />}</div>}
      </div>
    </section>
  );
}

function ScanIcon() {
  return <span className="grid size-3.5 place-items-center rounded-sm border-2 border-current"><span className="size-1 rounded-full bg-current" /></span>;
}

function LatestResult({ analysis }: { analysis: Analysis }) {
  return (
    <section className="mt-8 overflow-hidden rounded-2xl border border-border bg-card animate-rise-in" data-testid="section-latest-result">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-7">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.17em] text-muted-foreground">02 / latest result</p>
          <h2 className="mt-1 max-w-[460px] truncate text-base font-bold tracking-tight text-foreground">{analysis.filename}</h2>
        </div>
        <Link href={`/history/${analysis.id}`} className="inline-flex items-center gap-1 text-xs font-bold text-[#318d79] outline-none hover:underline focus-visible:ring-2 focus-visible:ring-primary" data-testid="link-latest-details">View full evidence <ArrowUpRight size={14} /></Link>
      </div>
      <div className="grid gap-7 p-5 sm:grid-cols-[155px_1fr] sm:p-7">
        <div className="flex items-center gap-4 sm:block">
          <ScoreMark score={analysis.quality_score} />
          <div className="sm:mt-3"><StatusBadge label={analysis.quality_label} /><p className="mt-2 text-xs leading-5 text-muted-foreground">{analysis.issues.length ? `${analysis.issues.length} signal${analysis.issues.length === 1 ? '' : 's'} found in this image.` : 'No quality signals need attention.'}</p></div>
        </div>
        <div>
          <div className="mb-5 flex items-center gap-2"><span className="size-2 rounded-full bg-[#318d79]" /><p className="text-sm font-bold text-foreground">At a glance</p><p className="ml-auto font-mono text-[10px] text-muted-foreground">{analysis.metrics.width} × {analysis.metrics.height} px</p></div>
          <MetricGrid metrics={analysis.metrics} />
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const [latest, setLatest] = useState<Analysis | null>(null);
  const healthCheck = useHealthCheck({ query: { queryKey: getHealthCheckQueryKey(), retry: false } });
  const health = useGetHealth({ query: { queryKey: getGetHealthQueryKey(), retry: false } });
  const summary = useGetAnalysisSummary({ query: { queryKey: getGetAnalysisSummaryQueryKey() } });
  const history = useListAnalyses({ limit: 8 }, { query: { queryKey: getListAnalysesQueryKey({ limit: 8 }) } });

  return (
    <div className="grain min-h-[100dvh] bg-background text-foreground">
      <div className="flex min-h-[100dvh] flex-col md:flex-row">
        <Sidebar health={health.data} healthCheck={healthCheck.data} />
        <main className="min-w-0 flex-1">
          <div className="mx-auto max-w-[1180px] px-5 py-8 sm:px-8 sm:py-10 lg:px-12">
            <PageHeader eyebrow="Image quality / workspace" title="Know what the image is saying." note="A local, evidence-first read on whether an image can be trusted." />
            <SummaryStrip summary={summary.data} loading={summary.isLoading} />
            <div className="grid gap-8 xl:grid-cols-[minmax(0,1.15fr)_minmax(310px,.85fr)]">
              <UploadPanel onComplete={setLatest} />
              <section className="rounded-2xl border border-border bg-[#e5f0eb] p-5 animate-rise-in delay-2 sm:p-6" data-testid="section-model-status">
                <div className="flex items-center justify-between"><span className="font-mono text-[10px] uppercase tracking-[0.17em] text-[#3b7467]">Inspection engine</span><span className="grid size-8 place-items-center rounded-lg bg-[#cde5dc] text-[#318d79]"><FileImage size={16} /></span></div>
                <p className="mt-8 max-w-[260px] font-[var(--app-font-serif)] text-[25px] font-bold leading-[1.08] tracking-[-0.04em] text-[#204d43]">Evidence over guesswork.</p>
                <p className="mt-3 text-xs leading-5 text-[#47766b]">Signal / Lens checks visual conditions locally, then shows the measurements behind every call.</p>
                <div className="mt-8 flex items-center justify-between border-t border-[#c4ddd4] pt-3 text-[10px] text-[#47766b]"><span>MODEL {summary.data?.model_version ?? '—'}</span><span className="flex items-center gap-1.5 font-semibold"><span className="size-1.5 rounded-full bg-[#318d79]" /> {summary.data?.model_status ?? 'standby'}</span></div>
              </section>
            </div>
            {latest && <LatestResult analysis={latest} />}
            <section className="mt-10 animate-rise-in delay-3" data-testid="section-history">
              <div className="mb-3 flex items-end justify-between gap-4"><div><p className="font-mono text-[10px] uppercase tracking-[0.17em] text-muted-foreground">03 / trail</p><h2 className="mt-1 text-lg font-bold tracking-tight">Recent analyses</h2></div><span className="font-mono text-[10px] text-muted-foreground">{history.data?.length ?? 0} shown</span></div>
              <div className="overflow-hidden rounded-xl border border-border bg-card">
                {history.isLoading ? <LoadingRows /> : history.isError ? <div className="p-4"><ErrorMessage message="History is temporarily unavailable." onRetry={() => void history.refetch()} /></div> : history.data?.length ? history.data.map((analysis) => <AnalysisRow key={analysis.id} analysis={analysis} />) : <EmptyHistory />}
              </div>
            </section>
            <footer className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground"><span>Local by design</span><span>Nothing leaves your workspace</span></footer>
          </div>
        </main>
      </div>
    </div>
  );
}