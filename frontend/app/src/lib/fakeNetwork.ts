/** Simulated 600–1200ms latency so loading/skeleton states are real (brief §4). */
export function fakeDelay(min = 600, max = 1200): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, Math.random() * (max - min) + min));
}
