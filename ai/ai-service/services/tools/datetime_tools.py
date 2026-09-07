"""
datetime_tools.py — время и часовые пояса как вызываемые Claude инструменты.

Зачем это вообще нужно
──────────────────────
Модель не знает, какое сегодня число. Она не «немного не уверена» — у неё
физически нет часов, и на вопрос «какое сегодня?» она отвечает датой, близкой
к концу обучающей выборки. Для календаря это не косметическая проблема:
«четверг 16:00» без сегодняшней даты и без часового пояса — это пропущенный
урок или урок, назначенный на прошлую неделю.

Почему stdlib, а не внешний time-API
────────────────────────────────────
Просилось «сделай tool для регионального времени, который дёргает API».
Здесь это сделано на `zoneinfo` (stdlib с Python 3.9), а не через HTTP, и вот
почему это лучше именно для этой задачи:

  • системные часы контейнера уже синхронизированы по NTP — точность выше,
    чем у публичного time-API, отвечающего через сеть;
  • нет сетевой задержки внутри tool-loop (а он и так делает несколько
    последовательных обращений к модели);
  • нет ещё одной точки отказа и ещё одного ключа/лимита запросов;
  • база IANA tzdb, которую использует zoneinfo, — тот же источник, из которого
    свои данные берут и time-API. Промежуточное звено ничего не добавляет.

Сетевой вызов оправдан там, где данных нет локально (веб-поиск — exa_client.py).
Время локально есть.

<critical>
На Windows у CPython нет системной базы tzdb, и ZoneInfo("Europe/Berlin")
падает с ZoneInfoNotFoundError. Поэтому в requirements.txt добавлен пакет
`tzdata` — он нужен ТОЛЬКО для локальной разработки под Windows; в Docker-образе
(Linux) база уже есть, но пакет безвреден.
</critical>

Все функции возвращают dict с полем `status` — общий конверт для tool_loop:
"ok" — результат пригоден; "error" — вернётся модели с is_error=True и
подсказкой, что попробовать дальше.
"""

from datetime import datetime, timedelta
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError, available_timezones

# Частые ошибки/сокращения → канонические IANA-имена.
# Модель довольно охотно пишет "Berlin" или "MSK" вместо "Europe/Berlin".
# Вместо того чтобы вернуть ошибку и потратить лишний виток tool-loop,
# исправляем очевидное сами.
_TZ_ALIASES = {
    "berlin": "Europe/Berlin",
    "germany": "Europe/Berlin",
    "deutschland": "Europe/Berlin",
    "moscow": "Europe/Moscow",
    "moskau": "Europe/Moscow",
    "москва": "Europe/Moscow",
    "msk": "Europe/Moscow",
    "kyiv": "Europe/Kyiv",
    "kiev": "Europe/Kyiv",
    "vienna": "Europe/Vienna",
    "zurich": "Europe/Zurich",
    "london": "Europe/London",
    "cet": "Europe/Berlin",
    "cest": "Europe/Berlin",
    "utc": "UTC",
    "gmt": "UTC",
    "z": "UTC",
}

_WEEKDAYS = {
    "monday": 0, "montag": 0, "понедельник": 0, "mo": 0,
    "tuesday": 1, "dienstag": 1, "вторник": 1, "di": 1,
    "wednesday": 2, "mittwoch": 2, "среда": 2, "mi": 2,
    "thursday": 3, "donnerstag": 3, "четверг": 3, "do": 3,
    "friday": 4, "freitag": 4, "пятница": 4, "fr": 4,
    "saturday": 5, "samstag": 5, "суббота": 5, "sa": 5,
    "sunday": 6, "sonntag": 6, "воскресенье": 6, "so": 6,
}


