<?php

namespace App\Services;

use App\Models\BusinessEvidence;
use App\Models\BusinessProject;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class DocumentProcessingService
{
    protected const ALLOWED_MIMES = [
        'application/pdf' => 'pdf',
        'image/jpeg' => 'image',
        'image/png' => 'image',
        'image/webp' => 'image',
    ];

    protected const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    /**
     * Store and process an uploaded evidence file.
     */
    public function processUpload(BusinessProject $project, UploadedFile $file): BusinessEvidence
    {
        $mime = $file->getMimeType() ?: $file->getClientMimeType();
        $size = $file->getSize();
        $originalName = $file->getClientOriginalName();
        $extension = strtolower($file->getClientOriginalExtension());

        // Validate MIME and Extension
        if (!array_key_exists($mime, self::ALLOWED_MIMES)) {
            // Also check extension in case of ambiguous client mime
            if ($extension === 'pdf') {
                $mime = 'application/pdf';
            } elseif (in_array($extension, ['jpg', 'jpeg'])) {
                $mime = 'image/jpeg';
            } elseif ($extension === 'png') {
                $mime = 'image/png';
            } elseif ($extension === 'webp') {
                $mime = 'image/webp';
            } else {
                throw new \InvalidArgumentException("Unsupported file type [{$mime}]. Allowed: PDF, JPEG, PNG, WEBP.");
            }
        }

        if ($size > self::MAX_FILE_SIZE) {
            throw new \InvalidArgumentException("File exceeds maximum allowed size of 10MB.");
        }

        // Generate safe randomized filename
        $safeFileName = Str::random(32) . '.' . $extension;
        $relativeDir = "evidence/{$project->id}";
        $path = $file->storeAs($relativeDir, $safeFileName, 'local');

        $fileType = self::ALLOWED_MIMES[$mime] ?? 'document';
        $fullPath = Storage::disk('local')->path($path);

        $extractedText = null;
        $status = 'processed';
        $metadata = [
            'original_name' => $originalName,
            'extension' => $extension,
            'size' => $size,
        ];

        if ($fileType === 'pdf') {
            $pdfResult = $this->extractPdfText($fullPath);
            $extractedText = $pdfResult['text'];
            if ($pdfResult['is_scanned'] && empty($extractedText)) {
                $status = 'scanned_needs_ocr';
                $metadata['scanned_note'] = 'Document appears to be scanned or contains image-only pages. Text extraction requires OCR or vision processing.';
            }
        } elseif ($fileType === 'image') {
            $imageInfo = @getimagesize($fullPath);
            if ($imageInfo) {
                $metadata['width'] = $imageInfo[0];
                $metadata['height'] = $imageInfo[1];
                $metadata['channels'] = $imageInfo['channels'] ?? null;
            }
        }

        return BusinessEvidence::create([
            'business_project_id' => $project->id,
            'file_path' => $path,
            'file_name' => $originalName,
            'file_type' => $fileType,
            'file_size' => $size,
            'mime_type' => $mime,
            'extracted_text' => $extractedText,
            'status' => $status,
            'metadata' => $metadata,
        ]);
    }

    /**
     * Pure PHP extraction of text from text-based PDF files.
     * Identifies uncompressed and FlateDecode compressed streams.
     */
    public function extractPdfText(string $filePath): array
    {
        if (!file_exists($filePath)) {
            return ['text' => '', 'is_scanned' => false];
        }

        $content = @file_get_contents($filePath);
        if ($content === false || strlen($content) < 32) {
            return ['text' => '', 'is_scanned' => true];
        }

        $extractedChunks = [];

        // Match all PDF stream objects
        preg_match_all('#stream[\r\n]+(.*?)[\r\n]+endstream#s', $content, $streamMatches);

        if (!empty($streamMatches[1])) {
            foreach ($streamMatches[1] as $stream) {
                // Try decompressing with gzuncompress
                $decompressed = @gzuncompress($stream);
                if ($decompressed === false) {
                    // Try gzinflate if gzuncompress fails
                    $decompressed = @gzinflate($stream);
                }
                if ($decompressed === false) {
                    $decompressed = $stream; // Might be uncompressed text
                }

                $text = $this->parsePdfStreamText($decompressed);
                if (!empty($text)) {
                    $extractedChunks[] = $text;
                }
            }
        }

        $fullText = trim(implode("\n", $extractedChunks));
        $fullText = preg_replace('/[ \t]+/', ' ', $fullText);
        $fullText = preg_replace('/(\r?\n){3,}/', "\n\n", $fullText);

        $isScanned = (strlen($fullText) < 40);

        return [
            'text' => $fullText,
            'is_scanned' => $isScanned,
        ];
    }

    /**
     * Extract string literals from PDF text blocks (Tj, TJ operators).
     */
    protected function parsePdfStreamText(string $stream): string
    {
        $streamText = '';

        // Extract BT ... ET text blocks
        preg_match_all('#BT(.*?)ET#s', $stream, $textBlocks);

        if (empty($textBlocks[1])) {
            return '';
        }

        foreach ($textBlocks[1] as $block) {
            // Match (string) Tj
            if (preg_match_all('#\((.*?)\)\s*Tj#s', $block, $tjMatches)) {
                foreach ($tjMatches[1] as $match) {
                    $streamText .= $this->decodePdfEscapeSequences($match) . ' ';
                }
            }

            // Match [ (str1) -120 (str2) ] TJ array text
            if (preg_match_all('#\[(.*?)\]\s*TJ#s', $block, $tjArrayMatches)) {
                foreach ($tjArrayMatches[1] as $arrayContent) {
                    if (preg_match_all('#\((.*?)\)#s', $arrayContent, $arrayStrings)) {
                        foreach ($arrayStrings[1] as $str) {
                            $streamText .= $this->decodePdfEscapeSequences($str);
                        }
                        $streamText .= ' ';
                    }
                }
            }
        }

        return trim($streamText);
    }

    protected function decodePdfEscapeSequences(string $str): string
    {
        $str = str_replace(
            ['\\n', '\\r', '\\t', '\\(', '\\)', '\\\\'],
            ["\n", "\r", "\t", '(', ')', '\\'],
            $str
        );

        // Octal escape sequences: \000 to \377
        return preg_replace_callback('/\\\\([0-7]{1,3})/', function ($matches) {
            return chr(octdec($matches[1]));
        }, $str);
    }
}
