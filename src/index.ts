import { fromHono } from "chanfana";
import { Hono } from "hono";
import { cors } from 'hono/cors';
import { AchievementsList } from "./endpoints/achievementsList";
import { NewsList } from "./endpoints/newsList";
import { ProjectsList } from "./endpoints/projectsList";

// Start a Hono app
const app = new Hono<{ Bindings: Env }>();

// CORS設定
app.use('/api/*', async (c, next) => {
    if (!c.env.ORIGINS) {
        return c.json({ error: 'ORIGINS環境変数が設定されていません' }, 500);
    }
    await next();
});

app.use('/api/*', cors({
    origin: (origin, c) => {
        const allowedOrigins = c.env.ORIGINS!.split(',').map(o => o.trim());
        
        if (allowedOrigins.includes(origin)) {
            return origin;
        }
        return null;
    },
    allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    credentials: true,
    maxAge: 86400,
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
