import Link from 'next/link';
import { ArrowUpRight, Play, Youtube, Smartphone } from 'lucide-react';
import { formatDate } from '@kevincarmen/utils';
import { getLatestVideos, type PublicVideo, type PublicVideoType } from '@/lib/api/posts';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/motion/fade-in';

type Provider = 'youtube' | 'tiktok' | 'twitter' | 'vimeo' | 'odysee' | 'generic';
type LayoutVideo = PublicVideo & { embedUrl: string; thumbnailUrl: string | null; providerLabel: string; isShort: boolean };

function youtubeId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!/youtube\.com|youtu\.be/.test(parsed.hostname)) return null;
    if (parsed.hostname === 'youtu.be') return parsed.pathname.slice(1);
    return parsed.searchParams.get('v') ?? parsed.pathname.split('/').filter(Boolean).pop() ?? null;
  } catch {
    return null;
  }
}

function toEmbed(url: string): { embed: string; provider: Provider } {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname;
    if (/youtube\.com|youtu\.be/.test(hostname)) {
      const id = youtubeId(url);
      return { embed: id ? `https://www.youtube.com/embed/${id}` : url, provider: 'youtube' };
    }
    if (/tiktok\.com/.test(hostname)) return { embed: url, provider: 'tiktok' };
    if (/twitter\.com|x\.com/.test(hostname)) return { embed: url, provider: 'twitter' };
    if (/vimeo\.com/.test(hostname)) return { embed: url, provider: 'vimeo' };
    if (/odysee\.com/.test(hostname)) return { embed: url, provider: 'odysee' };
  } catch {
    // ignore
  }
  return { embed: url, provider: 'generic' };
}

function youtubeThumbnail(url: string): string | null {
  const id = youtubeId(url);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null;
}

function buildVideo(video: PublicVideo): LayoutVideo {
  const { embed, provider } = toEmbed(video.url);
  const isShort = video.isShort || video.videoType === 'YOUTUBE_SHORT';
  return {
    ...video,
    embedUrl: embed,
    thumbnailUrl: video.thumbnail ?? youtubeThumbnail(video.url),
    providerLabel:
      video.videoType === 'YOUTUBE_SHORT'
        ? 'Short'
        : video.videoType === 'ODYSEE'
          ? 'Odysee'
          : (provider.charAt(0).toUpperCase() + provider.slice(1)) as string,
    isShort,
  };
}

export async function VideosSection() {
  const videos = (await getLatestVideos(24))
    .map(buildVideo)
    .filter((v): v is LayoutVideo => Boolean(v));
  const shorts = videos.filter((video) => video.isShort).slice(0, 6);
  const feature = videos.find((video) => !video.isShort) ?? videos[0];

  return (
    <section className="py-20" id="videos">
      <div className="section-container">
        <FadeIn>
          <h2 className="section-title">Últimos videos</h2>
          <p className="section-subtitle">
            Tutoriales y shorts recientes directamente desde el CMS, organizados por tipo.
          </p>
        </FadeIn>

        {feature && (
          <FadeIn className="mt-10">
            <article className="glass-card overflow-hidden">
              <div className="grid gap-0 lg:grid-cols-[1.4fr_1fr]">
                <a
                  href={feature.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative flex aspect-video items-center justify-center overflow-hidden bg-muted lg:aspect-auto lg:min-h-[320px]"
                >
                  {feature.thumbnailUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={feature.thumbnailUrl}
                      alt={`Miniatura de ${feature.title}`}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/10" />
                  )}
                  <div className="absolute inset-0 bg-black/30 transition-colors group-hover:bg-black/40" />
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white/90 text-black shadow-xl transition-transform group-hover:scale-110">
                    <Play className="h-10 w-10 fill-current" />
                  </div>
                  <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-md bg-black/70 px-2 py-1 text-xs font-medium text-white">
                    <Youtube className="h-3 w-3" />
                    {feature.providerLabel}
                  </div>
                </a>
                <div className="flex flex-col justify-center gap-4 p-6 lg:p-8">
                  <span className="w-fit rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                    Destacado
                  </span>
                  <h3 className="text-2xl font-semibold leading-tight">{feature.title}</h3>
                  <time
                    className="text-xs uppercase tracking-wider text-muted-foreground"
                    dateTime={feature.publishedAt}
                  >
                    {formatDate(feature.publishedAt)}
                  </time>
                  {feature.description && (
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  )}
                  <a
                    href={feature.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-fit items-center gap-1 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90"
                  >
                    Ver video
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </article>
          </FadeIn>
        )}

        {shorts.length > 0 && (
          <FadeIn className="mt-12">
            <h3 className="mb-4 text-xl font-semibold">Shorts recientes</h3>
            <StaggerContainer className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {shorts.map((video) => (
                <StaggerItem key={video.id}>
                  <a
                    href={video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block"
                  >
                    <article className="glass-card overflow-hidden hover-lift">
                      <div className="relative flex aspect-[9/16] max-h-72 items-center justify-center overflow-hidden bg-muted">
                        {video.thumbnailUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={video.thumbnailUrl}
                            alt={`Miniatura de ${video.title}`}
                            className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/10" />
                        )}
                        <div className="absolute inset-0 bg-black/30 transition-colors group-hover:bg-black/40" />
                        <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-black shadow-lg">
                          <Play className="h-5 w-5 fill-current" />
                        </span>
                        <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-white">
                          <Smartphone className="h-3 w-3" /> Short
                        </span>
                      </div>
                      <div className="p-4">
                        <h4 className="line-clamp-2 text-sm font-medium transition-colors group-hover:text-accent">
                          {video.title}
                        </h4>
                        <time
                          dateTime={video.publishedAt}
                          className="mt-1 block text-[11px] text-muted-foreground"
                        >
                          {formatDate(video.publishedAt)}
                        </time>
                      </div>
                    </article>
                  </a>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </FadeIn>
        )}

        {videos.length === 0 && (
          <div className="mt-10 rounded-xl border border-border bg-card/50 p-10 text-center text-muted-foreground">
            Aún no hay videos publicados.
          </div>
        )}
      </div>
    </section>
  );
}