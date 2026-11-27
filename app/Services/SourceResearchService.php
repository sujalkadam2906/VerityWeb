<?php

namespace App\Services;

use App\Models\BusinessEvidence;
use App\Models\BusinessProject;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class SourceResearchService
{
    protected const TIMEOUT_SECONDS = 5;
    protected const MAX_BYTES = 2 * 1024 * 1024; // 2MB
    protected const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 VerityWeb-Verifier/1.0';

    /**
     * Research and safely ingest an external business URL.
     */
    public function researchUrl(BusinessProject $project, string $url): BusinessEvidence
    {
        $normalized = $this->normalizeUrl($url);
        
        // SSRF Safety Check
        $safety = $this->validateUrlSafety($normalized);
        if (!$safety['safe']) {
            return BusinessEvidence::create([
                'business_project_id' => $project->id,
                'file_name' => parse_url($normalized, PHP_URL_HOST) ?: $normalized,
                'file_type' => 'url',
                'source_url' => $normalized,
                'status' => 'failed',
                'metadata' => [
                    'error' => $safety['reason'],
                    'blocked_at' => now()->toIso8601String(),
                ],
            ]);
        }

        try {
            $response = Http::withHeaders(['User-Agent' => self::USER_AGENT])
                ->timeout(self::TIMEOUT_SECONDS)
                ->connectTimeout(3)
                ->withoutRedirecting() // Inspect redirects manually to prevent SSRF redirect bypass
                ->get($normalized);

            $statusCode = $response->status();

            // Handle Safe Redirects (Up to 2 levels)
            if (in_array($statusCode, [301, 302, 303, 307, 308])) {
                $redirectUrl = $response->header('Location');
                if ($redirectUrl) {
                    if (str_starts_with($redirectUrl, '/')) {
                        $parsed = parse_url($normalized);
                        $redirectUrl = ($parsed['scheme'] ?? 'https') . '://' . ($parsed['host'] ?? '') . $redirectUrl;
                    }
                    $redirectSafety = $this->validateUrlSafety($redirectUrl);
                    if ($redirectSafety['safe']) {
                        $response = Http::withHeaders(['User-Agent' => self::USER_AGENT])
                            ->timeout(self::TIMEOUT_SECONDS)
                            ->get($redirectUrl);
                        $statusCode = $response->status();
                    }
                }
            }

            if (!$response->successful()) {
                return BusinessEvidence::create([
                    'business_project_id' => $project->id,
                    'file_name' => parse_url($normalized, PHP_URL_HOST) ?: $normalized,
                    'file_type' => 'url',
                    'source_url' => $normalized,
                    'status' => 'failed',
                    'metadata' => [
                        'status_code' => $statusCode,
                        'error' => "HTTP error {$statusCode} returned by remote server.",
                    ],
                ]);
            }

            $body = substr($response->body(), 0, self::MAX_BYTES);
            $parsedContent = $this->parseHtmlContent($body);

            return BusinessEvidence::create([
                'business_project_id' => $project->id,
                'file_name' => $parsedContent['title'] ?: (parse_url($normalized, PHP_URL_HOST) ?: $normalized),
                'file_type' => 'url',
                'source_url' => $normalized,
                'extracted_text' => $parsedContent['text'],
                'status' => 'processed',
                'metadata' => [
                    'status_code' => $statusCode,
                    'title' => $parsedContent['title'],
                    'meta_description' => $parsedContent['description'],
                    'found_phones' => $parsedContent['phones'],
                    'found_emails' => $parsedContent['emails'],
                ],
            ]);
        } catch (\Throwable $e) {
            return BusinessEvidence::create([
                'business_project_id' => $project->id,
                'file_name' => parse_url($normalized, PHP_URL_HOST) ?: $normalized,
                'file_type' => 'url',
                'source_url' => $normalized,
                'status' => 'failed',
                'metadata' => [
                    'error' => 'Unable to retrieve URL: ' . $e->getMessage(),
                ],
            ]);
        }
    }

    /**
     * Normalize URL with scheme and trimmed path.
     */
    public function normalizeUrl(string $url): string
    {
        $url = trim($url);
        if (!preg_match('#^https?://#i', $url)) {
            $url = 'https://' . $url;
        }
        return $url;
    }

    /**
     * Validate against SSRF vulnerabilities (blocks private IPs, loopback, cloud metadata).
     */
    public function validateUrlSafety(string $url): array
    {
        $parsed = parse_url($url);
        if (!$parsed || empty($parsed['host'])) {
            return ['safe' => false, 'reason' => 'Invalid or malformed URL.'];
        }

        $scheme = strtolower($parsed['scheme'] ?? '');
        if (!in_array($scheme, ['http', 'https'], true)) {
            return ['safe' => false, 'reason' => 'Only HTTP and HTTPS protocols are allowed.'];
        }

        $host = strtolower($parsed['host']);

        // Block localhost and standard hostnames
        if (in_array($host, ['localhost', '127.0.0.1', '::1', '0.0.0.0'], true)) {
            return ['safe' => false, 'reason' => 'Localhost addresses are restricted.'];
        }

        // Block internal and reserved TLDs
        if (preg_match('/\.(local|internal|corp|lan|home|test|example|invalid)$/i', $host)) {
            return ['safe' => false, 'reason' => 'Internal domain names are restricted.'];
        }

        // Resolve DNS and check all returned IP addresses
        $ips = @dns_get_record($host, DNS_A + DNS_AAAA);
        $resolvedIps = [];

        if (is_array($ips)) {
            foreach ($ips as $record) {
                if (!empty($record['ip'])) {
                    $resolvedIps[] = $record['ip'];
                }
                if (!empty($record['ipv6'])) {
                    $resolvedIps[] = $record['ipv6'];
                }
            }
        }

        // Fallback to gethostbynamel
        if (empty($resolvedIps)) {
            $ipv4s = @gethostbynamel($host);
            if (is_array($ipv4s)) {
                $resolvedIps = array_merge($resolvedIps, $ipv4s);
            }
        }

        if (empty($resolvedIps)) {
            // Check if host itself is a raw IP literal
            if (filter_var($host, FILTER_VALIDATE_IP)) {
                $resolvedIps[] = $host;
            } else {
                return ['safe' => false, 'reason' => 'Unable to resolve domain to a valid IP address.'];
            }
        }

        foreach ($resolvedIps as $ip) {
            if ($this->isPrivateOrReservedIp($ip)) {
                return [
                    'safe' => false,
                    'reason' => "Domain resolves to a restricted private or internal IP address [{$ip}].",
                ];
            }
        }

        return ['safe' => true, 'reason' => ''];
    }

    /**
     * Verify whether an IP is private, loopback, link-local, or reserved.
     */
    public function isPrivateOrReservedIp(string $ip): bool
    {
        // FILTER_FLAG_NO_PRIV_RANGE blocks 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
        // FILTER_FLAG_NO_RES_RANGE blocks 0.0.0.0/8, 169.254.0.0/16, 127.0.0.0/8, 224.0.0.0/4, etc.
        $validPublic = filter_var(
            $ip,
            FILTER_VALIDATE_IP,
            FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE
        );

        if ($validPublic === false) {
            return true;
        }

        // Additional explicit check for cloud metadata endpoint (169.254.169.254)
        if (str_starts_with($ip, '169.254.')) {
            return true;
        }

        return false;
    }

    /**
     * Parse HTML body to extract titles, text, phones, and emails.
     */
    protected function parseHtmlContent(string $html): array
    {
        $title = '';
        if (preg_match('#<title[^>]*>(.*?)</title>#is', $html, $matches)) {
            $title = trim(html_entity_decode($matches[1], ENT_QUOTES | ENT_HTML5, 'UTF-8'));
        }

        $description = '';
        if (preg_match('#<meta[^>]+name=[\'"]description[\'"][^>]+content=[\'"]([^\'"]+)[\'"]#is', $html, $matches)) {
            $description = trim(html_entity_decode($matches[1], ENT_QUOTES | ENT_HTML5, 'UTF-8'));
        }

        // Extract phone numbers (common international and national patterns)
        preg_match_all('/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/', $html, $phoneMatches);
        $phones = array_values(array_unique(array_filter($phoneMatches[0] ?? [])));

        // Extract email addresses
        preg_match_all('/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/', $html, $emailMatches);
        $emails = array_values(array_unique(array_filter($emailMatches[0] ?? [])));

        // Strip scripts, styles, and extract readable text
        $cleanHtml = preg_replace('#<script(.*?)>(.*?)</script>#is', '', $html);
        $cleanHtml = preg_replace('#<style(.*?)>(.*?)</style>#is', '', $cleanHtml);
        $cleanHtml = preg_replace('#<nav(.*?)>(.*?)</nav>#is', '', $cleanHtml);
        $cleanHtml = preg_replace('#<footer(.*?)>(.*?)</footer >#is', '', $cleanHtml);
        $plainText = trim(strip_tags($cleanHtml));
        $plainText = preg_replace('/[ \t]+/', ' ', $plainText);
        $plainText = preg_replace('/(\r?\n){3,}/', "\n\n", $plainText);

        return [
            'title' => Str::limit($title, 150),
            'description' => Str::limit($description, 300),
            'text' => Str::limit($plainText, 8000),
            'phones' => array_slice($phones, 0, 5),
            'emails' => array_slice($emails, 0, 5),
        ];
    }
}
