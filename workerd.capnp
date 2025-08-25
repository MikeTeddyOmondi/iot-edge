using Workerd = import "/workerd/workerd.capnp";

const config :Workerd.Config = (
  services = [
    (
      name = "main",
      worker = (
        modules = [
          (
            name = "worker.js",
            esModule = embed "worker.js"
          )
        ],
        compatibilityDate = "2025-08-15",

        # Only ask for workerd's implementation of `node:async_hooks`'s AsyncLocalStorage, 
        # instead of all of the node compatibility APIs, provided by `nodejs_compat`. See:
        # https://developers.cloudflare.com/workers/configuration/compatibility-dates/#nodejs-compatibility-flag
        compatibilityFlags = ["nodejs_als"]
      )
    )
  ],
  sockets = [
    (
      name = "http",
      address = "*:8080",
      http = (),
      service = "main"
    )
  ]
);
