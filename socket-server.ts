import { createServer } from "http";
import { createSocketServer } from "./server.ts";

const port = Number(process.env.PORT ?? 3001);
const host = process.env.HOST ?? "0.0.0.0";

const httpServer = createServer();

createSocketServer(httpServer);

httpServer.listen(port, host, () => {
  console.log(`Socket.IO server listening on http://${host}:${port}`);
});
