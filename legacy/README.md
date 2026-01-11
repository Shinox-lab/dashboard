# Kafka Message Monitor Frontend

A real-time Kafka message monitoring system with a web-based interface powered by FastAPI.

## Components

1. **kafka_reader.py** - FastAPI server with FastStream Kafka consumer and WebSocket support
2. **index.html** - Web frontend for displaying Kafka messages in real-time

## Setup

### Install Dependencies

```bash
pip install -r requirements.txt
```

### Configuration

The application uses environment variables for configuration:

- `KAFKA_BOOTSTRAP_SERVERS` - Kafka broker URL (default: `localhost:19092`)
- `API_HOST` - FastAPI server host (default: `0.0.0.0`)
- `API_PORT` - FastAPI server port (default: `8000`)

## Running

### Start the Server

```bash
uvicorn kafka_reader:api --host 0.0.0.0 --port 8000 --reload
```

This will:
- Start FastAPI server on `http://localhost:8000`
- Connect to Kafka broker
- Subscribe to `mesh.global.events` and `mesh.responses.pending` topics
- Enable WebSocket endpoint at `ws://localhost:8000/ws`
- Serve the web interface at `http://localhost:8000`

### Access the Web Interface

Simply open your browser and navigate to:

```
http://localhost:8000
```

The interface will automatically connect to the WebSocket endpoint and start displaying messages.

## Features

### Kafka Reader Features

- Subscribes to multiple Kafka topics
- Broadcasts messages to all connected WebSocket clients
- Supports dynamic topic subscription via WebSocket messages
- Auto-reconnection handling

### Frontend Features

- Real-time message display with color-coded topics
- Filter messages by topic
- Subscribe to additional topics dynamically
- Clear message history
- Auto-reconnect on disconnection
- Message counter
- Responsive design with smooth animations

### Dynamic Topic Subscription

To subscribe to additional topics (e.g., session-specific topics):

1. Enter the topic name in the input field (e.g., `session-abc123`)
2. Click "Subscribe" button
3. The frontend will send a subscription request to the Kafka reader
4. New messages from that topic will appear in the feed

### Message Filtering

Use the dropdown to filter messages by:
- All Topics
- System messages
- mesh.global.events
- mesh.responses.pending
- Any dynamically subscribed topics

## Architecture

```
Kafka Topics → FastStream Consumer → WebSocket Server → Web Browser
                                         ↓
                                  Connected Clients
```

The system uses:
- **FastStream** for Kafka consumption
- **WebSockets** for real-time browser communication
- **Vanilla JavaScript** for the frontend (no dependencies)

## Monitoring Agent Messages

This frontend is designed to work with the squad_lead agent system, displaying:

- **Global Events** - Replayability events (SESSION_JOINED, STATE_CHECKPOINT, etc.)
- **Pending Responses** - Agent messages pending governance routing
- **Session Topics** - Session-specific agent communications

The message schemas follow the A2A (Agent-to-Agent) protocol with headers containing:
- `source_agent_id`
- `target_agent_id`
- `interaction_type` (DIRECT_COMMAND, INFO_UPDATE, TASK_RESULT, etc.)
- `conversation_id`
- `governance_status`
