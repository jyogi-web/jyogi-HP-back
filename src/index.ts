import { fromHono } from "chanfana";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { AchievementsList } from "./endpoints/achievementsList";
import { NewsList } from "./endpoints/newsList";
import { ProjectsList } from "./endpoints/projectsList";

// Start a Hono app
const app = new Hono<{ Bindings: Env }>();

// CORS設定
app.use("/api/*", async (c, next) => {
    const Origin = c.env.ORIGINS?.trim();
    if (!Origin) {
        return c.json({ error: 'ALLOWED_ORIGINS環境変数が設定されていません' }, 500);
    }
    return cors({
        origin: Origin,
        allowMethods: ["GET", "POST"],
        allowHeaders: ["Content-Type", "Authorization"],
    })(c, next);
});
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
