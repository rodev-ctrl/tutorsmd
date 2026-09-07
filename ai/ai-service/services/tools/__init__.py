"""
services.tools — инструменты (tools), которые Claude может вызывать сам.

Пакет держит три вещи раздельно:

  datetime_tools.py — работа со временем и часовыми поясами (stdlib zoneinfo)
  exa_client.py     — веб-поиск через Exa (HTTP-клиент)
  db_tools.py       — справочные запросы в Postgres (часовой пояс, материалы)
  registry.py       — JSON-Schema спецификации + диспетчер имя → функция

Точка входа для остального кода — registry: ALL_TOOLS (то, что уходит в
tools=[...] запроса) и execute_tool(name, input) (то, что вызывает tool_loop).
"""
