import { Client } from "@upstash/qstash";

const client = new Client({ token: process.env.QSTASH_TOKEN! })

export default client;