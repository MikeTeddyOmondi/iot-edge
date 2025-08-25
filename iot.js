// Device registry (in production, use KV or D1)
const devices = new Map();

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const method = request.method;

    // Device registration
    if (url.pathname === "/register" && method === "POST") {
      const device = await request.json();
      devices.set(device.id, {
        ...device,
        lastSeen: Date.now(),
      });
      return Response.json({ status: "registered" });
    }

    // Device heartbeat - /heartbeat/:deviceId
    if (url.pathname.startsWith("/heartbeat/")) {
      const deviceId = url.pathname.split("/")[2];
      if (devices.has(deviceId)) {
        devices.get(deviceId).lastSeen = Date.now();
        return Response.json({ status: "ok" });
      }
      return Response.json({ error: "Device not found" }, { status: 404 });
    }

    // Get device status
    if (url.pathname.startsWith("/device/")) {
      const deviceId = url.pathname.split("/")[2];
      const device = devices.get(deviceId);
      if (device) {
        return Response.json(device);
      }
      return Response.json({ error: "Device not found" }, { status: 404 });
    }

    return Response.json({ error: "Not found" }, { status: 404 });
  },
};
