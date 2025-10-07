// __tests__/api/chat/stream.test.ts

import { POST } from "@/app/api/chat/stream/route";
import { NextRequest } from "next/server";

describe("Chat Streaming API", () => {
  it("should reject unauthorized requests", async () => {
    const req = new NextRequest("http://localhost:3000/api/chat/stream", {
      method: "POST",
      body: JSON.stringify({
        question: "test",
        connectionId: "123",
      }),
    });

    const response = await POST(req);
    expect(response.status).toBe(401);
  });

  // Add more integration tests with mocked auth
});
