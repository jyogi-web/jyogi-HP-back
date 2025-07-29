export interface GoogleSheetsResponse {
    values?: string[][];
    range?: string;
    majorDimension?: string;
}

export interface GoogleSheetsError {
    error: {
        code: number;
        message: string;
        status: string;
    };
}

export interface Achievement {
    date: string;
    title: string;
    summary: string;
    hasAward: boolean;
}

export interface NewsItem {
    title: string;
    link: string;
    published: string;
    updated: string;
    summary: string;
    content: string;
    thumbnail: string;
}

export interface Project {
    title: string;
    authors: string[];
    date: string;
    technologies: string[];
    youtubeUrl: string | null;
    description: string;
    deployLink: string | null;
    githubLink: string | null;
    articleLink: string | null;
}
