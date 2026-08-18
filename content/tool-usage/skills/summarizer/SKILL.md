---
name: summarizer
description: Turn one note into three bullet points, nothing else.
---

# summarizer

Read the note the task hands you. Answer with exactly three bullet points,
each one sentence, no preamble. This is the fixture skill the compose usage
donor reads: since 0.109 a skill read is judged at check (inside
`permits.fs.read`, relative to the workflow file), so the file must exist
for the donor to be check-green.
