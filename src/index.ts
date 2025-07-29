import { fromHono } from "chanfana";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { AchievementsList } from "./endpoints/achievementsList";
import { NewsList } from "./endpoints/newsList";
import { ProjectsList } from "./endpoints/projectsList";

// Start a Hono app
const app = new Hono<{ Bindings: Env }>();

// CORS設定
app.use("/api/*", cors({
	origin: "*",
	allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
	allowHeaders: ["Content-Type", "Authorization"],
}));

// Setup OpenAPI registry
const openapi = fromHono(app, {
	docs_url: "/",
});

// jyogi endpoints
openapi.get("/api/achievements", AchievementsList);
openapi.get("/api/news", NewsList);
openapi.get("/api/projects", ProjectsList);

// You may also register routes for non OpenAPI directly on Hono
// app.get('/test', (c) => c.text('Hono!'))

// Export the Hono app
export default app;
