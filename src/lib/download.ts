function save(filename: string, href: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/** Real Windows desktop app (orb on the actual laptop). */
export function downloadOrbitSetup() {
  save("Start-Orbit.bat", "/orbit-desktop/Start-Orbit.bat");
  window.setTimeout(() => {
    save("Orbit.ps1", "/orbit-desktop/Orbit.ps1");
  }, 400);
  window.setTimeout(() => {
    save("README.txt", "/orbit-desktop/README.txt");
  }, 800);
}
