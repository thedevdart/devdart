# Staging deploy for PR #2 (supervisor upload portal)

This document explains how to spin up a `projectocr-staging` container alongside production so you can test this feature branch before merging to `main`.

## What it does

- Second copy of the projectocr app at `/opt/projectocr-staging`, checked out on the `supervisor-upload-portal` branch
- Runs in its own Docker container `projectocr-staging`
- Exposed on host port `8001` (production keeps using its existing port)
- Shares the production `postgres` database (purely additive migration so it does not break prod)
- Shares the production `.env` (reuses `GEMINI_API_KEY` etc.)

> WARNING: because staging shares the prod DB, anything a supervisor uploads on staging lands in the real database. That is what we want for end-to-end testing, but remember to clean up any test rows after you are done.

## One-time server setup

SSH into the server, then:

```bash
# 1. Clone a second copy of projectocr on the feature branch
sudo git clone https://github.com/varunkarasia/projectocr.git /opt/projectocr-staging
cd /opt/projectocr-staging
sudo git checkout supervisor-upload-portal

# 2. Reuse production env (symlink, so any future env updates flow through)
sudo ln -s /opt/projectocr/.env /opt/projectocr-staging/.env
```

## Add the staging service to docker-compose

Edit `/opt/ai-bhai/docker-compose.yml` and append this service block (paste at the bottom of the `services:` map, matching indentation of `projectocr:`):

```yaml
  projectocr-staging:
    container_name: projectocr-staging
    build:
      context: /opt/projectocr-staging
      dockerfile: Dockerfile
    restart: unless-stopped
    env_file:
      - /opt/projectocr-staging/.env
    environment:
      DJANGO_DEBUG: "False"
    volumes:
      - projectocr_staging_media:/app/media
    ports:
      - "8001:8000"
    depends_on:
      - postgres

volumes:
  projectocr_staging_media:
```

(If `volumes:` already exists at the bottom of your compose file, just add `projectocr_staging_media:` under it — do not duplicate the `volumes:` header.)

## Build, migrate, and run

```bash
cd /opt/ai-bhai
docker compose build projectocr-staging
docker compose up -d projectocr-staging

# Apply the new migration to the shared DB (one time only across both containers)
docker exec projectocr-staging python manage.py migrate inventory

# Sanity check
docker exec projectocr-staging python manage.py showmigrations inventory | tail -5
docker logs --tail 30 projectocr-staging
```

## Generate a test token (one-liner)

```bash
docker exec projectocr-staging python manage.py shell -c "from inventory.models import Center, CenterUploadToken; c = Center.objects.first(); t = CenterUploadToken.generate_for(c); print('TEST URL: http://<server-ip>:8001/inventory/upload/' + t.token + '/')"
```

Replace `<server-ip>` with the actual host. Open that URL on your phone (or laptop) and walk through:

1. Pick today's date, take a photo of any stock sheet, submit. Expect: success message + sheet appears in admin review queue on prod.
2. Try uploading again for the same date. Expect: "Already uploaded" error.
3. Try picking a date 8+ days back. Expect: "You can only upload sheets from the last 7 days" error.
4. Try uploading a non-image/non-PDF file. Expect: file type error.
5. Try uploading a >10 MB file. Expect: size error.
6. In the admin (production), open Manage Centers and confirm the new "Supervisor upload links" panel renders. Click Generate, copy the URL, open it in another tab. Click Rotate to verify the old URL 404s.
7. Click Disable, verify the URL 404s, click Generate again to re-enable.

## Cleaning up the test uploads

After testing, in production admin (or shell):

```bash
docker exec projectocr python manage.py shell -c "from inventory.models import StockSheet; StockSheet.objects.filter(uploaded_by_source='supervisor', center__name='YOUR_TEST_CENTER_NAME').delete()"
```

## Tearing down staging (when PR is merged)

```bash
cd /opt/ai-bhai
docker compose stop projectocr-staging
docker compose rm -f projectocr-staging
sudo rm -rf /opt/projectocr-staging
# Then remove the projectocr-staging block from docker-compose.yml
```

## Rollback in case of trouble

Production was never touched in this setup — staging runs in its own container against the same DB. If something goes wrong:

- Just stop the staging container: `docker compose stop projectocr-staging`
- The migration we ran is additive (new model, new columns with defaults), so prod keeps working even with the migration applied. If you need to fully reverse:

```bash
docker exec projectocr python manage.py migrate inventory 0013
```

This rolls the schema back to 0013 (before this PR). Re-running `migrate inventory` will re-apply it.
