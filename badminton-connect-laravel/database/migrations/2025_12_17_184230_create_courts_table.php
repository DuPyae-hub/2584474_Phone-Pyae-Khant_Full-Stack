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
        Schema::create('courts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('court_name');
            $table->text('address');
            $table->text('google_map_url')->nullable();
            $table->text('price_rate')->nullable();
            $table->text('opening_hours')->nullable();
            $table->string('contact')->nullable();
            $table->json('images')->nullable();
            $table->decimal('rating', 2, 1)->nullable();
            $table->uuid('created_by_admin')->nullable();
            $table->foreign('created_by_admin')->references('id')->on('users')->onDelete('set null');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('courts');
    }
};
