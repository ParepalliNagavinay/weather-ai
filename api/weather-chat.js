import { handleWeatherChat } from "../server/weatherChat.js";

export default function handler(req, res) {
  return handleWeatherChat(req, res);
}
