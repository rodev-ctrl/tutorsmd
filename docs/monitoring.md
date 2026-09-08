# Monitoring

Kombination aus Prometheus + Loki + Promtail + Grafana. Metriken und Logs
zweier Services: `tutors-backend` und `tutors-ai`.

## Was wo liegt

```
docker-compose.monitoring.yml     Monitoring-Services (getrennt vom Prod)
monitoring/
  prometheus.yaml                 was und wie oft gescraped wird
  loki-config.yaml                Log-Speicher, Aufbewahrungsdauer
  promtail-config.yaml            Lesen der Container-Logs und Versand an Loki
  grafana/datasources.yaml        Anbindung der Datenquellen
  dashboards/
    dashboards.yaml               Provisioning der Dashboards
    json/tutors-traffic.json      das Dashboard selbst
```

Code, der Metriken liefert:

| Service | Datei | Bibliothek |
|---|---|---|
| backend | `backend/presentation/middlewares/metrics.ts` | `@prometheus-io/client` |
| ai-service | `ai/ai-service/main.py` | `prometheus_client` |

## Start

Der Hauptstack muss zuerst laufen — Monitoring hängt sich an sein Netzwerk.

```bash
docker compose up -d
```

```bash
GRAFANA_PASSWORD='eigenes-passwort' docker compose -f docker-compose.monitoring.yml up -d
```

Stoppen, ohne den Prod anzufassen:

```bash
docker compose -f docker-compose.monitoring.yml down
```

## Zugriff auf Grafana

Alle Ports sind an `127.0.0.1` gebunden und von außen nicht erreichbar.
Zugriff — über einen SSH-Tunnel:

```bash
ssh -L 3000:localhost:3000 root@<server-adresse>
```

Danach `http://localhost:3000`, Login `admin`, Passwort aus
`GRAFANA_PASSWORD`.

**Warum kein öffentlicher Port.** Prometheus und Loki haben überhaupt keine
Authentifizierung — sie sind für einen geschlossenen Perimeter konzipiert.
Ein offener Port 3100 bedeutet, dass jeder Interessierte die Logs lesen kann,
und über `/api/v1/admin/tsdb/delete_series` ließe sich die Metrik-Historie
löschen. Der Tunnel ist bereits über den SSH-Key autorisiert, einen zweiten
Zugriffsmechanismus zu erfinden ist unnötig.

**Firewall ist hier keine Absicherung.** Docker schreibt Regeln direkt in die
Kette `DOCKER-USER` und umgeht `ufw`. Ein in compose veröffentlichter Port ist
erreichbar, selbst wenn `ufw status` „deny“ zeigt. Der einzig verlässliche
Schutz: den Port gar nicht erst nach außen zu veröffentlichen — was hier
umgesetzt ist.

## Dashboard

Zu finden im Ordner **TutorsMD** → „TutorsMD — Traffic backend und
ai-service“.

| Panel | Was es zeigt | Worauf zu achten ist |
|---|---|---|
| Requests pro Sekunde | Ableitung des Counters über 5 Minuten | scharfe Einbrüche = Service nicht erreichbar |
| Anteil 5xx-Fehler | Verhältnis, kein Absolutwert | grün < 1 %, rot > 5 % |
| Latenz p95 | 95. Perzentil | bei ai-service sind Sekunden normal |
| Verfügbarkeit der Targets | `up` je Service | unterscheidet „kein Traffic“ von „Service down“ |
| Top-10-Routen | Last nach Routen-Mustern | wohin der Traffic tatsächlich geht |
| Top-10 langsamste | p95 je Route | eine seltene, langsame Route ist wichtiger als eine schnelle, häufige |
| Perzentile | p50 / p95 / p99 zusammen | die Abweichung ist wichtiger als die Absolutwerte |
| Resident Memory | RSS der Prozesse | Limits 512 MB backend, 256 MB ai |
| Event-Loop-Lag | nur backend | > 100 ms = Node kommt nicht mehr hinterher |
| Logs | Fehler beider Services | Filter per Teilstring |

### Wie man Perzentile liest

Ein stabiles p50 bei wachsendem p99 bedeutet, dass nicht der ganze Service
degradiert ist, sondern ein Teil davon: eine schwere DB-Abfrage, ein kalter
Cache, ein bestimmter langsamer Claude-Aufruf. Der Durchschnitt zeigt davon
gar nichts — er verwischt genau den langen Schwanz, den der Nutzer zu spüren
bekommt.

## Nützliche Abfragen

Prometheus (PromQL):

```promql
sum by (job) (rate(http_requests_total[5m]))
sum by (route) (rate(http_requests_total{job="ai-service"}[5m]))
histogram_quantile(0.95, sum by (job, le) (rate(http_request_duration_seconds_bucket[5m])))
sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))
```

Loki (LogQL):

```logql
{container="tutors-ai"}
{container="tutors-backend"} |= "ERROR"
{container=~"tutors-.+"} |~ "(?i)(error|exception|traceback)"
sum by (container) (rate({container=~"tutors-.+"} |= "ERROR" [5m]))
```

## Entscheidungen, die man verstehen sollte

### Kardinalität der Labels

Das Label `route` enthält das **Muster** der Route (`/api/lessons/:id`),
nicht den tatsächlichen Pfad. Das ist keine Kosmetik.

