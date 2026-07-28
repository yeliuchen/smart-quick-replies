# Development Workflow

## Git

- `main` is the stable production branch.
- Never develop directly on `main`.
- Never commit or push directly to `main`.
- All features must be developed on feature branches.
- All changes to `main` must go through a Pull Request.
- Run tests before declaring a task complete.
- Check `git status` and `git diff` before committing.

## Branch naming

Use:

- `feature/<name>`
- `fix/<name>`
- `refactor/<name>`

Examples:

- `feature/render-cache`
- `feature/settings-panel`
- `fix/message-rendering`

## Development

Before starting work:

1. Fetch the latest `main`.
2. Create a new feature branch from `main`.
3. Confirm the active branch.
4. Make only changes relevant to the current task.

Before submitting:

1. Run tests.
2. Check for console errors.
3. Review `git diff`.
4. Commit the changes.
5. Push the feature branch.
6. Create a Pull Request targeting `main`.

## SillyTavern

The plugin must load without console errors.

Existing working features must not regress.

Do not change unrelated files unless necessary.
