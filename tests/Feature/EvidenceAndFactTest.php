<?php

namespace Tests\Feature;

use App\Models\BusinessEvidence;
use App\Models\BusinessFact;
use App\Models\BusinessProject;
use App\Models\User;
use App\Services\DocumentProcessingService;
use App\Services\FactExtractionService;
use App\Services\SourceResearchService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class EvidenceAndFactTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('local');
    }

    public function test_document_processing_service_extracts_pdf_text(): void
    {
        $service = new DocumentProcessingService();

        // Construct a synthetic minimal PDF with text stream
        $rawPdf = "%PDF-1.4\n1 0 obj\n<< /Length 55 >>\nstream\nBT\n/F1 12 Tf\n(Verity Artisan Coffee - Organic Pour Over) Tj\nET\nendstream\nendobj\nxref\n0 2\n0000000000 65535 f \n0000000009 00000 n \ntrailer\n<< /Size 2 /Root 1 0 R >>\nstartxref\n110\n%%EOF";

        $tempPath = tempnam(sys_get_temp_dir(), 'pdf_test');
        file_put_contents($tempPath, $rawPdf);

        $result = $service->extractPdfText($tempPath);
        @unlink($tempPath);

        $this->assertStringContainsString('Verity Artisan Coffee', $result['text']);
        $this->assertFalse($result['is_scanned']);
    }

    public function test_scanned_pdf_without_text_is_detected(): void
    {
        $service = new DocumentProcessingService();

        // Synthetic scanned PDF with image but no text streams
        $rawPdf = "%PDF-1.4\n1 0 obj\n<< /Type /XObject /Subtype /Image >>\nstream\n\xFF\xD8\xFF\xE0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00endstream\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF";

        $tempPath = tempnam(sys_get_temp_dir(), 'pdf_scanned_test');
        file_put_contents($tempPath, $rawPdf);

        $result = $service->extractPdfText($tempPath);
        @unlink($tempPath);

        $this->assertTrue($result['is_scanned']);
        $this->assertEmpty($result['text']);
    }

    public function test_safe_file_upload_and_storage_with_project_association(): void
    {
        $user = User::factory()->create();
        $project = BusinessProject::create([
            'user_id' => $user->id,
            'name' => 'Cafe Aurora',
            'city' => 'Portland',
            'slug' => 'cafe-aurora',
        ]);

        $service = new DocumentProcessingService();
        $file = UploadedFile::fake()->create('menu.pdf', 100, 'application/pdf');

        $evidence = $service->processUpload($project, $file);

        $this->assertEquals($project->id, $evidence->business_project_id);
        $this->assertEquals('pdf', $evidence->file_type);
        $this->assertEquals('menu.pdf', $evidence->file_name);
        $this->assertNotNull($evidence->file_path);
        Storage::disk('local')->assertExists($evidence->file_path);
    }

    public function test_ssrf_protection_blocks_internal_and_private_ips(): void
    {
        $service = new SourceResearchService();

        // Localhost
        $this->assertFalse($service->validateUrlSafety('http://127.0.0.1/status')['safe']);
        $this->assertFalse($service->validateUrlSafety('http://localhost:8000/metrics')['safe']);
        $this->assertFalse($service->validateUrlSafety('http://0.0.0.0/')['safe']);

        // AWS/GCP/Azure Cloud Metadata Endpoint
        $this->assertFalse($service->validateUrlSafety('http://169.254.169.254/latest/meta-data/')['safe']);

        // RFC 1918 Private Ranges
        $this->assertTrue($service->isPrivateOrReservedIp('10.0.0.1'));
        $this->assertTrue($service->isPrivateOrReservedIp('172.16.0.1'));
        $this->assertTrue($service->isPrivateOrReservedIp('192.168.1.1'));

        // Disallowed scheme
        $this->assertFalse($service->validateUrlSafety('ftp://files.example.com/data')['safe']);
        $this->assertFalse($service->validateUrlSafety('file:///etc/passwd')['safe']);
    }

    public function test_intake_facts_are_synced_automatically(): void
    {
        $user = User::factory()->create();
        $project = BusinessProject::create([
            'user_id' => $user->id,
            'name' => 'Precision Dental Care',
            'city' => 'Chicago',
            'category' => 'Dental Clinic',
            'phone' => '+1 (312) 555-0199',
            'address' => '100 Michigan Ave',
            'description' => 'Comprehensive family dentistry and cosmetic care.',
            'slug' => 'precision-dental',
        ]);

        $factService = new FactExtractionService();
        $factService->syncIntakeFacts($project);

        $this->assertDatabaseHas('business_facts', [
            'business_project_id' => $project->id,
            'fact_key' => 'name',
            'fact_value' => 'Precision Dental Care',
            'status' => 'confirmed',
        ]);

        $this->assertDatabaseHas('business_facts', [
            'business_project_id' => $project->id,
            'fact_key' => 'phone',
            'fact_value' => '+1 (312) 555-0199',
            'status' => 'confirmed',
        ]);
    }

    public function test_conflicting_facts_are_detected_and_can_be_resolved(): void
    {
        $user = User::factory()->create();
        $project = BusinessProject::create([
            'user_id' => $user->id,
            'name' => 'Cascade Bakery',
            'city' => 'Bend',
            'phone' => '541-555-1111',
            'slug' => 'cascade-bakery',
        ]);

        $factService = new FactExtractionService();
        $factService->syncIntakeFacts($project);

        // Simulate an evidence document with a different phone number
        $evidence = BusinessEvidence::create([
            'business_project_id' => $project->id,
            'file_name' => 'Flyer.pdf',
            'file_type' => 'pdf',
            'extracted_text' => 'Call Cascade Bakery at 541-555-9999 for orders!',
            'status' => 'processed',
            'metadata' => [
                'found_phones' => ['541-555-9999'],
            ],
        ]);

        $factService->extractFromEvidence($evidence);

        // Check that conflict was recorded
        $conflicts = BusinessFact::where('business_project_id', $project->id)
            ->where('status', 'conflicting')
            ->get();

        $this->assertCount(2, $conflicts);

        // Resolve conflict via endpoint
        $chosenFact = $conflicts->where('fact_value', '541-555-9999')->first();
        $response = $this->actingAs($user)->post("/projects/{$project->id}/facts/{$chosenFact->id}/resolve", [
            'action' => 'confirm',
        ]);

        $response->assertSessionHasNoErrors();

        $chosenFact->refresh();
        $this->assertEquals('confirmed', $chosenFact->status);
        $this->assertTrue($chosenFact->user_confirmed);

        $project->refresh();
        $this->assertEquals('541-555-9999', $project->phone);
    }
}
