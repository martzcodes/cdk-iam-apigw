import { HttpRequest } from "@aws-sdk/protocol-http";
import fetch from "node-fetch";
import { URL } from "url"
import { signRequest } from "./sign-request";

export const handler = async (): Promise<any> => {
    const url = new URL(`${process.env.IAM_API}`);
    const request = new HttpRequest({
        hostname: url.host,
        method: "GET",
        headers: {
            host: url.host,
        },
        path: url.pathname,
    });
    const output: Record<string, any> = {
        without: {},
        with: {},
    };
    try {
        const withoutRes = await fetch(url.href, request);
        const withoutJson = await withoutRes.json();
        output.without = withoutJson;
    } catch (e) {
        output.without = e;
    }
    try {
        const signedRequest = await signRequest(request);
        const withRes = await fetch(url.href, signedRequest);
        const withJson = await withRes.json();
        output.with = withJson;
    } catch (e) {
        output.with = e;
    }
    return output;
}