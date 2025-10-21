import { expect, afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";

expect.extend(matchers);

afterEach(() => {
  cleanup();
});

// Mock Socket.IO client
vi.mock("socket.io-client", () => {
  const mockSocket = {
    id: "test-socket-id",
    connected: true,
    on: vi.fn(),
    emit: vi.fn(),
    off: vi.fn(),
    close: vi.fn(),
  };

  return {
    io: vi.fn(() => mockSocket),
  };
});

// Mock HLS.js
vi.mock("hls.js", () => {
  return {
    default: class MockHls {
      static isSupported() {
        return true;
      }
      static Events = {
        MANIFEST_PARSED: "hlsManifestParsed",
        ERROR: "hlsError",
      };
      static ErrorTypes = {
        NETWORK_ERROR: "networkError",
        MEDIA_ERROR: "mediaError",
      };
      loadSource = vi.fn();
      attachMedia = vi.fn();
      on = vi.fn();
      startLoad = vi.fn();
      recoverMediaError = vi.fn();
      destroy = vi.fn();
    },
  };
});

