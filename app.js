import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
// import { validator } from 'hono/validator';

// Create Hono app
const app = new Hono();

// Middleware
app.use("*", cors());
app.use("*", logger());

// Device registry (in production, use KV or D1)
const devices = new Map();

// Device validation schema
const deviceSchema = {
  id: "string",
  name: "string",
  type: "string",
  location: "object",
  metadata: "object",
};

// Validation helper
const validateDevice = (device) => {
  if (!device.id || typeof device.id !== "string") return false;
  if (!device.name || typeof device.name !== "string") return false;
  if (!device.type || typeof device.type !== "string") return false;
  return true;
};

// Routes

// Health check
app.get("/health/", (c) => {
  return c.json({
    status: "healthy",
    timestamp: Date.now(),
    devices: devices.size,
  });
});

// Device registration
app.post("/register", async (c) => {
  try {
    const device = await c.req.json();

    if (!validateDevice(device)) {
      return c.json({ error: "Invalid device data" }, 400);
    }

    devices.set(device.id, {
      ...device,
      registeredAt: Date.now(),
      lastSeen: Date.now(),
      status: "online",
    });

    return c.json({
      status: "registered",
      deviceId: device.id,
      timestamp: Date.now(),
    });
  } catch (error) {
    return c.json({ error: "Invalid JSON" }, 400);
  }
});

// Device heartbeat
app.post("/heartbeat/:deviceId", (c) => {
  const deviceId = c.req.param("deviceId");

  if (devices.has(deviceId)) {
    const device = devices.get(deviceId);
    device.lastSeen = Date.now();
    device.status = "online";
    devices.set(deviceId, device);

    return c.json({
      status: "ok",
      deviceId,
      timestamp: Date.now(),
    });
  }

  return c.json({ error: "Device not found" }, 404);
});

// Get device status
app.get("/device/:deviceId", (c) => {
  const deviceId = c.req.param("deviceId");
  const device = devices.get(deviceId);

  if (device) {
    // Check if device is stale (no heartbeat for 5 minutes)
    const isStale = Date.now() - device.lastSeen > 300000;

    return c.json({
      ...device,
      status: isStale ? "offline" : device.status,
      isStale,
    });
  }

  return c.json({ error: "Device not found" }, 404);
});

// Get all devices
app.get("/devices", (c) => {
  const deviceList = Array.from(devices.entries()).map(([id, device]) => {
    const isStale = Date.now() - device.lastSeen > 300000;
    return {
      id,
      ...device,
      status: isStale ? "offline" : device.status,
      isStale,
    };
  });

  return c.json({
    devices: deviceList,
    total: deviceList.length,
    online: deviceList.filter((d) => d.status === "online").length,
    offline: deviceList.filter((d) => d.status === "offline").length,
  });
});

// Update device
app.put("/device/:deviceId", async (c) => {
  const deviceId = c.req.param("deviceId");

  if (!devices.has(deviceId)) {
    return c.json({ error: "Device not found" }, 404);
  }

  try {
    const updates = await c.req.json();
    const device = devices.get(deviceId);

    // Merge updates with existing device
    const updatedDevice = {
      ...device,
      ...updates,
      id: deviceId, // Prevent ID changes
      updatedAt: Date.now(),
    };

    devices.set(deviceId, updatedDevice);

    return c.json({
      status: "updated",
      device: updatedDevice,
    });
  } catch (error) {
    return c.json({ error: "Invalid JSON" }, 400);
  }
});

// Delete device
app.delete("/device/:deviceId", (c) => {
  const deviceId = c.req.param("deviceId");

  if (devices.has(deviceId)) {
    devices.delete(deviceId);
    return c.json({
      status: "deleted",
      deviceId,
      timestamp: Date.now(),
    });
  }

  return c.json({ error: "Device not found" }, 404);
});

// Device commands endpoint
app.post("/device/:deviceId/command", async (c) => {
  const deviceId = c.req.param("deviceId");

  if (!devices.has(deviceId)) {
    return c.json({ error: "Device not found" }, 404);
  }

  try {
    const command = await c.req.json();

    // In a real implementation, you'd queue this command
    // and the device would poll for commands
    return c.json({
      status: "command_queued",
      deviceId,
      command,
      commandId: crypto.randomUUID(),
      timestamp: Date.now(),
    });
  } catch (error) {
    return c.json({ error: "Invalid JSON" }, 400);
  }
});

// Device metrics endpoint
app.post("/device/:deviceId/metrics", async (c) => {
  const deviceId = c.req.param("deviceId");

  if (!devices.has(deviceId)) {
    return c.json({ error: "Device not found" }, 404);
  }

  try {
    const metrics = await c.req.json();
    const device = devices.get(deviceId);

    // Store metrics (in production, use time-series DB)
    device.metrics = metrics;
    device.metricsUpdatedAt = Date.now();
    devices.set(deviceId, device);

    return c.json({
      status: "metrics_received",
      deviceId,
      timestamp: Date.now(),
    });
  } catch (error) {
    return c.json({ error: "Invalid JSON" }, 400);
  }
});

// Batch operations
app.post("/devices/batch", async (c) => {
  try {
    const { action, deviceIds } = await c.req.json();

    if (!Array.isArray(deviceIds)) {
      return c.json({ error: "deviceIds must be an array" }, 400);
    }

    const results = [];

    for (const deviceId of deviceIds) {
      if (devices.has(deviceId)) {
        const device = devices.get(deviceId);

        switch (action) {
          case "restart":
            // Queue restart command
            results.push({ deviceId, status: "restart_queued" });
            break;
          case "update_firmware":
            // Queue firmware update
            results.push({ deviceId, status: "update_queued" });
            break;
          case "delete":
            devices.delete(deviceId);
            results.push({ deviceId, status: "deleted" });
            break;
          default:
            results.push({ deviceId, status: "unknown_action" });
        }
      } else {
        results.push({ deviceId, status: "not_found" });
      }
    }

    return c.json({
      action,
      results,
      timestamp: Date.now(),
    });
  } catch (error) {
    return c.json({ error: "Invalid JSON" }, 400);
  }
});

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      error: "Not found",
      path: c.req.path,
      method: c.req.method,
    },
    404
  );
});

// Error handler
app.onError((err, c) => {
  console.error(err);
  return c.json(
    {
      error: "Internal server error",
      message: err.message,
    },
    500
  );
});

export default app;
