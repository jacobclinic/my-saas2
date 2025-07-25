import { NextRequest, NextResponse } from 'next/server';
import getSupabaseServerActionClient from '~/core/supabase/action-client';
import { getOriginalUrl } from '~/lib/short-links/short-links-service';

export async function GET(request: NextRequest, { params }: { params: { code: string } }) {
    const { code } = params;
    try {
        const client = getSupabaseServerActionClient();
        const originalUrl = await getOriginalUrl(client, code);
        return NextResponse.redirect(originalUrl);
    } catch (error: any) {
        console.error('Error resolving short link:', error);
        return new NextResponse(
            `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Invalid Link</title>
                <style>
                    :root {
                        --primary: 258.3deg 89.5% 66.3%;
                        --primary-foreground: 210deg 20% 98%;
                        --secondary: 220deg 14.3% 95.9%;
                        --secondary-foreground: 220.9deg 39.3% 11%;
                        --background: 0deg 0% 100%;
                        --foreground: 224deg 71.4% 4.1%;
                        --accent: 220deg 14.3% 95.9%;
                        --accent-foreground: 220.9deg 39.3% 11%;
                        --destructive: 0deg 84.2% 60.2%;
                        --border: 220deg 13% 91%;
                        --radius: 0.5rem;
                    }
                    body { 
                        font-family: system-ui, -apple-system, sans-serif; 
                        display: flex; 
                        justify-content: center; 
                        align-items: center; 
                        height: 100vh; 
                        flex-direction: column; 
                        margin: 0; 
                        background: hsl(var(--background)); 
                        color: hsl(var(--foreground));
                    }
                    .container { 
                        text-align: center; 
                        padding: 2rem; 
                        max-width: 500px; 
                        background: white; 
                        border-radius: var(--radius); 
                        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                        border: 1px solid hsl(var(--border));
                    }
                    h1 { 
                        color: hsl(var(--destructive)); 
                        margin-top: 0;
                        font-weight: bold;
                    }
                    p { 
                        color: hsl(var(--foreground)); 
                        line-height: 1.6;
                    }
                    a { 
                        color: hsl(var(--primary)); 
                        text-decoration: none;
                        font-weight: 500;
                    }
                    a:hover { 
                        text-decoration: underline;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Invalid Link</h1>
                    <p>This short link is no longer valid or has expired.</p>
                    <p><a href="/">Return to Homepage</a></p>
                </div>
            </body>
            </html>`,
            {
                status: 410,
                headers: {
                    'Content-Type': 'text/html',
                },
            }
        );
    }
}