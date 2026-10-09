

## v11 — CisyPi bridge and capability hardening

- RD now has a read-only `/api/cisypi-catalog` adapter for the public CisyPi catalog.
- Natural language such as `putar video Hu Tao yang ada di CisyPi` becomes `[[CISYPI: Hu Tao]]`.
- The picker shows title, creator, thumbnail, moderation/source status, and official source/embed. RD does not copy or expose expiring media URLs.
- Multi-part OpenAI/Claude content is normalized so an object/array response does not render as an empty bubble.
- Manus receives the recent conversation plus the actual RolxDesk tool contract instead of only the last text fragment.
- Mobile voice ignore window was reduced to avoid discarding the first spoken phrase after microphone permission.
- Teamwork final output budget was increased; free image mode is labelled as an external public endpoint and does not claim private storage.

CisyPi remains unchanged: this is an RD-side read-only collaboration adapter.