def _resolve_tz(name: str) -> ZoneInfo:
    """IANA-имя (или частый алиас) → ZoneInfo. Бросает ValueError с подсказкой."""
    if not name:
        raise ValueError("timezone is empty")

    candidate = _TZ_ALIASES.get(name.strip().lower(), name.strip())
    try:
        return ZoneInfo(candidate)
    except (ZoneInfoNotFoundError, ValueError, KeyError):
        # Подсказываем похожие имена — это заметно повышает шанс, что следующий
        # вызов модели будет удачным, вместо ещё одного слепого перебора.
        needle = name.strip().lower().replace(" ", "_")
        similar = [z for z in available_timezones() if needle in z.lower()][:5]
        raise ValueError(
            f"Unknown timezone {name!r}. Use an IANA name like 'Europe/Berlin'."
            + (f" Did you mean: {', '.join(sorted(similar))}?" if similar else "")
        )


def _parse_iso(value: str, default_tz: ZoneInfo | None = None) -> datetime:
    """ISO-8601 → aware datetime. Наивную строку привязывает к default_tz."""
    raw = value.strip().replace("Z", "+00:00")
    try:
        dt = datetime.fromisoformat(raw)
    except ValueError:
        raise ValueError(
            f"Cannot parse {value!r} as ISO-8601. Expected e.g. '2026-09-10T16:00:00+02:00'."
        )
    if dt.tzinfo is None:
        if default_tz is None:
            raise ValueError(
                f"{value!r} has no UTC offset and no timezone was given. "
                "Either append an offset or pass the timezone argument."
            )
        dt = dt.replace(tzinfo=default_tz)
    return dt


def _describe(dt: datetime, tz_name: str) -> dict:
    """Единая форма ответа: и машинная (ISO), и человекочитаемая."""
    return {
        "status": "ok",
        "iso": dt.isoformat(),
        "timezone": tz_name,
        "utc_offset": dt.strftime("%z"),
        "date": dt.strftime("%Y-%m-%d"),
        "time": dt.strftime("%H:%M"),
        "weekday": dt.strftime("%A"),
        "weekday_index": dt.weekday(),  # 0 = понедельник
        "is_dst": bool(dt.dst()),
        "unix_timestamp": int(dt.timestamp()),
    }


# ═══════════════════════════════════════════════════════════════════════════
#  Инструменты
# ═══════════════════════════════════════════════════════════════════════════

def get_current_datetime(timezone: str = "UTC") -> dict:
    """Текущие дата и время в заданном часовом поясе.

    Первый вызов в любой работе с календарём: без него все относительные
    формулировки («завтра», «в четверг») не имеют смысла.
    """
    try:
        tz = _resolve_tz(timezone)
    except ValueError as e:
        return {
            "status": "error",
            "error": str(e),
            "hint": (
                "Call resolve_user_timezone to get the user's stored IANA timezone, "
                "or retry with 'UTC' and ask the user which timezone they are in."
            ),
        }

    return _describe(datetime.now(tz), str(tz))


def convert_timezone(iso_datetime: str, to_timezone: str, from_timezone: str = "") -> dict:
    """Тот же момент времени, выраженный в другом часовом поясе.

    Нужен, когда ученик и репетитор в разных зонах: календарь ведётся в зоне
    репетитора, а подтверждение показывается ученику в его местном времени.
    """
    try:
        target = _resolve_tz(to_timezone)
        source = _resolve_tz(from_timezone) if from_timezone else None
        dt = _parse_iso(iso_datetime, default_tz=source)
    except ValueError as e:
        return {
            "status": "error",
            "error": str(e),
            "hint": "Pass an ISO-8601 timestamp and IANA timezone names, then retry.",
        }

    converted = dt.astimezone(target)
    result = _describe(converted, str(target))
    result["source_iso"] = dt.isoformat()
    # Разница в часах между зонами В ЭТОТ момент (не константа: летнее время
    # сдвигается в разных странах в разные даты, и в марте/октябре бывают
    # недели, когда обычная разница на час другая).
    result["offset_difference_hours"] = round(
        (dt.utcoffset().total_seconds() - converted.utcoffset().total_seconds()) / 3600, 2
    ) * -1
    return result