`req.path` für `/api/lessons/9f3c-.../summary` ist ein eindeutiger String.
Ihn ins Label zu schreiben bedeutet, für jede Lektion eine eigene Metrikserie
anzulegen. Tausend Lektionen mal Methoden und Status ergeben Zehntausende
Serien für einen einzigen Endpoint, und Prometheus stößt an sein
Speicherlimit. Und das wächst mit den Nutzerdaten — also umso schneller, je
erfolgreicher das Produkt ist.

Dieselbe Regel gilt in Loki: In die Labels gehen nur `container` und
`stream`. Textsuche gehört in den Query-Filter (`|= "ERROR"`), nicht in ein
eigenes Label `level` — das ist ein günstiger vollständiger Durchlauf über
einen bereits ausgewählten Stream.

Wird durch Tests geprüft: `backend/tests/unit/metrics.test.ts`.

### Wie Promtail den Containernamen erfährt

Über die Option `tag: "{{.Name}}"` in `logging.options` jedes Services in
`docker-compose.yml`. Docker schreibt den Namen in jede Zeile des JSON-Logs,
und von dort holt Promtail ihn.

Alternative — `/var/run/docker.sock` mounten und die Namen über die Docker
API abfragen. Verworfen: Zugriff auf den Socket entspricht Root auf dem Host,
und Promtail verarbeitet nicht vertrauenswürdige Eingaben. Hier liest es das
Log-Verzeichnis read-only.

**Praktische Konsequenz:** Ein Container, der vor Einführung dieser Option
gestartet wurde, taucht in Loki nicht auf. Nach einer Änderung an logging
müssen die Container neu erstellt werden:

```bash
docker compose up -d
```

### Warum eine eigene Compose-Datei

1. Das Deployment führt `docker compose up -d --build --wait` aus. Wäre
   Monitoring in derselben Datei, würde jeder Rollout es mit neu bauen, und
   `--wait` würde auf seinen Healthcheck warten.
2. Monitoring muss einen Ausfall des Prod überleben, und umgekehrt. Ein
   `down` zur Fehlersuche im Prod würde die Beobachtung genau dann
   abschalten, wenn sie am nötigsten ist.
3. Der Stack verbraucht rund 850 MB. Man muss ihn mit einem einzigen Befehl
   herunterfahren können.

### Image-Versionen sind gepinnt

`latest` hat in diesem Projekt schon zweimal Probleme verursacht: Der
fließende Tag `node:22-alpine` brach den Build durch einen npm-Versionswechsel,
und `prom/prometheus:v3.7.3` stürzt mit SIGSEGV ab, ohne eine einzige
Log-Zeile zu schreiben (geprüft — v3.6.0 mit derselben Konfiguration
funktioniert).

Versionen aktualisieren — in einem eigenen Commit, mit der Prüfung, dass der
Stack hochkommt.

## Diagnose

**Target DOWN.** Prüfen, ob der Service lebt und im selben Netzwerk ist:

```bash
docker network inspect tutors2_tutors-network --format '{{range .Containers}}{{.Name}} {{end}}'
```

**Keine Logs eines Containers in Loki.** Sicherstellen, dass er die Option
tag hat:

```bash
docker inspect tutors-backend --format '{{json .HostConfig.LogConfig}}'
```

Fehlt `tag`, wurde der Container vor der Änderung erstellt — neu erstellen.

**Prometheus in der Restart-Loop, ohne Logs.** Exit-Code ansehen:

```bash
docker inspect tutors-prometheus --format '{{.State.ExitCode}}'
```

`139` ist SIGSEGV, ein Zeichen für eine inkompatible Image-Version. `137` ist
OOM, bedeutet zu wenig Speicher im Limit.

**Leere Graphen.** Das Panel „Verfügbarkeit der Targets“ unterscheidet „kein
Traffic“ von „Service nicht erreichbar“. Steht dort `UP` und die Graphen sind
trotzdem leer, hat schlicht niemand den Service angesprochen.

## Was noch fehlt

- **Metriken für nginx und Frontend.** `tutors-frontend` ist nginx mit
  statischen Dateien, einen `/metrics`-Endpoint gibt es dort nicht. Gebraucht
  wird `nginx-prometheus-exporter` und das Modul `stub_status`. Dann gäbe es
  ein Bild des Traffics bis zum Backend: 4xx von der Statik, Auslieferzeit von
  Dateien, Verbindungen.
- **Alerts.** Aktuell muss man auf das Dashboard schauen. Ein Alertmanager
  mit Telegram-Benachrichtigung bei `up == 0` oder einem 5xx-Anteil über 5 %
  wäre der naheliegende nächste Schritt.
- **Metriken auf Business-Ebene.** Wie viele Lektionen angelegt wurden, wie
  viele RAG-Anfragen, wie viele Tokens verbraucht wurden. Technische Metriken
  beantworten „lebt der Service“, Business-Metriken „wird das Produkt
  genutzt“.
- **LLM-Tracing.** Für `tool_loop` wäre ein Tool wie Langfuse oder Helicone
  hilfreich: Es zeigt die Kette der Runden und die Kosten jeder einzelnen.
  Sinnvoll, sobald echter Traffic über den Service läuft.
