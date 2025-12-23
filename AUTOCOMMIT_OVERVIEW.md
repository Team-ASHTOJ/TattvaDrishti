# Auto-Commit Tool Overview (autocommit.py)

Purpose
- Automatically stage, commit, and push changes after a period of inactivity.

What it does
- Watches the repository for filesystem changes.
- Waits for an idle window, then commits with a timestamped message.
- Pushes to the configured remote/branch with failure handling.

Why it matters
- Provides a safety net during rapid prototyping.
- Keeps a granular history without manual git steps.

Libraries used
- GitPython
- watchdog
