<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('business_evidences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_project_id')->constrained('business_projects')->cascadeOnDelete();
            $table->string('file_path')->nullable();
            $table->string('file_name');
            $table->string('file_type', 50)->default('document'); // document, image, url, manual
            $table->unsignedBigInteger('file_size')->nullable();
            $table->string('mime_type', 100)->nullable();
            $table->text('source_url')->nullable();
            $table->longText('extracted_text')->nullable();
            $table->string('status', 50)->default('pending'); // pending, processed, failed, scanned_needs_ocr
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['business_project_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('business_evidences');
    }
};
