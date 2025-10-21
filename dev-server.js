import { createServer } from "http";
import { createSocketServer } from "./server.ts";

const PORT = 3001;

const httpServer = createServer();
createSocketServer(httpServer);

httpServer.listen(PORT, () => {
  console.log(`✅ Socket.IO server running on http://localhost:${PORT}`);
});

