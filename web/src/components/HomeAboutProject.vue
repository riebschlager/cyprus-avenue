<script setup lang="ts">
const features = [
  { title: 'Browse playlists', text: 'View all archived playlists with full track listings and original air dates' },
  { title: 'Artist biographies', text: 'Explore rich background info, images, and listener stats for archive artists' },
  { title: 'Search & filter', text: 'Find anything by keyword or browse by smart tags and musical genres' },
  { title: 'Spotify integration', text: 'Direct links to listen to tracks, complete with album artwork' },
  { title: 'Flexible export', text: 'Generate Spotify playlists from shows, artists, genres, or the entire archive' },
  { title: 'Random discovery', text: 'Explore the collection through suggested content and "I\'m feeling lucky" navigation' }
]
</script>

<template>
  <section class="ca-section about-split">
    <div>
      <div class="ca-sechead">
        <div class="ca-sechead__left">
          <span class="ca-label ca-label--accent">02</span>
          <h2 class="ca-sechead__title">About this project</h2>
        </div>
      </div>

      <article class="ca-prose">
        <p>
          This project originally began in 2018 as a manual preservation effort. At the time, the work
          consisted primarily of copying and pasting as many playlists as possible from the KCUR website before they
          disappeared. You can read more about the original motivation in this 2018 blog post:
          <a href="https://riebschlager.medium.com/the-cyprus-avenue-preservation-project-5fa0a3894c3a" target="_blank" rel="noopener">The Cyprus Avenue Preservation Project</a>.
        </p>

        <p>
          The inspiration back then was a growing nostalgia for human-curated music in an era where streaming
          services and algorithmically generated playlists were already beginning to dominate. Now in 2026,
          with the incredible advancement of AI and coding tools, I chose to re-ignite this project.
        </p>

        <p>
          Over the course of just a few days, I used these modern tools alongside my background in software
          development to build this archive—automatedly parsing the original text files and searching the
          KCUR website for any shows I had previously missed. It is my hope to both preserve a small piece
          of Kansas City history and to "swim against the tide" of algorithmic listening by appreciating
          the curation of a true musicologist.
        </p>

        <p>
          This project is <strong>open source</strong> and hosted on
          <a href="https://github.com/riebschlager/cyprus-avenue/" target="_blank" rel="noopener">GitHub</a>.
          I welcome any edits, suggestions, or corrections to the archive. You can contact me directly at
          <a href="mailto:chris@the816.com">chris@the816.com</a>.
        </p>
      </article>
    </div>

    <aside>
      <div class="ca-sechead ca-sechead--sm">
        <div class="ca-sechead__left">
          <h3 class="ca-sechead__title">Features</h3>
        </div>
      </div>
      <ol class="about-features">
        <li v-for="(feature, index) in features" :key="feature.title" class="about-features__item">
          <span class="ca-label">{{ String(index + 1).padStart(2, '0') }}</span>
          <div>
            <div class="about-features__title">{{ feature.title }}</div>
            <p class="about-features__text">{{ feature.text }}</p>
          </div>
        </li>
      </ol>
    </aside>
  </section>
</template>

<style scoped>
.about-split {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
  gap: var(--space-12);
  align-items: start;
}
.about-features {
  list-style: none;
  margin: 0;
  padding: 0;
}
.about-features__item {
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr);
  gap: var(--space-3);
  align-items: baseline;
  padding: var(--space-3) 0;
  border-bottom: var(--rule-hair);
}
.about-features__title {
  font: 700 17px/1.25 var(--font-display);
  letter-spacing: -0.015em;
  color: var(--fg-1);
}
.about-features__text {
  margin-top: 2px;
  font: 400 15px/1.45 var(--font-text);
  color: var(--fg-2);
}

@media (max-width: 900px) {
  .about-split { grid-template-columns: minmax(0, 1fr); gap: var(--space-8); }
}
</style>
