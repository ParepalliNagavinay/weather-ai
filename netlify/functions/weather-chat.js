import { Readable } from "node:stream";
import { handleWeatherChat } from "../../server/weatherChat.js";

const createRequest = (event) => {
  const body = event.body || "";
  const request = Readable.from(body ? [body] : []);

  request.method = event.httpMethod;
  request.headers = event.headers || {};

  return request;
};

const runWeatherChatHandler = (event) =>
  new Promise((resolve) => {
    const headers = {};
    const response = {
      statusCode: 200,
      setHeader(name, value) {
        headers[name] = value;
      },
      end(body = "") {
        resolve({
          statusCode: this.statusCode,
          headers,
          body: String(body),
        });
      },
    };

    handleWeatherChat(createRequest(event), response).catch((error) => {
      resolve({
        statusCode: 500,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          error: error.message || "Unable to answer the weather question.",
        }),
      });
    });
  });

export const handler = async (event) => runWeatherChatHandler(event);
