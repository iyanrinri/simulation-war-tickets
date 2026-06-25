<template>
  <div class="min-h-screen bg-canvas text-ink font-sans selection:bg-primary/20 selection:text-ink">
    <!-- Top Navigation (Airbnb Style) -->
    <header class="h-[80px] border-b border-hairline bg-canvas sticky top-0 z-50 flex items-center justify-between px-6 xl:px-20">
      <div class="flex items-center space-x-2">
        <div class="text-primary">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.022 1.343a4.25 4.25 0 00-4.04 2.805L2.348 18.064C1.944 19.18 2.768 20.25 3.96 20.25h16.08c1.191 0 2.016-1.07 1.612-2.186l-5.634-13.916a4.25 4.25 0 00-4.04-2.805zm-2.158 3.518a2.25 2.25 0 014.272 0l5.06 12.493a.5.5 0 01-.465.688H5.269a.5.5 0 01-.465-.688l5.06-12.493zM12 8a2 2 0 100 4 2 2 0 000-4z"/>
          </svg>
        </div>
        <span class="font-bold text-primary tracking-tight text-xl hidden sm:block">airtickets</span>
      </div>
      
      <div class="hidden md:flex space-x-8">
        <router-link to="/" class="text-ink font-semibold text-[16px] hover:text-ink relative pb-6 top-3">
          Simulations
          <div class="absolute bottom-0 left-0 right-0 h-[2px] bg-ink"></div>
        </router-link>
        <router-link to="/admin" class="text-muted hover:text-ink transition-colors font-semibold text-[16px] relative pb-6 top-3">
          Admin
        </router-link>
      </div>
      
      <div class="flex items-center space-x-4">
        <div class="hidden sm:block text-sm font-medium hover:bg-surface-soft px-4 py-2 rounded-full cursor-pointer transition-colors">
          Become a Host
        </div>
        <div class="border border-hairline rounded-full flex items-center space-x-2 p-1 pr-2 hover:shadow-float transition-shadow cursor-pointer">
          <div class="text-muted pl-2">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"></path></svg>
          </div>
          <div class="bg-muted text-canvas rounded-full w-8 h-8 flex items-center justify-center">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
          </div>
        </div>
      </div>
    </header>

    <main>
      <router-view />
    </main>
  </div>
</template>
