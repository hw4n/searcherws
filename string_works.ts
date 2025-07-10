export function extractHref(redirectUrl: string): string | null {
    const url = new URL(redirectUrl);
    const encoded = url.searchParams.get("uddg");
    return encoded ? decodeURIComponent(encoded) : null;
}
