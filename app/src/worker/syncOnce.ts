import { syncUpstreamOnce } from "./syncUpstream";

syncUpstreamOnce()
  .then(() => {
    console.log("sync done");
    process.exit(0);
  })
  .catch((e) => {
    console.error("sync failed", e);
    process.exit(1);
  });



