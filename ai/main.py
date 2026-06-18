import anthropic

client = anthropic.Anthropic()

message = client.messages.create(
    model="claude-opus-4-8",
    max_tokens=16000,
    system="You are a helpful learning assistant specializing in Math and German.",
    thinking={"type": "adaptive"},
    messages=[
        {"role": "client", "content": "How comes lesson?"}
    ],
)
print(message.content)