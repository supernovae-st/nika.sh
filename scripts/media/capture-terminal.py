#!/usr/bin/env python3
"""capture-terminal.py — record a real nika run on a real pty.

The run-explains raw captures (raw/*.ansi) come from this driver: it runs
the command on a pty with fixed geometry (default 100x34) and writes the
raw byte stream — SGR colors, OSC-8 hyperlinks and the live renderer's
DEC-2026 synchronized frames included. Nothing is post-processed.

  python3 capture-terminal.py out.ansi -- nika run demo.nika.yaml
  python3 capture-terminal.py out.ansi --kill-after 2.5 -- nika run ...
  python3 capture-terminal.py out.ansi -- zsh -fc 'nika run a.yaml --json > t.ndjson; echo "exit=$?"'

Prints a JSON manifest row (exit · pty · bytes · duration_ms) on stdout;
paste it into raw/manifest.json next to the command list you ran.
"""
import fcntl
import json
import os
import pty
import select
import signal
import struct
import sys
import termios
import time

argv = sys.argv[1:]
sep = argv.index("--")
opts, cmd = argv[:sep], argv[sep + 1 :]
out = opts[0]


def opt(name, default):
    return type(default)(opts[opts.index(name) + 1]) if name in opts else default


cols, rows = opt("--cols", 100), opt("--rows", 34)
kill_after = opt("--kill-after", 0.0) or None
timeout = opt("--timeout", 120.0)

pid, fd = pty.fork()
if pid == 0:
    os.environ["TERM"] = "xterm-256color"
    os.environ["LANG"] = "en_US.UTF-8"
    try:
        os.execvp(cmd[0], cmd)
    except Exception as e:  # pragma: no cover — child-side failure surface
        os.write(2, f"EXEC FAIL {cmd!r}: {e}\n".encode())
        os._exit(127)

fcntl.ioctl(fd, termios.TIOCSWINSZ, struct.pack("HHHH", rows, cols, 0, 0))
t0 = time.monotonic()
chunks: list[bytes] = []
killed = False
while True:
    now = time.monotonic() - t0
    if kill_after is not None and not killed and now >= kill_after:
        os.kill(pid, signal.SIGKILL)
        killed = True
    if now > timeout:
        os.kill(pid, signal.SIGKILL)
        break
    r, _, _ = select.select([fd], [], [], 0.02)
    if fd in r:
        try:
            data = os.read(fd, 65536)
        except OSError:
            break
        if not data:
            break
        chunks.append(data)

_, status = os.waitpid(pid, 0)
raw = b"".join(chunks)
with open(out, "wb") as f:
    f.write(raw)
print(
    json.dumps(
        {
            "exit": os.waitstatus_to_exitcode(status),
            "pty": f"{cols}x{rows}",
            "bytes": len(raw),
            "duration_ms": int((time.monotonic() - t0) * 1000),
        }
    )
)
