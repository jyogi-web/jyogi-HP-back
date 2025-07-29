import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { type AppContext } from "../types";
import { GoogleSheetsResponse } from "../types/googleSheets";

export class NewsList extends OpenAPIRoute {
    schema = {
        tags: ["News"],
        summary: "Get news list",
        request: {
            query: z.object({
                limit: z.string().optional().describe("Maximum number of news items to return"),
            }),
        },
        responses: {
            "200": {
                description: "Returns news list",
                content: {
                    "application/json": {
                        schema: z.object({
                            success: z.boolean(),
                            data: z.array(z.object({
                                title: z.string(),
                                link: z.string(),
                                published: z.string(),
                                updated: z.string(),
                                summary: z.string(),
                                content: z.string(),
                                thumbnail: z.string(),
                            })),
                        }),
                    },
                },
            },
            "500": {
                description: "Internal server error",
                content: {
                    "application/json": {
                        schema: z.object({
                            success: z.boolean(),
                            error: z.string(),
                        }),
                    },
                },
            },
        },
    };

    async handle(c: AppContext) {
        try {
            const data = await this.getValidatedData<typeof this.schema>();
            const { limit } = data.query;

            const SPREADSHEET_ID = c.env.SPREADSHEET_ID;
            const API_KEY = c.env.GOOGLE_SHEETS_API_KEY;

            if (!SPREADSHEET_ID || !API_KEY) {
                return Response.json(
                    {
                        success: false,
                        error: "環境変数が設定されていません",
                    },
                    { status: 500 }
                );
            }

            const response = await fetch(
                `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/NewsList!A2:G?key=${API_KEY}`
            );

            if (!response.ok) {
                throw new Error(`データの取得に失敗しました: ${response.status}`);
            }

            const responseData = await response.json() as GoogleSheetsResponse;

            if (!responseData.values || !responseData.values.length) {
                return Response.json({
                    success: true,
                    data: [],
                });
            }

            const newsList = responseData.values.map((row) => {
                const [
                    title = '',
                    link = '',
                    published = '',
                    updated = '',
                    summary = '',
                    content = '',
                    thumbnail = ''
                ] = row;
                return {
                    title,
                    link,
                    published,
                    updated,
                    summary,
                    content,
                    thumbnail
                };
            });

            const sortedNewsList = newsList.sort((a, b) => {
                const dateA = new Date(a.published || a.updated);
                const dateB = new Date(b.published || b.updated);
                return dateB.getTime() - dateA.getTime();
            });

            const limitedNewsList = limit
                ? sortedNewsList.slice(0, parseInt(limit, 10))
                : sortedNewsList;

            return Response.json({
                success: true,
                data: limitedNewsList,
            });

        } catch (error) {
            console.error('エラーが発生しました:', error);
            return Response.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error',
                },
                { status: 500 }
            );
        }
    }
}
