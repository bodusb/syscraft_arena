from __future__ import annotations

import re
import sys
from pathlib import Path
from urllib.parse import urljoin
from urllib.request import Request, urlopen


BASE_URL = "https://api-docs.waraps.org/"


def fetch(url: str) -> str:
    request = Request(url, headers={"User-Agent": "Mozilla/5.0 (compatible; WARA-PS-docs-archive/1.0)"})
    with urlopen(request, timeout=30) as response:
        return response.read().decode("utf-8")


def main(output_dir: str) -> None:
    destination = Path(output_dir)
    destination.mkdir(parents=True, exist_ok=True)
    sidebar = fetch(urljoin(BASE_URL, "_sidebar.md"))
    (destination / "_sidebar.md").write_text(sidebar, encoding="utf-8")

    paths = sorted(set(re.findall(r"\]\(([^)#]+\.md)\)", sidebar)))
    failures: list[str] = []
    for relative_path in paths:
        try:
            text = fetch(urljoin(BASE_URL, relative_path))
        except Exception as error:  # pragma: no cover - network collection
            failures.append(f"{relative_path}: {error}")
            continue
        target = destination / relative_path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(text, encoding="utf-8")

    (destination / "manifest.txt").write_text("\n".join(paths) + "\n", encoding="utf-8")
    if failures:
        (destination / "failures.txt").write_text("\n".join(failures) + "\n", encoding="utf-8")
        print(f"Downloaded {len(paths) - len(failures)}/{len(paths)} documents; see failures.txt", file=sys.stderr)
        raise SystemExit(1)
    print(f"Downloaded {len(paths)} documentation pages.")


if __name__ == "__main__":
    main(sys.argv[1])
