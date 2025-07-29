import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { type AppContext } from "../types";
import { GoogleSheetsResponse } from "../types/googleSheets";

export class AchievementsList extends OpenAPIRoute {
    schema = {
        tags: ["Achievements"],
        summary: "Get achievements list",
        request: {
            query: z.object({
                limit: z.string().optional().describe("Maximum number of achievements to return"),
            }),
        },
        responses: {
            "200": {
                description: "Returns achievements list",
                content: {
                    "application/json": {
                        schema: z.object({
                            success: z.boolean(),
                            data: z.array(z.object({
                                date: z.string(),
                                title: z.string(),
                                summary: z.string(),
                                hasAward: z.boolean(),
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
                `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Achievements!A2:D?key=${API_KEY}`
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

            const achievements = responseData.values
                .map((row) => {
                    const [date = '', title = '', summary = '', hasAward = ''] = row;
                    return {
                        date,
                        title,
                        summary,
                        hasAward: hasAward === "有"
                    };
                })
                .filter(achievement =>
                    achievement.date &&
                    achievement.date.trim() !== '' &&
                    achievement.title &&
                    achievement.title.trim() !== '' &&
                    achievement.summary &&
                    achievement.summary.trim() !== ''
                );

            // 日付順でソート（新しい順）
            const sortedAchievements = achievements.sort((a, b) => {
                const dateA = new Date(a.date.replace(/(\d+)\/(\d+)\/(\d+)/, '$1-$2-$3'));
                const dateB = new Date(b.date.replace(/(\d+)\/(\d+)\/(\d+)/, '$1-$2-$3'));
                return dateB.getTime() - dateA.getTime();
            });

            // limitが指定されている場合は上位n件のみを返す
            const limitedAchievements = limit
                ? sortedAchievements.slice(0, parseInt(limit, 10))
                : sortedAchievements;

            return Response.json({
                success: true,
                data: limitedAchievements,
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
