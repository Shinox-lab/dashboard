import asyncio
import os
import json
from datetime import datetime
from typing import Set
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from faststream import FastStream
from faststream.kafka import KafkaBroker

# --- Configuration ---
BROKER_URL = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:19092")
API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", "8000"))

# Topics to monitor (you can customize these)
TOPICS_TO_MONITOR = [
    "mesh.global.events",
    "mesh.responses.pending",
    # Add session-specific topics as needed
]

# Store connected WebSocket clients
connected_clients: Set[WebSocket] = set()

broker = KafkaBroker(BROKER_URL)
faststream_app = FastStream(broker)


# =============================================================================
# FASTSTREAM LIFECYCLE MANAGEMENT
# =============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage FastStream app lifecycle within FastAPI."""
    # Startup: Start the FastStream app and Kafka broker
    print(f"Starting Kafka Reader...")
    print(f"Broker URL: {BROKER_URL}")
    print(f"Monitoring topics: {TOPICS_TO_MONITOR}")

    await faststream_app.start()
    print("FastStream Kafka consumer started")

    yield

    # Shutdown: Stop the FastStream app
    print("Shutting down Kafka Reader...")
    if connected_clients:
        await asyncio.gather(
            *[client.close() for client in connected_clients],
            return_exceptions=True
        )
    await faststream_app.stop()
    print("FastStream Kafka consumer stopped")


# =============================================================================
# FASTAPI APP
# =============================================================================

api = FastAPI(
    title="Kafka Message Monitor",
    description="Real-time Kafka message monitoring with WebSocket support",
    version="1.0.0",
    lifespan=lifespan
)


# =============================================================================
# WEBSOCKET HANDLERS
# =============================================================================

async def broadcast_to_clients(message: dict):
    """Broadcast a message to all connected WebSocket clients."""
    if not connected_clients:
        return

    message_json = json.dumps(message)

    # Send to all clients, remove any that have disconnected
    disconnected = set()
    for client in connected_clients:
        try:
            await client.send_text(message_json)
        except Exception:
            disconnected.add(client)

    # Remove disconnected clients
    connected_clients.difference_update(disconnected)


@api.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """Handle WebSocket connections from frontend clients."""
    await websocket.accept()
    connected_clients.add(websocket)
    print(f"New WebSocket client connected. Total clients: {len(connected_clients)}")

    try:
        # Send welcome message
        welcome_msg = {
            "type": "system",
            "timestamp": datetime.now().isoformat(),
            "message": "Connected to Kafka message stream"
        }
        await websocket.send_text(json.dumps(welcome_msg))

        # Keep connection alive and handle incoming messages
        while True:
            data = await websocket.receive_text()

            # Handle subscription requests
            try:
                message = json.loads(data)
                if message.get("type") == "subscribe" and message.get("topic"):
                    topic = message["topic"]
                    if topic not in TOPICS_TO_MONITOR:
                        TOPICS_TO_MONITOR.append(topic)
                        # Dynamically subscribe to new topic
                        await subscribe_to_topic(topic)
                        response = {
                            "type": "system",
                            "timestamp": datetime.now().isoformat(),
                            "message": f"Subscribed to topic: {topic}"
                        }
                        await websocket.send_text(json.dumps(response))
            except json.JSONDecodeError:
                pass

    except WebSocketDisconnect:
        print(f"Client disconnected normally")
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        connected_clients.discard(websocket)
        print(f"Client removed. Total clients: {len(connected_clients)}")


# =============================================================================
# KAFKA CONSUMERS
# =============================================================================

@broker.subscriber("mesh.global.events")
async def global_events_handler(msg: dict):
    """Handle messages from mesh.global.events topic."""
    formatted_msg = {
        "type": "kafka_message",
        "topic": "mesh.global.events",
        "timestamp": datetime.now().isoformat(),
        "data": msg
    }
    print(f"[mesh.global.events] {json.dumps(msg, indent=2)}")
    await broadcast_to_clients(formatted_msg)


@broker.subscriber("mesh.responses.pending")
async def responses_pending_handler(msg: dict):
    """Handle messages from mesh.responses.pending topic."""
    formatted_msg = {
        "type": "kafka_message",
        "topic": "mesh.responses.pending",
        "timestamp": datetime.now().isoformat(),
        "data": msg
    }
    print(f"[mesh.responses.pending] {json.dumps(msg, indent=2)}")
    await broadcast_to_clients(formatted_msg)


async def subscribe_to_topic(topic: str):
    """Dynamically subscribe to a topic."""
    print(f"Subscribing to topic: {topic}")

    async def handler(msg: dict):
        formatted_msg = {
            "type": "kafka_message",
            "topic": topic,
            "timestamp": datetime.now().isoformat(),
            "data": msg
        }
        print(f"[{topic}] {json.dumps(msg, indent=2)}")
        await broadcast_to_clients(formatted_msg)

    sub = broker.subscriber(topic)
    sub(handler)
    await sub.start()


# =============================================================================
# HTTP ENDPOINTS
# =============================================================================

@api.get("/", response_class=HTMLResponse)
async def get_index():
    """Serve the main HTML page."""
    try:
        with open("index.html", "r") as f:
            return HTMLResponse(content=f.read())
    except FileNotFoundError:
        return HTMLResponse(
            content="<h1>Error: index.html not found</h1>",
            status_code=404
        )


@api.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "kafka_broker": BROKER_URL,
        "connected_clients": len(connected_clients),
        "monitored_topics": TOPICS_TO_MONITOR
    }


@api.get("/stats")
async def get_stats():
    """Get statistics about the service."""
    return {
        "connected_clients": len(connected_clients),
        "monitored_topics": TOPICS_TO_MONITOR,
        "kafka_broker": BROKER_URL
    }


# =============================================================================
# RUN THE APP
# =============================================================================
# Run with: uvicorn kafka_reader:api --host 0.0.0.0 --port 8000 --reload
