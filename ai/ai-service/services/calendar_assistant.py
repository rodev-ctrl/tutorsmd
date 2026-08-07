"""
Bucht Unterrichtstermine über den Kalender des Tutors via MCP.

Wichtig: Anthropics `mcp_servers`-Parameter (client.beta.messages.create) spricht
nur mit MCP-Servern, die über eine öffentliche URL erreichbar sind (wie z.B.
https://mcp.linear.app/mcp). Es gibt keinen offiziellen, öffentlich gehosteten
Google-Calendar-MCP-Server — verfügbare Implementierungen laufen lokal per stdio
(z.B. `npx -y @cocal/google-calendar-mcp`), genau wie unsere `github`/`postgres`
Server in .mcp.json.

Deshalb bauen wir die Brücke hier selbst: wir starten den MCP-Server als
Subprozess, holen seine Tool-Schemas per `list_tools()`, reichen nur eine
Allowlist an Claude weiter (kein delete-Zugriff), und übernehmen den
tool_use/tool_result-Loop manuell — das Äquivalent zu `mcp_toolset` +
`default_config: {"enabled": False}` aus der Doku, nur selbst geschrieben,
weil die Anthropic API stdio-Server nicht nativ unterstützt.

NICHT VERIFIZIERT: Setzt voraus, dass ein Google-Calendar-MCP-Server via
GOOGLE_CALENDAR_MCP_COMMAND/-ARGS konfiguriert ist und die Tool-Namen in
ALLOWED_CALENDAR_TOOLS zu diesem Server passen. Vor dem produktiven Einsatz:
einmal mit ALLOWED_CALENDAR_TOOLS=None laufen lassen und die echten Tool-Namen
aus list_tools() gegen die Allowlist unten abgleichen.
"""

import os
import shlex

import anthropic
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

client = anthropic.AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

# Nur lesen + anlegen - bewusst kein "delete-event", damit der Assistent nie
# selbstständig einen Termin löschen kann.
ALLOWED_CALENDAR_TOOLS = {"list-events", "create-event", "list-calendars"}

MAX_TOOL_TURNS = 5  # Sicherheitslimit gegen Endlosschleifen im Agent-Loop


def _mcp_tool_to_anthropic_schema(tool) -> dict:
    return {
        "name": tool.name,
        "description": tool.description or "",
        "input_schema": tool.inputSchema,
    }


async def book_lesson(request_text: str, tutor_calendar_id: str) -> dict:
    """
    request_text: natürlichsprachliche Anfrage, z.B. "Buche eine Stunde für Donnerstag 16 Uhr"
    tutor_calendar_id: welcher Google-Kalender betroffen ist (aus der DB, nicht vom User frei wählbar)
    """
    command = os.getenv("GOOGLE_CALENDAR_MCP_COMMAND", "npx")
    args = shlex.split(os.getenv("GOOGLE_CALENDAR_MCP_ARGS", "-y @cocal/google-calendar-mcp"))

    server_params = StdioServerParameters(command=command, args=args, env=os.environ.copy())

    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()

            available = await session.list_tools()
            allowed_tools = [t for t in available.tools if t.name in ALLOWED_CALENDAR_TOOLS]
            if not allowed_tools:
                raise RuntimeError(
                    f"Keine der erlaubten Tools {ALLOWED_CALENDAR_TOOLS} wurde vom "
                    f"MCP-Server angeboten. Verfügbar: {[t.name for t in available.tools]}"
                )

            anthropic_tools = [_mcp_tool_to_anthropic_schema(t) for t in allowed_tools]

            messages = [
                {
                    "role": "user",
                    "content": (
                        f"Kalender-ID des Tutors: {tutor_calendar_id}\n\n"
                        f"Anfrage: {request_text}"
                    ),
                }
            ]

            for _ in range(MAX_TOOL_TURNS):
                response = await client.messages.create(
                    model="claude-sonnet-5",
                    max_tokens=1024,
                    system="""Du hilfst, Nachhilfestunden im Google Kalender des Tutors zu verwalten.
Nutze list-events, um Konflikte zu prüfen, bevor du create-event aufrufst.
Erfinde niemals eine Uhrzeit oder ein Datum, das nicht explizit in der Anfrage steht.""",
                    tools=anthropic_tools,
                    messages=messages,
                )

                if response.stop_reason != "tool_use":
                    final_text = "".join(
                        b.text for b in response.content if b.type == "text"
                    )
                    return {"answer": final_text, "status": "done"}

                messages.append({"role": "assistant", "content": response.content})

                tool_results = []
                for block in response.content:
                    if block.type != "tool_use":
                        continue
                    result = await session.call_tool(block.name, block.input)
                    tool_results.append(
                        {
                            "type": "tool_result",
                            "tool_use_id": block.id,
                            "content": [
                                {"type": "text", "text": c.text}
                                for c in result.content
                                if c.type == "text"
                            ],
                            "is_error": result.isError,
                        }
                    )

                messages.append({"role": "user", "content": tool_results})

            return {
                "answer": "Die Anfrage konnte nicht in der erwarteten Anzahl Schritte abgeschlossen werden.",
                "status": "max_turns_exceeded",
            }
