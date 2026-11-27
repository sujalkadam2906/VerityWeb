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
        Schema::create('business_facts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_project_id')->constrained('business_projects')->cascadeOnDelete();
            $table->foreignId('business_evidence_id')->nullable()->constrained('business_evidences')->nullOnDelete();
            $table->string('fact_type', 100); // identity, contact, location, schedule, service, pricing, description
            $table->string('fact_key', 100);  // name, phone, address, hours, services, tagline
            $table->text('fact_value');
            $table->string('source_label', 255);
            $table->string('status', 50)->default('needs_review'); // confirmed, needs_review, conflicting, unverified, rejected
            $table->float('confidence')->nullable();
            $table->unsignedBigInteger('conflict_with_id')->nullable();
            $table->text('conflict_explanation')->nullable();
            $table->boolean('user_confirmed')->default(false);
            $table->timestamps();

            $table->index(['business_project_id', 'status']);
            $table->index(['business_project_id', 'fact_key']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('business_facts');
    }
};
