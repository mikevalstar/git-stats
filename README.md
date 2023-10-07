# Git Stats

Quickly generate a git stats page that shows:

- Lines of code over time by file type
- Lines of comments over time by file type
- commit graph over time

## Requirements

- Node 20+
- pnpm
- [Tokei](https://github.com/XAMPPRocky/tokei)

## Usage

Edit `genstats.sh` to suit your needs, the default branch is `develop`.

In the root of your git repository you want to proile, run:

```bash
/path/to/git-stats/genstats.sh
```

## Output

To load up your stats after the first run, run:

```bash
pnpm run start
```

Visit: http://localhost:8080 to view your graphs.
