# Contributing

Thanks for taking the time.

## How this repository works

These component files are **generated** from the issiofy application, which is
where they are developed and where the live previews and Studio editor run.
That means a pull request editing anything under `components/` cannot be
merged here — the next sync would overwrite it.

That is not a brush-off. Here is what works instead:

## Reporting a bug

[Open an issue](https://github.com/francesco0242/issiofy/issues) and include:

- the component and the props you passed
- your browser and OS
- what you expected and what happened

A minimal reproduction helps enormously. If you already have the fix, paste the
diff into the issue — it gets applied upstream and lands here on the next sync,
credited to you.

## Suggesting a component

Open an issue describing the effect and, ideally, a reference. Components that
solve a real interface problem land faster than effects looking for a use.

## What is welcome as a pull request

- `README.md` typos and clarifications — though note it is generated too, so
  say so in the PR and the change goes upstream
- documentation and examples that live outside `components/`

## Code of conduct

Be decent. Assume good faith. That is the whole policy.
