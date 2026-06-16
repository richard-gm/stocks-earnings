"""
X Timeline Auto-Scroller
Slowly scrolls the active Chrome window to load tweets without triggering bot detection.
Run this while browsing an X profile — the Chrome extension captures tweets as they load.

Usage:
    pip install pyautogui
    python scripts/scroll.py [--minutes 60] [--min-wait 90] [--max-wait 150]

The script gives you 5 seconds to switch to the browser window before it starts.
"""

import argparse
import random
import sys
import time

try:
    import pyautogui
except ImportError:
    print("Missing dependency: pip install pyautogui")
    sys.exit(1)

pyautogui.FAILSAFE = True  # Move mouse to top-left corner to abort at any time


def parse_args():
    p = argparse.ArgumentParser(description="Slow auto-scroller for X timelines")
    p.add_argument("--minutes", type=int, default=60, help="Total run time in minutes (default: 60)")
    p.add_argument("--min-wait", type=int, default=90, help="Min seconds between scrolls (default: 90)")
    p.add_argument("--max-wait", type=int, default=150, help="Max seconds between scrolls (default: 150)")
    return p.parse_args()


def human_scroll():
    """Scroll down a small random amount, like a human glancing at the feed."""
    scroll_clicks = random.randint(4, 8)
    pyautogui.scroll(-scroll_clicks)

    # Occasionally move the mouse slightly (looks human)
    if random.random() < 0.4:
        dx = random.randint(-30, 30)
        dy = random.randint(-20, 20)
        pyautogui.moveRel(dx, dy, duration=random.uniform(0.2, 0.6))


def main():
    args = parse_args()
    run_seconds = args.minutes * 60

    print(f"X Timeline Auto-Scroller")
    print(f"  Run time : {args.minutes} min")
    print(f"  Wait     : {args.min_wait}–{args.max_wait}s between scrolls")
    print(f"  Abort    : move mouse to top-left corner at any time")
    print()
    print("Switch to your browser now — starting in 5 seconds...")
    time.sleep(5)

    start = time.time()
    scroll_count = 0

    while True:
        elapsed = time.time() - start
        if elapsed >= run_seconds:
            break

        human_scroll()
        scroll_count += 1

        remaining_min = (run_seconds - elapsed) / 60
        print(
            f"[{elapsed/60:.1f}/{args.minutes}m] Scroll #{scroll_count} — "
            f"{remaining_min:.1f} min remaining"
        )

        wait = random.uniform(args.min_wait, args.max_wait)
        # Show a countdown so you know it's still running
        for remaining in range(int(wait), 0, -10):
            print(f"  Next scroll in {remaining}s...", end="\r", flush=True)
            time.sleep(min(10, remaining))
        print()

    print(f"\nDone — {scroll_count} scrolls over {args.minutes} minutes.")
    print("Check the extension popup to export your collected tweets.")


if __name__ == "__main__":
    main()
