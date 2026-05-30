import { GameApp } from "./app/GameApp";

const root = document.getElementById("app");
if (!root) {
  throw new Error("Missing #app root element");
}

const game = new GameApp();
await game.init(root);
