import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { type AppContext } from "../types";
import { GoogleSheetsResponse } from "../types/googleSheets";

export class ProjectsList extends OpenAPIRoute {
    schema = {
        tags: ["Projects"],
        summary: "Get projects list",
        responses: {
            "200": {
                description: "Returns projects list",
                content: {
                    "application/json": {
                        schema: z.object({
                            success: z.boolean(),
                            data: z.array(z.object({
                                title: z.string(),
                                authors: z.array(z.string()),
                                date: z.string(),
                                technologies: z.array(z.string()),
                                youtubeUrl: z.string().nullable(),
                                description: z.string(),
                                deployLink: z.string().nullable(),
                                githubLink: z.string().nullable(),
                                articleLink: z.string().nullable(),
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
                `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Projects!A2:I?key=${API_KEY}`
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

            const projects = responseData.values.map((row) => {
                const [
                    title = '',
                    author = '',
                    date = '',
                    technologiesStr = '',
                    youtubeUrl = '',
                    description = '',
                    deployLink = '',
                    githubLink = '',
                    articleLink = ''
                ] = row;
                return {
                    title: title || '',
                    authors: author ? author.split(',').map(name => name.trim()) : [],
                    date: date || '',
                    technologies: technologiesStr ? technologiesStr.split(',').map(tech => tech.trim()) : [],
                    youtubeUrl: youtubeUrl || null,
                    description: description || '',
                    deployLink: deployLink || null,
                    githubLink: githubLink || null,
                    articleLink: articleLink || null
                };
            }).filter(project => project.title && project.authors.length > 0);

            // 日付順でソート（新しい順）
            const sortedProjects = projects.sort((a, b) => {
                if (!a.date) return 1;
                if (!b.date) return -1;

                const dateA = new Date(a.date.replace(/(\d+)\/(\d+)\/(\d+)/, '$1-$2-$3'));
                const dateB = new Date(b.date.replace(/(\d+)\/(\d+)\/(\d+)/, '$1-$2-$3'));

                return dateB.getTime() - dateA.getTime();
            });

            return Response.json({
                success: true,
                data: sortedProjects,
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
