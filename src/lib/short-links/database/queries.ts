import { SHORT_LINKS_TABLE } from "~/lib/db-tables";
import { Client, ShortLink } from "../types";

export async function getShortLinkByCode(client: Client, shortCode: string): Promise<ShortLink> {
    const { data, error } = await client
        .from(SHORT_LINKS_TABLE)
        .select('*')
        .eq('short_code', shortCode)
        .single();

    if (error) {
        throw new Error(`Failed to fetch short link: ${error.message}`);
    }

    return data;
}
export async function getShortLinkById(client: Client, id: string): Promise<ShortLink> {
    const { data, error } = await client
        .from(SHORT_LINKS_TABLE)
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        throw new Error(`Failed to fetch short link by id: ${error.message}`);
    }

    return data;
}