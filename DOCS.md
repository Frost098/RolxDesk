

## 24. v13 — direct CisyPi intent

CisyPi requests are now executed before the model call whenever the user message mentions CisyPi, even without `putar`, `play`, or a literal tool tag. For example, `cari CisyPi pantai` is converted by the send flow to `[[CISYPI: pantai]]` and opens the picker directly. The adapter also retries the public catalog without upstream search when a short typo-like query returns no rows, including the common `panta` → `pantai` normalization in the direct route.
