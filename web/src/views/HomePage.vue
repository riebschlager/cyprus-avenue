<script setup lang="ts">
import { useRouter } from 'vue-router'
import { usePlaylists } from '../composables/usePlaylists'
import { stampArchiveDate } from '../utils/archiveDate'
import HomeDiscovery from '../components/HomeDiscovery.vue'
import HomeExports from '../components/HomeExports.vue'
import HomeAboutProject from '../components/HomeAboutProject.vue'
import Icon from '../components/Icon.vue'
const { stats } = usePlaylists()
const router = useRouter()

</script>

<template>
  <div>
    <!-- Hero -->
    <section class="home-hero">
      <div class="flex flex-col gap-5">
        <span class="ca-label ca-label--accent">Saturday nights on KCUR 89.3 &middot; 1978&ndash;2018</span>
        <h1 class="home-hero__title">The Cyprus Avenue Archive</h1>
      </div>
      <div class="flex flex-col gap-5">
        <p class="home-hero__lede">
          A digital preservation of Bill Shapiro's legendary KCUR radio show,
          celebrating over 40 years of musical discovery and cultural heritage.
        </p>
        <div class="flex flex-wrap gap-2">
          <button type="button" class="ca-btn ca-btn--primary" @click="router.push('/playlists')">
            Browse shows <Icon name="arrow-right" />
          </button>
          <button type="button" class="ca-btn ca-btn--secondary" @click="router.push('/artists')">
            Browse artists
          </button>
        </div>
      </div>
    </section>

    <!-- Archive statistics -->
    <div class="ca-stats">
      <div class="ca-stat">
        <span class="ca-stat__value">{{ stats.totalPlaylists.toLocaleString() }}</span>
        <span class="ca-label">Shows archived</span>
      </div>
      <div class="ca-stat">
        <span class="ca-stat__value">{{ stats.totalTracks.toLocaleString() }}</span>
        <span class="ca-label">Tracks</span>
      </div>
      <div class="ca-stat">
        <span class="ca-stat__value">{{ stats.avgTracksPerShow.toFixed(1) }}</span>
        <span class="ca-label">Avg tracks per show</span>
      </div>
      <div v-if="stats.dateRange" class="ca-stat">
        <span class="ca-stat__value">{{ stats.dateRange.start.slice(0, 4) }}&ndash;{{ stats.dateRange.end.slice(2, 4) }}</span>
        <span class="ca-label">{{ stampArchiveDate(stats.dateRange.start) }} &ndash; {{ stampArchiveDate(stats.dateRange.end) }}</span>
      </div>
    </div>

    <!-- About + this week -->
    <section class="ca-section home-split">
      <div>
        <div class="ca-sechead">
          <div class="ca-sechead__left">
            <span class="ca-label ca-label--accent">01</span>
            <h2 class="ca-sechead__title">About Cyprus Avenue</h2>
          </div>
        </div>

        <article class="ca-prose">
          <p class="ca-lede">
            Cyprus Avenue was a Saturday evening institution on KCUR 89.3 FM in Kansas City,
            featuring "the world of popular music from gospel to rock - from country to reggae -
            from a different point of view."
            The show was named after Van Morrison's iconic song "Cyprus Avenue"
            from the 1968 album <em>Astral Weeks</em>.
          </p>

          <p>
            For over 40 years (1978-2018), Bill Shapiro—a Kansas City tax and estate planner by day and
            music enthusiast by night—curated unique playlists introducing listeners to both
            classic and contemporary artists across all genres. A native of Kansas City, Missouri,
            Shapiro received his law degree from the University of Michigan and practiced law since 1962.
          </p>

          <p>
            Beyond the radio, Shapiro was the author of two definitive music guides, both published
            by Andrews &amp; McMeel:
            <a href="https://www.amazon.com/dp/0836279476" target="_blank" rel="noopener"><em>The CD Rock and Roll Library</em></a> (1988) and
            <a href="https://www.amazon.com/dp/0836262174" target="_blank" rel="noopener"><em>The Rock and Roll Review</em></a> (1991).
            His taste and deep knowledge of music made Cyprus Avenue a beloved show for generations of Kansas City listeners.
          </p>

          <p>
            Bill Shapiro passed away in January 2020 at age 82, but his musical legacy lives on. Read more about his life and impact at
            <a href="https://www.kcur.org/community/2020-01-23/bill-shapiro-longtime-host-of-kcurs-cyprus-avenue-dies-at-82" target="_blank" rel="noopener">KCUR</a>.
          </p>

          <h2>Marr Sound Archive</h2>

          <p>
            More recordings appear to be available as part of the <strong>Marr Sound Archive</strong> at the
            University of Missouri Kansas City.
          </p>

          <p>
            The archive was founded by Professor Gaylord Marr, who specialized in sound recordings.
            This collection contains audio recordings of the "Cyprus Avenue" radio program aired on KCUR-FM in Kansas City, Missouri.
          </p>

          <div class="home-callout">
            <span class="ca-label">Access the collection</span>
            <a
              href="https://finding-aids.library.umkc.edu/repositories/2/resources/415/collection_organization"
              target="_blank"
              rel="noopener noreferrer"
              class="home-callout__link"
            >
              Marr Sound Archive: Cyprus Avenue Collection <Icon name="external-link" />
            </a>
            <p class="home-callout__note">
              Please contact the Marr Sound Archive directly regarding research, borrowing, and access to these materials.
            </p>
          </div>
        </article>
      </div>

      <HomeDiscovery />
    </section>

    <HomeAboutProject />

    <HomeExports />

    <!-- Call to action -->
    <section class="ca-section home-cta">
      <h2 class="ca-display">Start exploring</h2>
      <div class="flex flex-col gap-5">
        <p class="ca-lede">
          Dive into {{ stats.totalPlaylists }} playlists and discover {{ stats.totalTracks.toLocaleString() }}
          tracks from Bill Shapiro's eclectic musical journey.
        </p>
        <div class="flex flex-wrap gap-2">
          <button type="button" class="ca-btn ca-btn--primary" @click="router.push('/playlists')">
            Browse shows <Icon name="arrow-right" />
          </button>
          <button type="button" class="ca-btn ca-btn--secondary" @click="router.push('/artists')">
            Browse artists
          </button>
          <button type="button" class="ca-btn ca-btn--secondary" @click="router.push('/tracks')">
            View all tracks
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr);
  gap: var(--space-12);
  align-items: end;
  padding: var(--space-6) 0 var(--space-12);
}
.home-hero__title {
  font: var(--fw-black) clamp(48px, 8vw, 96px)/0.9 var(--font-display);
  letter-spacing: -0.045em;
  color: var(--fg-1);
  text-wrap: balance;
}
.home-hero__lede {
  font: 400 21px/1.45 var(--font-text);
  color: var(--fg-1);
  text-wrap: pretty;
}

.home-split {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
  gap: var(--space-12);
  align-items: start;
}

.home-callout {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-top: var(--space-6);
  padding-top: var(--space-4);
  border-top: var(--rule-ink);
}
.home-callout__link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font: 700 20px/1.2 var(--font-display);
  letter-spacing: var(--tracking-heading);
}
.home-callout__link .ca-icon { font-size: 16px; }
.home-callout__note {
  font: var(--type-ui-s);
  color: var(--fg-2);
}

.home-cta {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: var(--space-12);
  align-items: end;
  padding-top: var(--space-8);
  border-top: var(--rule-heavy);
}

@media (max-width: 900px) {
  .home-hero, .home-split, .home-cta { grid-template-columns: minmax(0, 1fr); gap: var(--space-8); }
}
@media (max-width: 760px) {
  .home-hero { padding-top: 0; }
  .home-hero__lede { font-size: 19px; }
}
</style>