def add_duration_to_datetime(
    iso_datetime: str,
    weeks: int = 0,
    days: int = 0,
    hours: int = 0,
    minutes: int = 0,
    timezone: str = "",
) -> dict:
    """Прибавляет (или вычитает, при отрицательных значениях) интервал.

    Арифметика с датами в голове модели — источник ошибок на границах месяцев,
    годов и перехода на летнее время. Здесь она детерминирована.

    <critical>
    Сложение выполняется в ЛОКАЛЬНОЙ зоне, а не в UTC. Это намеренно:
    «завтра в то же время» для человека означает ту же цифру на часах, даже
    если между этими моментами перевели стрелки. Календарное («настенное»)
    сложение даёт именно это, арифметика в UTC дала бы сдвиг на час.
    </critical>
    """
    try:
        tz = _resolve_tz(timezone) if timezone else None
        dt = _parse_iso(iso_datetime, default_tz=tz)
    except ValueError as e:
        return {"status": "error", "error": str(e), "hint": "Fix the arguments and retry."}

    zone = tz or dt.tzinfo
    local = dt.astimezone(zone)
    # tzinfo снимается перед сложением и навешивается заново после — так
    # получается «настенное» сложение с корректным пересчётом смещения.
    shifted = (local.replace(tzinfo=None) + timedelta(
        weeks=weeks, days=days, hours=hours, minutes=minutes
    )).replace(tzinfo=zone)

    result = _describe(shifted, str(zone))
    result["source_iso"] = dt.isoformat()
    result["applied"] = {"weeks": weeks, "days": days, "hours": hours, "minutes": minutes}
    if shifted.utcoffset() != local.utcoffset():
        result["dst_note"] = (
            "A daylight-saving transition falls inside this interval — the UTC offset "
            f"changed from {local.strftime('%z')} to {shifted.strftime('%z')}. "
            "The wall-clock time is what the user asked for."
        )
    return result


def find_next_weekday(
    weekday: str,
    timezone: str,
    at_time: str = "",
    skip_today: bool = True,
) -> dict:
    """Ближайший будущий указанный день недели.

    Отдельный инструмент, потому что «следующий четверг» — самая частая
    формулировка при записи на урок и самая частая ошибка при счёте в уме.

    skip_today=True (по умолчанию) соответствует обычному человеческому
    смыслу: сказанное в четверг «в следующий четверг» означает следующую
    неделю, а не сегодня. Если из контекста однозначно следует «сегодня»,
    модель передаёт skip_today=False.
    """
    key = weekday.strip().lower()
    if key not in _WEEKDAYS:
        return {
            "status": "error",
            "error": f"Unknown weekday {weekday!r}.",
            "hint": "Use an English, German or Russian weekday name, e.g. 'thursday', 'Donnerstag', 'четверг'.",
        }
    try:
        tz = _resolve_tz(timezone)
    except ValueError as e:
        return {"status": "error", "error": str(e), "hint": "Call resolve_user_timezone first."}

    target = _WEEKDAYS[key]
    now = datetime.now(tz)

    delta = (target - now.weekday()) % 7
    if delta == 0 and skip_today:
        delta = 7

    result_dt = now + timedelta(days=delta)

    if at_time:
        try:
            hh, _, mm = at_time.strip().partition(":")
            result_dt = result_dt.replace(
                hour=int(hh), minute=int(mm or 0), second=0, microsecond=0
            )
        except (ValueError, TypeError):
            return {
                "status": "error",
                "error": f"Cannot parse time {at_time!r}.",
                "hint": "Use 24-hour 'HH:MM', e.g. '16:00'.",
            }
    else:
        result_dt = result_dt.replace(second=0, microsecond=0)

    out = _describe(result_dt, str(tz))
    out["days_from_now"] = delta
    out["resolved_from"] = f"{weekday} (skip_today={skip_today})"
    out["today_is"] = now.strftime("%A %Y-%m-%d")
    return out
