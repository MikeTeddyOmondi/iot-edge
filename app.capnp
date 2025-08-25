using Workerd = import "/workerd/workerd.capnp";

const config :Workerd.Config = (
  services = [
    (
      name = "iot-edge-service",
      worker = (
        modules = [
          (name = "worker", esModule = embed "worker.js"),
        ],
        compatibilityDate = "2025-07-15",
        compatibilityFlags = ["nodejs_compat"],
      ),
    ),
  ],

  sockets = [
    # HTTP socket
    (
      name = "http",
      address = "*:8080",
      http = (),
      service = "iot-edge-service",
    ),
  ],
); 
