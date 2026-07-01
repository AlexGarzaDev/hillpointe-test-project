import request from "supertest";
import { app } from "../app";

describe("app bootstrap", () => {
  it("serves the version endpoint", async () => {
    const response = await request(app).get("/version");

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        success: true,
        version: expect.any(String),
        name: expect.any(String),
      })
    );
  });

  it("serves the version endpoint through the api alias", async () => {
    const response = await request(app).get("/api/version");

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        success: true,
        version: expect.any(String),
        name: expect.any(String),
      })
    );
  });

  it("returns Not Found for unknown routes", async () => {
    const response = await request(app).get("/does-not-exist");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      error: "Not Found",
    });
  });
});