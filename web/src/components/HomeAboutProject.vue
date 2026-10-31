<template>
    <!-- About This Project -->
    <div class="relative rounded-2xl overflow-hidden border border-gray-800/60 shadow-lg">
      <div class="absolute inset-0 bg-gradient-to-b from-blue-600/10 to-transparent pointer-events-none"></div>
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div class="relative z-10 p-8">
        <h2 class="text-3xl font-bold text-white mb-6">About This Project</h2>

        <div class="space-y-4 text-gray-300">
        <p>
          This project originally began in 2018 as a manual preservation effort. At the time, the work
          consisted primarily of copying and pasting as many playlists as possible from the KCUR website before they
          disappeared. You can read more about the original motivation in this 2018 blog post:
          <a href="https://riebschlager.medium.com/the-cyprus-avenue-preservation-project-5fa0a3894c3a" target="_blank" rel="noopener" class="text-blue-400 hover:text-blue-300">The Cyprus Avenue Preservation Project</a>.
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

        <div class="bg-gray-900/70 rounded-lg p-6 mt-6 border border-gray-800">
          <h3 class="text-xl font-semibold text-white mb-4">Features</h3>
          <ul class="space-y-2 text-gray-300">
            <li class="flex items-start">
              <svg class="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span><strong class="text-white">Browse Playlists:</strong> View all archived playlists with full track listings and original air dates</span>
            </li>
            <li class="flex items-start">
              <svg class="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span><strong class="text-white">Artist Biographies:</strong> Explore rich background info, images, and listener stats for archive artists</span>
            </li>
            <li class="flex items-start">
              <svg class="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span><strong class="text-white">Search & Filter:</strong> Find anything by keyword or browse by smart tags and musical genres</span>
            </li>
            <li class="flex items-start">
              <svg class="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span><strong class="text-white">Spotify Integration:</strong> Direct links to listen to tracks, complete with album artwork</span>
            </li>
            <li class="flex items-start">
              <svg class="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span><strong class="text-white">Flexible Export:</strong> Generate Spotify playlists from shows, artists, genres, or the entire archive</span>
            </li>
            <li class="flex items-start">
              <svg class="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span><strong class="text-white">Random Discovery:</strong> Explore the collection through suggested content and "I'm feeling lucky" navigation</span>
            </li>
          </ul>
        </div>

        <div class="mt-8 p-6 bg-blue-900/20 border border-blue-800/50 rounded-lg">
          <p class="text-gray-200">
            This project is <strong class="text-white">open source</strong> and hosted on
            <a href="https://github.com/riebschlager/cyprus-avenue/" target="_blank" rel="noopener" class="text-blue-400 hover:text-blue-300 font-medium underline-offset-4 hover:underline">GitHub</a>.
            I welcome any edits, suggestions, or corrections to the archive. You can contact me directly at
            <a href="mailto:chris@the816.com" class="text-blue-400 hover:text-blue-300 font-medium underline-offset-4 hover:underline">chris@the816.com</a>.
          </p>
        </div>
        </div>
      </div>
    </div>

</template>
