<template>
  <div class="app">
    <header class="app-header">
      <div class="header-inner">
        <div class="header-brand">
          <span class="header-logo">⚙</span>
          <span class="header-title">CAP Upgrade Tooling</span>
          <span class="header-subtitle">Admin</span>
        </div>
        <nav class="header-nav">
          <router-link to="/" class="nav-link">All Changes</router-link>
          <router-link to="/new" class="nav-link nav-link--primary">+ New Entry</router-link>
        </nav>
      </div>
    </header>
    <main class="app-main">
      <router-view />
    </main>
  </div>
</template>

<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 14px;
  color: #1a1a1a;
  background: #f5f5f5;
  line-height: 1.5;
}

.app { min-height: 100vh; display: flex; flex-direction: column; }

.app-header {
  background: #0070f3;
  color: #fff;
  padding: 0 24px;
  height: 56px;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.15);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-inner {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-brand { display: flex; align-items: center; gap: 10px; }
.header-logo { font-size: 20px; }
.header-title { font-size: 16px; font-weight: 600; }
.header-subtitle {
  font-size: 11px;
  font-weight: 500;
  background: rgba(255,255,255,0.2);
  padding: 2px 8px;
  border-radius: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.header-nav { display: flex; align-items: center; gap: 12px; }

.nav-link {
  color: rgba(255,255,255,0.85);
  text-decoration: none;
  font-size: 13px;
  padding: 6px 12px;
  border-radius: 6px;
  transition: background 0.15s;
}
.nav-link:hover { background: rgba(255,255,255,0.15); color: #fff; }
.nav-link.router-link-active { background: rgba(255,255,255,0.15); color: #fff; }

.nav-link--primary {
  background: rgba(255,255,255,0.2);
  color: #fff;
  font-weight: 500;
}
.nav-link--primary:hover { background: rgba(255,255,255,0.3); }

.app-main {
  flex: 1;
  padding: 24px;
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
}
</style>
