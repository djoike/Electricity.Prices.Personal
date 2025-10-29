export function setupRefresh(onRefresh: () => void) {
  let inFlight = false;

  const run = async () => {
    if (inFlight) return;
    inFlight = true;
    try { await onRefresh(); } finally { inFlight = false; }
  };

  const onVis = () => {
    if (document.visibilityState === 'visible') run();
  };

  document.addEventListener('visibilitychange', onVis);

  // Hidden hot-corner tap/click
  const hot = document.querySelector('.hot-corner');
  if (hot) hot.addEventListener('click', run);

  return () => {
    document.removeEventListener('visibilitychange', onVis);
    if (hot) hot.removeEventListener('click', run);
  };
}