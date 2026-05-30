import { Application, Text } from "pixi.js";

const root = document.getElementById("app");
if (!root) {
  throw new Error("Missing #app root element");
}

const app = new Application();

await app.init({
  background: "#0b0e1a",
  resizeTo: window,
  antialias: true,
  autoDensity: true,
  resolution: window.devicePixelRatio || 1,
});

root.appendChild(app.canvas);

const title = new Text({
  text: "IGT Slot Demo",
  style: {
    fill: "#f4f4f5",
    fontFamily: "Arial, sans-serif",
    fontSize: 32,
    fontWeight: "600",
  },
});
title.anchor.set(0.5);
title.position.set(app.screen.width / 2, app.screen.height / 2);
app.stage.addChild(title);

addEventListener("resize", () => {
  title.position.set(app.screen.width / 2, app.screen.height / 2);
});
